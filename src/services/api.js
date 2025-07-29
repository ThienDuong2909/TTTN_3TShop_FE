import { data } from "react-router-dom";
import api from "./fetch";

// ===================
// HELPER FUNCTIONS
// ===================

// Xử lý lỗi đơn giản
const handleError = (error) => {
  const message =
    error.response?.data?.message || error.message || "Có lỗi xảy ra";
  console.error("API Error:", message);
  throw new Error(message);
};

// Format date cho API
const formatDateForApi = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

// ===================
// EMPLOYEE API
// ===================

// Lấy danh sách nhân viên
export const getEmployees = async () => {
  try {
    const response = await api.get("/employees");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy thông tin nhân viên hiện tại
export const getCurrentEmployee = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// SUPPLIER API
// ===================

// Lấy danh sách nhà cung cấp
export const getSuppliers = async () => {
  try {
    const response = await api.get("/suppliers");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo nhà cung cấp mới
export const createSupplier = async (data) => {
  try {
    const response = await api.post("/suppliers", data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// PRODUCT API
// ===================

// Lấy danh sách sản phẩm
export const getProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy sản phẩm theo nhà cung cấp
export const getProductsBySupplier = async (supplierId) => {
  try {
    const response = await api.get(`/products/supplier/${supplierId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy chi tiết sản phẩm
export const getProductDetails = async () => {
  try {
    const response = await api.get("/product-details");
    console.log("getProductDetails response:", response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy màu và kích thước theo sản phẩm
export const getProductColorsSizes = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}/colors-sizes`);
    console.log("getProductColorsSizes response:", response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// PURCHASE ORDER API
// ===================

// Lấy danh sách đơn đặt hàng
export const getPurchaseOrders = async () => {
  try {
    const response = await api.get("/purchase-orders");
    console.log("getPurchaseOrders response:", response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo đơn đặt hàng mới
export const createPurchaseOrder = async (data) => {
  try {
    console.log("=== API createPurchaseOrder ===");
    console.log("Input data:", data);

    const orderData = {
      MaPDH: data.MaPDH,
      NgayDat: formatDateForApi(data.NgayDat),
      MaNV: data.MaNV,
      MaNCC: data.MaNCC,
      MaTrangThai: data.MaTrangThai,
      details: data.details.map((item) => {
        console.log("Processing item:", item);
        const mappedItem = {
          MaSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.SoLuong,
          DonGia: item.DonGia,
          ThanhTien: item.ThanhTien,
        };
        console.log("Mapped item:", mappedItem);
        return mappedItem;
      }),
    };

    console.log("Final orderData:", orderData);
    console.log("Sending to backend:", JSON.stringify(orderData, null, 2));

    const response = await api.post("/purchase-orders", orderData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy đơn đặt hàng theo ID
export const getPurchaseOrderById = async (id) => {
  try {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật phiếu đặt hàng
export const updatePurchaseOrder = async (id, data) => {
  try {
    console.log("=== API updatePurchaseOrder ===");
    console.log("ID:", id);
    console.log("Input data:", data);

    const orderData = {
      MaPDH: id,
      NgayDat: formatDateForApi(
        data.NgayDat || new Date().toISOString().split("T")[0]
      ),
      MaNV: data.MaNV || 1,
      MaNCC: data.MaNCC,
      MaTrangThai: data.MaTrangThai || 1,
      GhiChu: data.GhiChu || "",
      details: data.details.map((item) => {
        console.log("Processing item:", item);
        const mappedItem = {
          MaSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.SoLuong,
          DonGia: item.DonGia,
          ThanhTien: item.ThanhTien,
        };
        console.log("Mapped item:", mappedItem);
        return mappedItem;
      }),
    };

    console.log("Final orderData:", orderData);
    console.log("Sending to backend:", JSON.stringify(orderData, null, 2));

    const response = await api.put(`/purchase-orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật trạng thái đơn đặt hàng
export const updatePurchaseOrderStatus = async (id, statusId) => {
  try {
    const response = await api.put(`/purchase-orders/${id}/status`, {
      MaTrangThai: statusId,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy đơn đặt hàng có thể tạo phiếu nhập
export const getAvailablePurchaseOrders = async () => {
  try {
    const response = await api.get("/purchase-orders/available-for-receipt");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy chi tiết đơn đặt hàng để tạo phiếu nhập
export const getPurchaseOrderForReceipt = async (id) => {
  try {
    const response = await api.get(`/purchase-orders/${id}/for-receipt`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// GOODS RECEIPT API
// ===================

// Lấy danh sách phiếu nhập hàng
export const getGoodsReceipts = async () => {
  try {
    const response = await api.get("/goods-receipts");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo phiếu nhập hàng mới
export const createGoodsReceipt = async (data) => {
  try {
    const receiptData = {
      SoPN: data.SoPN,
      NgayNhap: formatDateForApi(data.NgayNhap),
      MaPDH: data.MaPDH,
      MaNV: data.MaNV,
      details: data.details.map((item) => ({
        MaCTSP: item.MaCTSP,
        SoLuong: item.SoLuong,
        DonGia: item.DonGia,
        TinhTrang: item.TinhTrang || "good",
        GhiChu: item.GhiChu || "",
      })),
    };

    const response = await api.post("/goods-receipts", receiptData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy phiếu nhập hàng theo ID
export const getGoodsReceiptById = async (id) => {
  try {
    const response = await api.get(`/goods-receipts/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật tồn kho sau khi nhập hàng
export const updateInventoryAfterReceipt = async (receiptId) => {
  try {
    const response = await api.put(
      `/goods-receipts/${receiptId}/update-inventory`
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// BASIC DATA API
// ===================

// Lấy danh sách màu sắc
export const getColors = async () => {
  try {
    const response = await api.get("/colors");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy danh sách size
export const getSizes = async () => {
  try {
    const response = await api.get("/sizes");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy danh sách trạng thái đơn đặt hàng
export const getPurchaseOrderStatuses = async () => {
  try {
    const response = await api.get("/purchase-order-statuses");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// AUTH API
// ===================

// Đăng nhập
export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Đăng ký
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// UTILITY FUNCTIONS
// ===================

// Show loading toast
export const showLoading = (message = "Đang tải...") => {
  // Implement your loading toast here
  console.log(message);
};

// Show success toast
export const showSuccess = (message = "Thành công!") => {
  // Implement your success toast here
  console.log(message);
};

// Show error toast
export const showError = (message = "Có lỗi xảy ra!") => {
  // Implement your error toast here
  console.error(message);
};

// Format giá tiền
export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

// Format ngày tháng để hiển thị
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export { formatDateForApi };

//Product-api
export const getAllProducts = async () => {
  try {
    const response = await api.get("/san-pham");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi gọi API sản phẩm:", error);
    throw error;
  }
};
export const getProductDetail = async (id) => {
  try {
    const response = await api.get(`/san-pham/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    throw error;
  }
};

export const addToCartApi = async (data) => {
  try {
    const response = await api.post("/gio-hang/them", data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};
export const getCartItemsApi = async (maKH) => {
  const response = await api.get(`/gio-hang/${maKH}`);
  return response.data.data; // dữ liệu giỏ hàng
};

export const removeFromCartApi = async (
  maKH,
  maSP,
  maHex,
  tenKichThuoc,
  donGia
) => {
  try {
    const response = await api.delete("/gio-hang/xoa", {
      data: { maKH, maSP, maHex, tenKichThuoc, donGia },
    });
    return response.data.data; // trả lại cart cập nhật nếu cần
  } catch (error) {
    console.error("Lỗi xoá sản phẩm khỏi giỏ hàng:", error);
    throw error;
  }
};

export const createOrder = async (payload) => {
  const response = await api.post("/gio-hang/dat-hang", payload);
  return response.data;
};

// services/api.js

export async function checkStockAvailability(maCTSP) {
  const response = await api.post("/san-pham/kiem-tra-ton-kho", { maCTSP });
  return response.data.data;
}
export const clearCartApi = async (maKH) => {
  const response = await api.post("/gio-hang/xoa-tat-ca", { maKH });
  return response.data.data;
};
// Lấy tất cả danh mục sản phẩm
// Giả sử API trả về danh mục theo đường dẫn "/loai-sp" hoặc "/category"
export const getAllCategories = async () => {
  try {
    const response = await api.get("/category/");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw error;
  }
};
export const getProductsByCategory = async (id) => {
  const res = await api.post(`/category/products`, { maLoaiSP: id });
  return res.data.data;
};

// ...existing code...

export const getCurrentExchangeRate = async () => {
  try {
    const res = await api.get("/tigia/co-hieu-luc");
    return res.data.data?.GiaTri; // trả về số, ví dụ: 24000
  } catch (error) {
    console.error("Lỗi lấy tỉ giá:", error);
    throw error;
  }
};

export const getBestSellerProducts = async () => {
  try {
    const res = await api.get("/san-pham/best-sellers");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
    throw error;
  }
};

export const getNewProducts = async () => {
  try {
    const res = await api.get("/san-pham/new-product");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm mới:", error);
    throw error;
  }
};

export const getDiscountProducts = async () => {
  try {
    const res = await api.get("/san-pham/discount");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm giảm giá:", error);
    throw error;
  }
};

export const getSearchProducts = async (q) => {
  try {
    const res = await api.get(
      `/san-pham/search?keyword=${encodeURIComponent(q)}`
    );
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    throw error;
  }
};

export const getCustomerOrders = async (maKH) => {
  try {
    const res = await api.post("/gio-hang/don-hang", { maKH });
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng khách hàng:", error);
    throw error;
  }
};

export const getOrderDetail = async ({ maKH, maDDH }) => {
  try {
    const res = await api.post("/gio-hang/don-hang/chi-tiet", { maKH, maDDH });
    return res.data?.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    throw error;
  }
};
