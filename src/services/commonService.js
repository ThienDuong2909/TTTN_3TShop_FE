// Import từ file API đơn giản
import {
  getEmployees,
  getCurrentEmployee,
  getSuppliers,
  getProducts,
  getProductsBySupplier,
  getProductDetails,
  getProductColorsSizes,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  getAvailablePurchaseOrders,
  getPurchaseOrderForReceipt,
  getGoodsReceipts,
  createGoodsReceipt,
  getGoodsReceiptById,
  updateInventoryAfterReceipt,
  getColors,
  getSizes,
  getPurchaseOrderStatuses,
} from "./api";

// ===================
// EMPLOYEE SERVICES
// ===================

// Lấy danh sách nhân viên
export { getEmployees };

// Lấy thông tin nhân viên hiện tại
export { getCurrentEmployee };

// ===================
// BASIC DATA SERVICES
// ===================

// Lấy danh sách màu sắc
export { getColors };

// Lấy danh sách kích thước
export { getSizes };

// Lấy danh sách nhà cung cấp
export { getSuppliers };

// Lấy danh sách trạng thái đặt hàng
export { getPurchaseOrderStatuses };

// ===================
// PRODUCT SERVICES
// ===================

// Lấy danh sách sản phẩm chi tiết (có size, màu)
export { getProductDetails };

// Lấy màu và kích thước theo sản phẩm
export { getProductColorsSizes };

// Lấy sản phẩm theo nhà cung cấp
export { getProductsBySupplier };

// ===================
// PURCHASE ORDER SERVICES
// ===================

// Tạo phiếu đặt hàng mới
export { createPurchaseOrder };

// Cập nhật phiếu đặt hàng
export { updatePurchaseOrder };

// Lấy danh sách phiếu đặt hàng
export { getPurchaseOrders };

// Lấy chi tiết phiếu đặt hàng
export { getPurchaseOrderById };

// Cập nhật trạng thái phiếu đặt hàng
export { updatePurchaseOrderStatus };

// Lấy danh sách phiếu đặt hàng có thể tạo phiếu nhập
export { getAvailablePurchaseOrders };

// Lấy chi tiết phiếu đặt hàng để tạo phiếu nhập
export { getPurchaseOrderForReceipt };

// ===================
// GOODS RECEIPT SERVICES
// ===================

// Tạo phiếu nhập hàng mới
export { createGoodsReceipt };

// Lấy danh sách phiếu nhập hàng
export { getGoodsReceipts };

// Lấy chi tiết phiếu nhập hàng
export { getGoodsReceiptById };

// Cập nhật số lượng tồn kho sau khi nhập hàng
export { updateInventoryAfterReceipt };

// ===================
// EXPORT TẤT CẢ SERVICES
// ===================

// Export default object cho tiện sử dụng
export default {
  // Employee
  getEmployees,
  getCurrentEmployee,
  
  // Basic Data
  getColors,
  getSizes,
  getSuppliers,
  getPurchaseOrderStatuses,
  
  // Product
  getProducts,
  getProductsBySupplier,
  getProductDetails,
  getProductColorsSizes,
  
  // Purchase Order
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  getAvailablePurchaseOrders,
  getPurchaseOrderForReceipt,
  
  // Goods Receipt
  getGoodsReceipts,
  createGoodsReceipt,
  getGoodsReceiptById,
  updateInventoryAfterReceipt,
}; 