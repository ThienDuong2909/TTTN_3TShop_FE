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
  // TẠM THỜI BYPASS AUTHENTICATION CHO TEST
  // Thêm một token dummy hoặc comment out để test
  // config.headers.Authorization = `Bearer dummy-token-for-testing`;
  return config;
});

// Xử lý response và error đơn giản
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    console.error("Error response:", error.response);
    console.error("Error request:", error.request);
    console.error("Error config:", error.config);
    
    // Xử lý lỗi 401 (unauthorized) - tự động logout
    if (error.response?.status === 401) {
      console.error("=== AUTHENTICATION ERROR DEBUG ===");
      console.error("Authentication failed - redirecting to login");
      console.error("Current token:", localStorage.getItem("token"));
      console.error("Error details:", error.response.data);
      console.error("Request URL:", error.config?.url);
      console.error("Request method:", error.config?.method);
      console.error("Request headers:", error.config?.headers);
      console.error("Full error:", error);
      console.error("=== END DEBUG ===");
      
      // setTimeout(() => {
      //   localStorage.removeItem("token");
      //   window.location.href = "/login";
      // }, 2000);
      
    }
    
    return Promise.reject(error);
  }
);

export default api;
