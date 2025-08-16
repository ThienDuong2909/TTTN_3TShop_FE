// Purchase Order functions
export function getPurchaseOrders(): Promise<any[]>;
export function createPurchaseOrder(data: any): Promise<any>;
export function getPurchaseOrderById(id: string): Promise<any>;
export function updatePurchaseOrderStatus(id: string, statusId: number): Promise<any>;
export function getPurchaseOrderStatuses(): Promise<any[]>;
export function getProductDetails(): Promise<any[]>;
export function getPurchaseOrderReceivedStatus(id: string): Promise<any>;

// Supplier functions
export function getSuppliers(page?: number): Promise<any>;
export function getAllSuppliers(): Promise<{data: any[]}>;
export function createSupplier(data: any): Promise<any>;
export function updateSupplier(supplierId: string | number, data: any): Promise<any>;
export function deleteSupplier(supplierId: string | number): Promise<any>;
export function getSupplierById(supplierId: string | number): Promise<any>;
export function getProductDetails(): Promise<any[]>;
export function getPurchaseOrderReceivedStatus(id: string): Promise<any>;

// Supplier functions
export function getSuppliers(page?: number): Promise<any>;
export function getAllSuppliers(): Promise<{data: any[]}>;
export function createSupplier(data: any): Promise<any>;
export function updateSupplier(supplierId: string | number, data: any): Promise<any>;
export function deleteSupplier(supplierId: string | number): Promise<any>;
export function getSupplierById(supplierId: string | number): Promise<any>;

// Department functions
export function getDepartments(): Promise<any>;
export function createDepartment(data: any): Promise<any>;
export function updateDepartment(departmentId: string | number, data: any): Promise<any>;
export function updateDepartmentStatus(departmentId: string | number, status: number): Promise<any>;
export function getDepartmentById(departmentId: string | number): Promise<any>;

// Employee functions
export function getEmployees(): Promise<any>;
export function getCurrentEmployee(): Promise<any>;
export function createEmployee(data: any): Promise<any>;
export function updateEmployee(employeeId: string | number, data: any): Promise<any>;
export function transferEmployee(data: any): Promise<any>;
export function getEmployeeWorkHistory(employeeId: string | number): Promise<any>;
export function getEmployeeById(employeeId: string | number): Promise<any>;

// Product Detail functions
export function getProductDetailById(id: string | number): Promise<any>;
export function addProductDetail(data: any): Promise<any>;
export function updateProductStock(stockUpdates: any[]): Promise<any>;

// Lookup functions
export function getSizes(): Promise<{
  success: boolean;
  message: string;
  data: any[];
}>;
export function getColors(): Promise<{
  success: boolean;
  message: string;
  data: any[];
}>;
export function createColor(colorData: any): Promise<any>;
export function updateColor(colorId: string | number, colorData: any): Promise<any>;
export function deleteColor(colorId: string | number): Promise<any>;
export function getCategories(): Promise<any[]>;
export function getAllSuppliers(): Promise<{data: any[]}>;

// Product functions  
export function createProduct(productData: any): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}>;

// Orders functions
export function getOrdersByStatus(status: string): Promise<any>;
export function getOrderStatistics(): Promise<any>;
export function getOrderDetailById(orderId: string | number): Promise<any>;
export function updateOrderStatus(orderId: number, statusData: any): Promise<any>;
export function updateBatchOrderStatus(ordersData: any): Promise<any>;
export function getAvailableDeliveryStaff(address: string): Promise<{
  success: boolean;
  message: string;
  data: Array<{
    MaNV: number;
    TenNV: string;
    DiaChi: string;
    SoDonDangGiao: number;
    KhuVucPhuTrach: string | null;
  }>;
}>;
export function assignDelivery(assignmentData: any): Promise<any>;
export function updateOrderDeliveryStaff(orderId: number, data: { maNVGiao: number }): Promise<ApiResponse>;

export function updateBatchOrderCompletion(orders: Array<{ id: number; maTTDH: number; maNVDuyet: number }>): Promise<ApiResponse>;

export function updateOrderCompletion(orderId: number, data: { maTTDH: number; maNVDuyet: number }): Promise<ApiResponse>;

// Goods Receipt functions
export function getGoodsReceipts(): Promise<any[]>;
export function createGoodsReceipt(data: any): Promise<any>;
export function getGoodsReceiptById(id: string): Promise<any>;
export function updateInventoryAfterReceipt(id: string): Promise<void>;
export function getAvailablePurchaseOrders(): Promise<any[]>;
export function getPurchaseOrderForReceipt(id: string): Promise<any>;

