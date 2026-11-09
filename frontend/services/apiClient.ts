import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

// Environment variable with fallback for local dev
// Backend routes are all mounted under /api. If VITE_API_URL points at a bare
// host (e.g. https://my-backend.onrender.com), append /api so requests like
// /auth/signup don't hit a non-existent root path and 404.
const normalizeApiUrl = (raw?: string): string => {
  const url = (raw || '').trim().replace(/\/+$/, '');
  if (!url) return '/api';
  return /\/api(\/v\d+)?$/.test(url) ? url : `${url}/api`;
};

export const API_URL = normalizeApiUrl((import.meta as any).env?.VITE_API_URL as string);

// In-memory access token storage (never stored in localStorage/cookies)
let memoryAccessToken: string | null = null;

export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getMemoryAccessToken = () => memoryAccessToken;

// ---------------------------------------------------------------------
// Persistent login ("remember me")
//
// The refresh token is kept in an HTTP-only cookie AND mirrored in
// localStorage. The cookie is the primary mechanism, but browsers that
// block third-party cookies (Safari, Brave, Chrome incognito) drop it when
// the frontend and backend live on different domains (e.g. Vercel +
// Render). The localStorage copy is sent in the request body as a fallback
// so the user stays signed in across reloads and browser restarts for the
// whole refresh-token lifetime (7 days, renewed on every use).
// ---------------------------------------------------------------------
const REFRESH_TOKEN_KEY = 'nexusflow.refreshToken';

export const getStoredRefreshToken = (): string | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  } catch {
    return null;
  }
};

export const setStoredRefreshToken = (token: string | null) => {
  try {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode etc.) - cookie-only is fine.
  }
};

// Centralized Axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
  // Generous: free hosting tiers (e.g. Render) can take ~30-60s to wake up.
  timeout: 60000,
});


/**
 * Single-flight session refresh. Refresh tokens rotate on every use, so two
 * concurrent refreshes with the same token (React StrictMode double-mount,
 * two tabs, several 401s at once) would look like token reuse and get the
 * whole session revoked. Everything that needs a new access token goes
 * through this one shared promise.
 */
let refreshInFlight: Promise<any> | null = null;

export const refreshSession = (): Promise<any> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const stored = getStoredRefreshToken();
    const response = await apiClient.post(
      '/auth/refresh',
      stored ? { refreshToken: stored } : {},
      { _skipAuthRefresh: true } as any
    );
    const authData = response.data?.data || response.data;
    if (!authData?.accessToken) {
      throw new Error('Refresh response missing access token');
    }
    setMemoryAccessToken(authData.accessToken);
    if (authData.refreshToken) setStoredRefreshToken(authData.refreshToken);
    return authData;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

// Request Interceptor: Attach bearer token if present in memory
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (memoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Custom interface for extended request config
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response Interceptor: Handle 401 token refresh & error formatting
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!error.response) {
      // Network or connection error
      return Promise.reject({
        message: 'Network error. Please check your connection to NexusFlow backend.',
        status: 0,
        originalError: error,
      });
    }

    const status = error.response.status;

    // Handle 401 Unauthorized errors with single-retry refresh loop
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup') &&
      !(originalRequest as any)._skipAuthRefresh
    ) {
      originalRequest._retry = true;

      try {
        const authData = await refreshSession();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Only forget the stored login if the server actually rejected it
        // (not on network blips / cold starts).
        if ([400, 401, 403, 422].includes(refreshError?.status)) {
          setStoredRefreshToken(null);
        }
        setMemoryAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    // Standardized Error Response
    const serverMessage =
      (error.response.data as any)?.message ||
      (error.response.data as any)?.error ||
      error.message;

    return Promise.reject({
      message: serverMessage,
      status: status,
      data: error.response.data,
    });
  }
);
