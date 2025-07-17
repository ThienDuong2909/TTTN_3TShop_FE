import axios from "axios";

// Tạo axios instance đơn giản
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý response và error đơn giản
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    
    // Xử lý lỗi 401 (unauthorized) - tự động logout
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;
