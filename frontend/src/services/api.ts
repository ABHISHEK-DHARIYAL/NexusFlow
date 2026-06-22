import axios from "axios";

let envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
console.log("Original VITE_API_BASE_URL from env:", envBaseUrl);

// Self-healing check: If the page is running on a cloud preview domain, but the API URL
// points to localhost/127.0.0.1, we must override it to "/api" relative routing.
// This prevents browser CORs/Network errors because localhost is not accessible from the browser on the cloud preview.
if (envBaseUrl && (envBaseUrl.includes("localhost") || envBaseUrl.includes("127.0.0.1"))) {
  if (typeof window !== "undefined" && window.location && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    console.warn(`Sanitizing API baseline: Redirecting localhost API base URL (${envBaseUrl}) to relative "/api" of the secure cloud origin (${window.location.hostname})`);
    envBaseUrl = "/api";
  }
}

const API_BASE_URL = envBaseUrl || "/api";
console.log("Auto-negotiated API_BASE_URL:", API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Automatically inject JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch 401 and refresh access token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          // call `/api/auth/refresh` without custom interceptor headers (direct axios)
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = refreshRes.data.accessToken;
          
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("token", newAccessToken); // support any legacy code
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          // Logout user if refresh fails
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshErr);
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
