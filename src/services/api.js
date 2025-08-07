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
  // Return error object instead of throwing to prevent page reload
  return { error: true, message };
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

// Lấy chi tiết sản phẩm theo ID (cho AdminProductDetail)
export const getProductDetailById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Thêm chi tiết sản phẩm (variant)
export const addProductDetail = async (data) => {
  try {
    const response = await api.post("/products/add-detail", data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật tồn kho sản phẩm
export const updateProductStock = async (stockUpdates) => {
  try {
    const response = await api.post("/products/update-stock", stockUpdates);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy màu và kích thước theo sản phẩm
export const getProductColorsSizes = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}/colors-sizes`);
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
      NgayKienNghiGiao: formatDateForApi(data.NgayKienNghiGiao),
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
      NgayKienNghiGiao: formatDateForApi(data.NgayKienNghiGiao),
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

// Lấy trạng thái nhập hàng của từng sản phẩm trong phiếu đặt hàng NCC
export const getPurchaseOrderReceivedStatus = async (purchaseOrderId) => {
  try {
    const response = await api.get(
      `/purchase-orders/${purchaseOrderId}/received-status`
    );
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
// ORDERS API
// ===================

// ===================
// ORDER MANAGEMENT API
// ===================

// Lấy danh sách đơn hàng theo trạng thái
export const getOrdersByStatus = async (status) => {
  try {
    const response = await api.get(`/orders/by-status?status=${status}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thống kê đơn hàng
export const getOrderStatistics = async () => {
  try {
    const response = await api.get("/orders/statistics");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy chi tiết đơn hàng theo ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái đơn hàng đơn lẻ
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, statusData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái đơn hàng hàng loạt
export const updateBatchOrderStatus = async (ordersData) => {
  try {
    const response = await api.put("/orders/batch/status", ordersData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách nhân viên giao hàng có sẵn
export const getAvailableDeliveryStaff = async (address) => {
  try {
    const response = await api.post("/employees/delivery/available", { diaChi: address });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật nhân viên giao hàng cho đơn hàng
export const updateOrderDeliveryStaff = async (orderId, staffData) => {
  try {
    const response = await api.put(`/orders/${orderId}/delivery-staff`, staffData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Hoàn tất đơn hàng hàng loạt
export const updateBatchOrderCompletion = async (orders) => {
  try {
    const response = await api.put("/orders/batch/status", { orders });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Hoàn tất đơn hàng đơn lẻ
export const updateOrderCompletion = async (orderId, data) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// DELIVERY STAFF API
// ===================

// Lấy đơn hàng được phân công cho nhân viên giao hàng
export const getAssignedOrders = async (params = {}) => {
  try {
    const { page = 1, limit = 10, status } = params;
    let url = `/orders/delivery/assigned?page=${page}&limit=${limit}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xác nhận hoàn thành giao hàng
export const confirmOrderDelivery = async (orderId) => {
  try {
    const response = await api.put(`/orders/delivery/${orderId}/confirm`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy chi tiết đơn hàng cho admin
export const getOrderDetailById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/detail`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// INVOICE API
// ===================

// Lấy chi tiết hóa đơn theo số hóa đơn
export const getInvoiceDetail = async (invoiceNumber) => {
  try {
    const response = await api.get(`/invoices/detail/${invoiceNumber}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy hóa đơn theo mã đơn hàng
export const getInvoiceByOrderId = async (orderId) => {
  try {
    const response = await api.get(`/invoices/order/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo hóa đơn mới
export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post("/invoices", invoiceData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// RETURN REQUEST API
// ===================

// Tạo yêu cầu trả hàng
export const createReturnRequest = async (returnData) => {
  try {
    const response = await api.post("/return/request", returnData);
    return response.data;
  } catch (error) {
    return handleError(error);
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
    return handleError(error);
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

export const getRevenueReport = async (startDate, endDate) => {
  try {
    const response = await api.post(`/orders/revenue-report`, {
      ngayBatDau: startDate,
      ngayKetThuc: endDate,
    });
    console.log("Revenue Report Response:", response.data.data);

    return response.data?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const cancelOrder = async (maKH, maDDH) => {
  try {
    const response = await api.post("/orders/cancel", { maKH, maDDH });
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};


export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/category/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin danh mục:", error);
    throw error;
    }
};

// ===================
// REVIEW/COMMENT API
// ===================

// Submit product review
export const submitReview = async (reviewData) => {
  try {
    const response = await api.post("/binh-luan", {
      maCTDonDatHang: reviewData.MaCTDonDatHang,
      moTa: reviewData.MoTa,
      soSao: reviewData.SoSao,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Submit multiple product reviews
export const submitMultipleReviews = async (reviewList) => {
  try {
    const response = await api.post("/binh-luan", {
      binhLuanList: reviewList.map(review => ({
        maCTDonDatHang: review.maCTDonDatHang,
        moTa: review.moTa,
        soSao: review.soSao,
      }))
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get product comments/reviews
export const getProductComments = async (productId) => {
  try {
    const response = await api.get(`/comments/product/${productId}`);
    return response.data?.data || { comments: [], summary: null };
  } catch (error) {
    console.error("Error fetching product comments:", error);
    return { comments: [], summary: null };
  }
};

// ===================
// RETURN REQUESTS API
// ===================

// Lấy danh sách yêu cầu trả hàng
export const getReturnRequests = async () => {
  try {
    const response = await api.get("/return/requests");
    return response.data;
  } catch (error) {
    return handleError(error);

  }
};
