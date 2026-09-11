import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send/receive the httpOnly JWT cookies set by the backend
});

// Attach the in-memory access token (set by AuthContext after login) as a
// fallback / for clients that can't rely on cookies (e.g. some mobile webviews).
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, try a silent refresh once, then give up (AuthContext handles redirect to login).
let isRefreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        isRefreshing = false;
        return api(original);
      } catch {
        isRefreshing = false;
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);
