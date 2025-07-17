import axiosClient from "../../../services/fetch";

// Lấy danh sách phiếu đặt hàng có thể tạo phiếu nhập
export const getAvailablePurchaseOrders = async () => {
  const res = await axiosClient.get("/purchase-orders/available-for-receipt");
  return res.data;
};

// Lấy chi tiết phiếu đặt hàng để tạo phiếu nhập
export const getPurchaseOrderForReceipt = async (purchaseOrderId) => {
  const res = await axiosClient.get(`/purchase-orders/${purchaseOrderId}/for-receipt`);
  return res.data;
};

// Tạo phiếu nhập hàng mới
export const createGoodsReceipt = async (goodsReceiptData) => {
  // Đảm bảo dữ liệu khớp với database schema
  const formattedData = {
    SoPN: goodsReceiptData.SoPN,
    NgayNhap: goodsReceiptData.NgayNhap,
    MaPDH: goodsReceiptData.MaPDH,
    MaNV: goodsReceiptData.MaNV,
    details: goodsReceiptData.details.map(item => ({
      MaCTSP: item.MaCTSP,
      SoLuong: item.SoLuong,
      DonGia: item.DonGia
    }))
  };
  
  const res = await axiosClient.post("/goods-receipts", formattedData);
  return res.data;
};

// Lấy danh sách phiếu nhập hàng
export const getGoodsReceipts = async () => {
  const res = await axiosClient.get("/goods-receipts");
  return res.data;
};

// Lấy chi tiết phiếu nhập hàng
export const getGoodsReceiptById = async (id) => {
  const res = await axiosClient.get(`/goods-receipts/${id}`);
  return res.data;
};

// Cập nhật số lượng tồn kho sau khi nhập hàng
export const updateInventoryAfterReceipt = async (receiptId) => {
  const res = await axiosClient.put(`/goods-receipts/${receiptId}/update-inventory`);
  return res.data;
}; 