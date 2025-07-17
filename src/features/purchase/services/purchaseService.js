import axiosClient from "../../../services/fetch";

// Lấy danh sách nhà cung cấp
export const getSuppliers = async () => {
  const res = await axiosClient.get("/suppliers");
  return res.data;
};

// Lấy danh sách sản phẩm chi tiết (có size, màu)
export const getProductDetails = async () => {
  const res = await axiosClient.get("/product-details");
  return res.data;
};

// Lấy sản phẩm theo nhà cung cấp
export const getProductsBySupplier = async (supplierId) => {
  const res = await axiosClient.get(`/products/supplier/${supplierId}`);
  return res.data;
};

// Lấy danh sách trạng thái đặt hàng
export const getPurchaseOrderStatuses = async () => {
  const res = await axiosClient.get("/purchase-order-statuses");
  return res.data;
};

// Tạo phiếu đặt hàng mới
export const createPurchaseOrder = async (purchaseOrderData) => {
  // Đảm bảo dữ liệu khớp với database schema
  const formattedData = {
    MaPDH: purchaseOrderData.MaPDH,
    NgayDat: purchaseOrderData.NgayDat,
    MaNV: purchaseOrderData.MaNV,
    MaNCC: purchaseOrderData.MaNCC,
    MaTrangThai: purchaseOrderData.MaTrangThai,
    details: purchaseOrderData.details.map(item => ({
      MaCTSP: item.MaCTSP,
      SoLuong: item.SoLuong,
      DonGia: item.DonGia
    }))
  };
  
  const res = await axiosClient.post("/purchase-orders", formattedData);
  return res.data;
};

// Lấy danh sách phiếu đặt hàng
export const getPurchaseOrders = async () => {
  const res = await axiosClient.get("/purchase-orders");
  return res.data;
};

// Lấy chi tiết phiếu đặt hàng
export const getPurchaseOrderById = async (id) => {
  const res = await axiosClient.get(`/purchase-orders/${id}`);
  return res.data;
};

// Cập nhật trạng thái phiếu đặt hàng
export const updatePurchaseOrderStatus = async (id, statusId) => {
  const res = await axiosClient.put(`/purchase-orders/${id}/status`, { MaTrangThai: statusId });
  return res.data;
}; 