// Utility functions
export function formatPrice(amount: number): string;
export function formatDate(date: string | Date): string;
export function formatDateForApi(date: string | Date): string;
export function showError(message: string): void;
export function showSuccess(message: string): void; 

// Product functions
export function getAllProducts(): Promise<any[]>;
export function getProductDetail(id: string | number): Promise<any>;
export function getProductsBySupplier(supplierId: string | number): Promise<any[]>;
// Cart functions
export function addToCartApi(data: {
  maKH: number;
  maSP: number;
  soLuong: number;
  maHex: number;
  tenKichThuoc: number;
}): Promise<any>;

export function getCartItemsApi (maKH: string | number): Promise<any>;
export function removeFromCartApi (maKH: number, maSP :number, maHex : string, tenKichThuoc: string, donGia: number): Promise<any>;
export interface OrderProduct {
  maSP: number;
  soLuong: number;
  MaHex: string;
  TenKichThuoc: string;
}

export interface CreateOrderPayload {
  maKH: number;
  nguoiNhan: string;
  diaChiGiao: string;
  dsSanPham: OrderProduct[];
}

export function createOrder(data: CreateOrderPayload): Promise<any>;

export function checkStockAvailability(maCTSP: number): Promise<{ soLuongTon: number }>;
export declare const clearCartApi: (maKH: number) => Promise<any>;

export interface Category {
  MaLoaiSP: number;
  TenLoai: string;
  HinhMinhHoa?: string;
  soLuongSanPham: number;
}

export declare function getAllCategories(): Promise<Category[]>;

export declare function getProductsByCategory(id: number): Promise<any[]>;


export function getCurrentExchangeRate(): Promise<number>;
// ...existing code...

export function getBestSellerProducts(): Promise<any[]>;

// ...existing code...
export function getNewProducts(): Promise<any[]>;

export function getDiscountProducts(): Promise<any[]>;
export function getSearchProducts(q: string): Promise<any[]>;

export function getCustomerOrders(maKH: number): Promise<any[]>;
export function getOrderDetail(payload: { maKH: number, maDDH: number|string }): Promise<any>;

// Review functions
export function submitReview(reviewData: { MaCTDonDatHang: number; MoTa: string; SoSao: number }): Promise<any>;
export function submitMultipleReviews(reviewList: Array<{ maCTDonDatHang: number; moTa: string; soSao: number }>): Promise<any>;
export function getProductComments(productId: number): Promise<any>;

// Auth functions
export function login(credentials: { email: string; password: string }): Promise<any>;
export function register(userData: { Email: string; Password: string; TenKH: string }): Promise<any>;

export function getRevenueReport(startDate: string, endDate: string): Promise<any>;


export function cancelOrder(maKH: number, maDDH: number): Promise<any>;

// Return Request functions
export function createReturnSlip(returnData: { 
  maDDH: number; 
  danhSachSanPham: Array<{ maCTDDH: number; soLuongTra: number }>; 
  lyDo: string 
}): Promise<any>;
export function getReturnRequests(): Promise<any>;
export function getReturnRequestsByStatus(status: number): Promise<any>;
export function getReturnSlipsByStatus(status: number): Promise<any>;
export function updateReturnSlipStatus(returnSlipId: string | number, statusData: any): Promise<any>;
export function createReturnPayment(paymentData: any): Promise<any>;

