import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem("namchepoints_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("namchepoints_token");
      localStorage.removeItem("namchepoints_type");
      window.location.href = "/customer/auth";
    }
    return Promise.reject(e);
  },
);

export default api;
