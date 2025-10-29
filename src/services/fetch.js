import axios from "axios";

// Tạo axios instance đơn giản
const api = axios.create({
  // baseURL: "https://api.3tshop.thienduong.info/api",
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
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp < currentTime) {
        // Token hết hạn: xóa token, không redirect ở đây để tránh reload không mong muốn
        // Việc điều hướng sẽ do response interceptor xử lý khi nhận 401 ở các API khác
        console.warn("Token has expired, removing from storage");
        localStorage.removeItem("token");
        return config;
      }

      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Error parsing token:", error);
      localStorage.removeItem("token");
      // Không redirect tại request phase để tránh vòng lặp reload khi đang ở trang login
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
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/register");
      const hasToken = Boolean(localStorage.getItem("token"));

      // Nếu là lỗi từ trang đăng nhập/đăng ký, hoặc không có token -> để caller tự xử lý, KHÔNG redirect
      if (isAuthEndpoint || !hasToken) {
        return Promise.reject(error);
      }

      // Hiển thị thông báo cho user
      if (window.toast) {
        window.toast.error(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );
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