// Discount/Promotion functions
export function getPromotions(): Promise<any>;
export function getPromotionById(promotionId: string | number): Promise<any>;
export function createPromotion(promotionData: any): Promise<any>;
export function updatePromotion(promotionId: string | number, promotionData: any): Promise<any>;
export function deletePromotion(promotionId: string | number): Promise<any>;
export function getProductsForPromotion(): Promise<any>;
export function getAvailableProductsForPromotion(): Promise<{
  success: boolean;
  message: string;
  data: Array<{
    MaSP: number;
    TenSP: string;
    MaLoaiSP: number;
    MaNCC: number;
    MoTa: string;
    TrangThai: boolean;
    NgayTao: string;
    NhaCungCap: {
      MaNCC: number;
      TenNCC: string;
      DiaChi: string;
      SDT: string;
      Email: string;
    };
    LoaiSP: {
      MaLoaiSP: number;
      TenLoai: string;
      NgayTao: string;
      HinhMinhHoa: string;
    };
    AnhSanPhams: Array<{
      MaAnh: number;
      MaSP: number;
      TenFile: string;
      DuongDan: string;
      AnhChinh: boolean;
      ThuTu: number;
      MoTa: string;
    }>;
    ChiTietSanPhams: Array<{
      MaCTSP: number;
      MaKichThuoc: number;
      MaMau: number;
      SoLuongTon: number;
      KichThuoc: {
        TenKichThuoc: string;
      };
      Mau: {
        TenMau: string;
        MaHex: string;
      };
    }>;
    CT_DotGiamGia: Array<any>;
    ThayDoiGia: Array<{
      Gia: string;
      NgayApDung: string;
    }>;
  }>;
}>;
export function getDiscountProducts(): Promise<any>;
export function removeProductFromPromotion(maDot: string | number, maSP: string | number): Promise<any>;
export function addProductToPromotion(maDot: string | number, productData: {
  danhSachSanPham: Array<{
    maSP: number;
    phanTramGiam: number;
  }>;
}): Promise<any>;
export function validatePromotionPeriod(ngayBatDau: string, ngayKetThuc: string): Promise<{
  success: boolean;
  message: string;
  data: {
    valid: boolean;
    message: string;
    conflicts: Array<{
      MaDot: number,
      NgayBatDau: string,
      NgayKetThuc: string,
      MoTa: string
    }>
  };
}>;

// Areas functions
export function getAreas(): Promise<Array<{
  MaKhuVuc: string;
  TenKhuVuc: string;
}>>;

// Category functions
export function getCategories(): Promise<Array<{
  MaLoaiSP: number;
  TenLoai: string;
  NgayTao: string;
  HinhMinhHoa?: string;
}>>;
export function createCategory(data: {
  TenLoai: string;
  HinhMinhHoa: string;
}): Promise<any>;
export function updateCategory(categoryId: string | number, data: {
  TenLoai: string;
  HinhMinhHoa: string;
}): Promise<any>;
export function deleteCategory(categoryId: string | number): Promise<any>;
export function getCategoryById(categoryId: string | number): Promise<any>;

// Product Management functions
export function getProducts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}): Promise<{
  success: boolean;
  data: Array<{
    MaSP: number;
    TenSP: string;
    MaLoaiSP: number;
    MaNCC: number;
    MoTa: string;
    TrangThai: boolean;
    NhaCungCap: {
      MaNCC: number;
      TenNCC: string;
      DiaChi: string;
      SDT: string;
      Email: string;
    };
    LoaiSP: {
      MaLoaiSP: number;
      TenLoai: string;
      NgayTao: string;
      HinhMinhHoa?: string;
    };
    AnhSanPhams: Array<{
      MaAnh: number;
      MaSP: number;
      TenFile: string;
      DuongDan: string;
      AnhChinh: boolean;
      ThuTu: number;
      MoTa: string;
    }>;
    ThayDoiGia: Array<{
      MaSP: number;
      NgayThayDoi: string;
      Gia: string;
      NgayApDung: string;
    }>;
    ChiTietSanPhams: Array<{
      MaCTSP: number;
      MaKichThuoc: number;
      MaMau: number;
      SoLuongTon: number;
      KichThuoc: {
        TenKichThuoc: string;
      };
      Mau: {
        TenMau: string;
        MaHex: string;
      };
    }>;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}>;

export function updateProduct(productId: string | number, updateData: {
  TenSP: string;
  MaLoaiSP: number;
  MoTa: string;
  TrangThai: boolean;
  images: Array<{
    url: string;
    TenFile: string;
    AnhChinh: number;
    ThuTu: number;
    MoTa: string;
  }>;
  Gia?: number;
  NgayApDung?: string;
}): Promise<{
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}>;

export function updateProductStatus(productId: string | number, status: boolean): Promise<{
  success: boolean;
  message: string;
  data?: any;
}>;

export function getProductByIdForManagement(productId: string | number): Promise<{
  success: boolean;
  message: string;
  data?: any;
}>;

export function createProduct(productData: {
  TenSP: string;
  MaLoaiSP: number;
  MoTa: string;
  TrangThai: boolean;
  images: Array<{
    url: string;
    TenFile: string;
    AnhChinh: number;
    ThuTu: number;
    MoTa: string;
  }>;
  Gia: number;
  NgayApDung: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: any;
}>;

export function deleteProduct(productId: string | number): Promise<{
  success: boolean;
  message: string;
  data?: any;
}>;

// Invoice functions
export function getInvoiceDetail(invoiceNumber: string | number): Promise<any>;
export function getInvoiceByOrderId(orderId: string | number): Promise<any>;
export function createInvoice(invoiceData: any): Promise<any>;
