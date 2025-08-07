import axios from "axios";

// Tạo axios instance đơn giản
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Kiểm tra token có expired không
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        toast.warn("Token has expired, removing from storage");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return config;
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Error parsing token:", error);
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
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
      console.error("=== AUTHENTICATION ERROR DEBUG ===");
      console.error("Authentication failed - token expired or invalid");
      console.error("Current token:", localStorage.getItem("token"));
      console.error("Error details:", error.response?.data);
      
      // Hiển thị thông báo cho user
      if (window.toast) {
        window.toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      
      // Redirect về login sau 1 giây
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 1000);
      
      return Promise.reject(new Error("Authentication failed"));
    }
    
    return Promise.reject(error);
  }
);

export default api;
