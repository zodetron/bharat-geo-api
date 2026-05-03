import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("client_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("client_token");
      window.location.href = "/login";
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
