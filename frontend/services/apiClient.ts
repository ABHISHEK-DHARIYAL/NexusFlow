import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

// Environment variable with fallback for local dev
export const API_URL = ((import.meta as any).env?.VITE_API_URL as string) || '/api';

// In-memory access token storage (never stored in localStorage/cookies)
let memoryAccessToken: string | null = null;

export const setMemoryAccessToken = (token: string | null) => {
  memoryAccessToken = token;
};

export const getMemoryAccessToken = () => memoryAccessToken;

// Centralized Axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Refresh token concurrency control variables
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
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
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
        const newAccessToken =
          refreshResponse.data?.data?.accessToken || (refreshResponse.data as any)?.accessToken;

        if (newAccessToken) {
          setMemoryAccessToken(newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh response missing access token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setMemoryAccessToken(null);
        // Clear auth state trigger if needed
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // Trigger redirect or auth state cleanup
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
