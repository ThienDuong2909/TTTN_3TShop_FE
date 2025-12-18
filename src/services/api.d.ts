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
export function getAllSuppliers(): Promise<{ data: any[] }>;
export function createSupplier(data: any): Promise<any>;
export function updateSupplier(supplierId: string | number, data: any): Promise<any>;
export function deleteSupplier(supplierId: string | number): Promise<any>;
export function getSupplierById(supplierId: string | number): Promise<any>;
export function getProductDetails(): Promise<any[]>;
export function getPurchaseOrderReceivedStatus(id: string): Promise<any>;

// Supplier functions
export function getSuppliers(page?: number): Promise<any>;
export function getAllSuppliers(): Promise<{ data: any[] }>;
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
export function getAllSuppliers(): Promise<{ data: any[] }>;

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
export function getAvailableDeliveryStaff(deliveryTime: string, address: string): Promise<{
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

// Delivery Staff functions
export function getAssignedOrders(params?: { page?: number; limit?: number; status?: string }): Promise<any>;
export function confirmOrderDelivery(orderId: number): Promise<any>;

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
  maHex: string;
  tenKichThuoc: string;
}): Promise<any>;

export function updateCartItemQuantity(data: {
  maKH: number;
  maCTSP: number;
  soLuong: number;
}): Promise<{
  status: string;
  data: {
    MaDDH: number;
    items: Array<{
      maCTDDH: number;
      soLuong: number;
      donGia: string;
      maCTSP: number;
      sanPham: any;
      mau?: { hex: string };
      kichThuoc?: { ten: string };
      anhSanPham?: string;
    }>;
  };
  message: string;
}>;

export function getCartItemsApi(maKH: string | number): Promise<any>;
export function removeFromCartApi(maKH: number, maSP: number, maHex: string, tenKichThuoc: string, donGia: number): Promise<any>;
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
export function createPayOSLink(maKH: number | string): Promise<{
  data: {
    checkoutUrl: string;
    qrCode?: string;
  }
}>;

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
export function getOrderDetail(payload: { maKH: number, maDDH: number | string }): Promise<any>;

// Review functions
export function submitReview(reviewData: { MaCTDonDatHang: number; MoTa: string; SoSao: number }): Promise<any>;
export function submitMultipleReviews(reviewList: Array<{ maCTDonDatHang: number; moTa: string; soSao: number }>): Promise<any>;
export function getProductComments(productId: number): Promise<any>;

// Auth functions
export function login(credentials: { email: string; password: string }): Promise<any>;
export function googleLogin(idToken: string): Promise<any>;
export function register(userData: { Email: string; Password: string; TenKH: string }): Promise<any>;

export function getRevenueReport(startDate: string, endDate: string): Promise<any>;


export function cancelOrder(maKH: number, maDDH: number): Promise<any>;
export function getCategoryById(id: number): Promise<Category>;


export function getCustomerProfile(): Promise<{
  success: boolean;
  message: string;
  data: {
    MaKH: number;
    TenKH: string;
    DiaChi: string;
    SDT: string;
    CCCD: string;
    MaTK: number;
    NgaySinh: string | null;
    GioiTinh: string | null;
    AnhDaiDien: string | null;
  };
}>;

export function updateCustomerProfile(maKH: number, profileData: {
  TenKH: string;
  DiaChi: string;
  SDT: string;
  CCCD: string;
  NgaySinh: string | null;
  GioiTinh: string | null;
}): Promise<any>;

// Cập nhật interface trong api.d.ts
export interface UploadAvatarRequest {
  maKH: string | number; // ID của khách hàng
  AnhDaiDien: string;     // URL của ảnh từ Cloudinary
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data?: {
    maKH: string | number;
    AnhDaiDien: string;
  };
}

// Cập nhật function signature
export declare function uploadAvatar(avatarData: UploadAvatarRequest): Promise<UploadAvatarResponse>;




// ===================
// ACCOUNT SETTINGS TYPES
// ===================
// Cập nhật interface trong api.d.ts
export interface VaiTro {
  MaVaiTro: number;
  TenVaiTro: string;
}

export interface AccountInfo {
  MaTK: number;
  Email: string;
  VaiTro: VaiTro;
}

export interface GetAccountInfoResponse {
  success: boolean;
  message: string;
  data: AccountInfo;
}

export interface ChangePasswordRequest {
  matKhauCu: string;
  matKhauMoi: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// Function declarations
export declare function getAccountInfo(): Promise<GetAccountInfoResponse>;
export declare function changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse>;

// Permissions functions
export function fetchMyPermissions(): Promise<string[]>;
export function fetchAllPermissions(): Promise<Array<{ id: number; Ten: string; TenHienThi: string; NgayTao?: string }>>;
export function fetchAllPermissionsByRole(roleId: number): Promise<Array<{ id: number; Ten: string; TenHienThi: string; NgayTao?: string }>>;
export function fetchEmployeePermissions(nhanVienId: number): Promise<number[]>;
export function assignPermissionsToEmployee(nhanVienId: number, permissionIds: number[]): Promise<any>;


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
export function getAvailableProducts(maDot: string | number): Promise<{
  success: boolean;
  message: string;
  data: {
    dotGiamGia: {
      MaDot: number;
      MoTa: string;
      NgayBatDau: string;
      NgayKetThuc: string;
    };
    availableProducts: Array<{
      MaSP: number;
      TenSP: string;
      MoTa: string;
      GiaHienTai: number;
      TenLoaiSP: string;
      AnhChinh: string;
    }>;
    totalItems: number;
  };
}>;
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


export interface KhachHang {
  MaKH: number;
  TenKH: string;
  SDT: string;
  DiaChi: string;
  CCCD: string;
}

export interface TrangThaiDH {
  MaTTDH: number;
  TrangThai: string;
}

export interface SanPham {
  MaSP: number;
  TenSP: string;
}

export interface KichThuoc {
  TenKichThuoc: string;
}

export interface Mau {
  TenMau: string;
  MaHex: string;
}

export interface ChiTietSanPham {
  SanPham: SanPham;
  KichThuoc: KichThuoc;
  Mau: Mau;
}

export interface CT_DonDatHang {
  MaCTDDH: number;
  SoLuong: number;
  DonGia: string;
  ChiTietSanPham: ChiTietSanPham;
}

export interface DonDatHang {
  MaDDH: number;
  MaKH: number;
  NgayTao: string;
  DiaChiGiao: string;
  NguoiNhan: string;
  SDT: string;
  TongTien: number;
  KhachHang: KhachHang;
  TrangThaiDH: TrangThaiDH;
  CT_DonDatHangs: CT_DonDatHang[];
}

export interface ThongTinThang {
  thang: number;
  nam: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  tongSoDonHang: number;
}

export interface CurrentMonthOrdersData {
  orders: DonDatHang[];
  thongTinThang: ThongTinThang;
}

export interface GetCurrentMonthOrdersResponse {
  success: boolean;
  message: string;
  data: CurrentMonthOrdersData;
}

// Function declaration
export declare function getCurrentMonthOrders(): Promise<GetCurrentMonthOrdersResponse>;


export interface TaiKhoan {
  MaTK: number;
  Email: string;
  Password: string;
  MaVaiTro: number;
  VaiTro: {
    MaVaiTro: number;
    TenVaiTro: string;
  };
}

export interface BoPhan {
  MaBoPhan: number;
  TenBoPhan: string;
  NgayTao: string;
  TrangThai: boolean;
}

export interface NhanVien_BoPhan {
  MaNV: number;
  MaBoPhan: number;
  NgayBatDau: string;
  NgayKetThuc: string | null;
  ChucVu: string | null;
  TrangThai: string;
  GhiChu: string | null;
  BoPhan: BoPhan;
}

export interface KhuVucPhuTrach {
  MaKhuVuc: string;
  TenKhuVuc: string;
  NhanVien_KhuVuc: {
    NgayTao: string;
    TrangThai: number;
  };
}

export interface Employee {
  MaNV: number;
  TenNV: string;
  NgaySinh: string;
  DiaChi: string;
  Luong: string;
  MaTK: number;
  TaiKhoan: TaiKhoan;
  NhanVien_BoPhans: NhanVien_BoPhan[];
  KhuVucPhuTrach: KhuVucPhuTrach[];
}

export interface GetAllEmployeesResponse {
  success: boolean;
  message: string;
  data: Employee[];
}

// Function declaration
export declare function getAllEmployees(): Promise<GetAllEmployeesResponse>;


export interface SanPham_PDH {
  MaSP: number;
  TenSP: string;
  MaLoaiSP: number;
  MaNCC: number;
  MoTa: string;
  TrangThai: boolean;
  NgayTao: string;
}

export interface KichThuoc_PDH {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

export interface Mau_PDH {
  MaMau: number;
  TenMau: string;
  MaHex: string;
  NgayTao: string;
  TrangThai: boolean;
}

export interface ChiTietSanPham_PDH {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  SanPham: SanPham_PDH;
  KichThuoc: KichThuoc_PDH;
  Mau: Mau_PDH;
}

export interface CT_PhieuDatHangNCC {
  MaPDH: string;
  MaCTSP: number;
  SoLuong: number;
  DonGia: string;
  ChiTietSanPham: ChiTietSanPham_PDH;
}

export interface NhanVien_PDH {
  MaNV: number;
  TenNV: string;
  NgaySinh: string;
  DiaChi: string;
  Luong: string;
  MaTK: number;
}

export interface NhaCungCap_PDH {
  MaNCC: number;
  TenNCC: string;
  DiaChi: string;
  SDT: string;
  Email: string;
}

export interface TrangThaiDatHangNCC {
  MaTrangThai: number;
  TenTrangThai: string;
}

export interface PhieuDatHangNCC {
  MaPDH: string;
  NgayDat: string;
  NgayKienNghiGiao: string | null;
  MaNV: number;
  MaNCC: number;
  MaTrangThai: number;
  CT_PhieuDatHangNCCs: CT_PhieuDatHangNCC[];
  NhanVien: NhanVien_PDH;
  NhaCungCap: NhaCungCap_PDH;
  TrangThaiDatHangNCC: TrangThaiDatHangNCC;
}

export interface GetPurchaseOrdersNCCResponse {
  success: boolean;
  message: string;
  data: PhieuDatHangNCC[];
}

// Function declaration
export declare function getPurchaseOrdersNCC(): Promise<GetPurchaseOrdersNCCResponse>;

// ===================
// DELIVERY AREA MANAGEMENT TYPES
// ===================

export interface KhuVuc {
  MaKhuVuc: string; // Change to string to match actual data
  TenKhuVuc: string;
}

export interface KhuVucGiaoHang extends KhuVuc {
  MaNVKV: number;
  NgayBatDau: string;
  NgayTao?: string;
}

export interface KhuVucData {
  MaNV?: number;
  TenNV?: number;
  KhuVucPhuTrach: KhuVucGiaoHang[];
}

export interface NewAreaSelection {
  MaKhuVuc: string; // Change to string to match actual data
  TenKhuVuc: string;
  NgayBatDau: string;
}

export interface GetEmployeeAreasResponse {
  success: boolean;
  message: string;
  data: KhuVucData;
}

export interface GetAvailableAreasResponse {
  success: boolean;
  message: string;
  data: {
    KhuVucChuaPhuTrach: KhuVuc[];
  };
}

export interface RemoveEmployeeAreasRequest {
  danhSachMaNVKV: string[];
}

export interface AddEmployeeAreasRequest {
  danhSachKhuVuc: Array<{
    MaKhuVuc: string;
    NgayBatDau: string;
  }>;
}

export interface EmployeeAreaApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Function declarations
export declare function getEmployeeAreas(employeeId: number): Promise<GetEmployeeAreasResponse>;
export declare function getAvailableAreasForEmployee(employeeId: number): Promise<GetAvailableAreasResponse>;
export declare function removeEmployeeAreas(areaIds: number[]): Promise<EmployeeAreaApiResponse>;
export declare function addEmployeeAreas(employeeId: number, areaData: Array<{ MaKhuVuc: string; NgayBatDau: string }>): Promise<EmployeeAreaApiResponse>;

// Inventory Report
export declare function getInventoryReport(reportDate: string): Promise<{
  success: boolean;
  message: string;
  data: {
    ngayBaoCao: string;
    data: Array<{
      "Loại sản phẩm": string;
      "Mã sản phẩm": number;
      "Tên sản phẩm": string;
      "Số lượng tồn": string;
      "Giá nhập": string;
    }>;
  };
}>;

export declare function getInventoryReportPDF(reportDate: string, nguoiLap: string): Promise<Blob>;

// Profit Report
export declare function getProfitReport(ngayBatDau: string, ngayKetThuc: string): Promise<{
  success: boolean;
  message: string;
  data: {
    data: Array<{
      stt: number;
      loaiSanPham: string;
      maSanPham: number;
      tenSanPham: string;
      tongTriGiaNhap: number;
      tongTriGiaXuat: number;
      loiNhuan: number;
      phanTramLoiNhuan: number;
      tongTriGiaNhapFormatted: string;
      tongTriGiaXuatFormatted: string;
      loiNhuanFormatted: string;
      phanTramLoiNhuanFormatted: string;
    }>;
    summary: {
      tongTriGiaNhapTotal: number;
      tongTriGiaXuatTotal: number;
      tongLoiNhuan: number;
      phanTramLoiNhuanTrungBinh: number;
      tongTriGiaNhapTotalFormatted: string;
      tongTriGiaXuatTotalFormatted: string;
      tongLoiNhuanFormatted: string;
      phanTramLoiNhuanTrungBinhFormatted: string;
      soLuongSanPham: number;
    };
    ngayBatDau: string;
    ngayKetThuc: string;
  };
}>;

export declare function getProfitReportPDF(ngayBatDau: string, ngayKetThuc: string, nguoiLap: string): Promise<Blob>;

export interface RecommendationProduct {
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
  BinhLuan?: {
    avgRate: number;
    luotBinhLuan: number;
  };
  _rec?: {
    MaCTSP: number;
    MaSP: number;
    score: number;
    confidence: number;
    support: number;
    lift: number;
    antecedent: number[];
    rule_size: number;
  };
}

export interface RecommendationGroup {
  antecedent: number[];
  antecedentLength: number;
  products: RecommendationProduct[];
}

export interface RecommendationResponse {
  success: boolean;
  message: string;
  data: {
    recommendations: {
      groups: RecommendationGroup[];
      maxAntecedentLength: number;
      totalGroups: number;
    };
    params: {
      k: number;
      exclude_incart: boolean;
      require_instock: boolean;
    };
  };
}

export declare function refreshFPGrowthCache(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}>;

export declare function getProductRecommendations(
  items: number[],
  k?: number,
  excludeIncart?: boolean,
  requireInstock?: boolean
): Promise<RecommendationResponse>;

// ===================
// FP-GROWTH CONFIG API
// ===================

export interface FPGrowthConfigData {
  min_sup: number;
  min_conf: number;
  transactions?: number;
  rules?: number;
}

export interface FPGrowthConfig {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    data: FPGrowthConfigData;
  };
}

export interface FPGrowthUpdateData {
  old_config: {
    min_sup: number;
    min_conf: number;
  };
  new_config: {
    min_sup: number;
    min_conf: number;
  };
  transactions: number;
  rules: number;
}

export interface FPGrowthConfigResponse {
  success: boolean;
  message: string;
  data: FPGrowthConfigData;
}

export interface FPGrowthUpdateResponse {
  success: boolean;
  message: string;
  data: FPGrowthUpdateData;
}

export declare function getFPGrowthConfig(): Promise<FPGrowthConfig>;

export declare function updateFPGrowthConfig(configData: { min_sup: number; min_conf: number }): Promise<FPGrowthUpdateResponse>;

// FP-Growth Rules
export interface FPGrowthRule {
  rule_id: number;
  antecedent_ids: number[];
  consequent_id: number;
  itemset: number[];
  support: number;
  confidence: number;
  lift: number;
  antecedent_products: any[];
  consequent_product: any;
  interpretation: string;
}

export interface FPGrowthRulesResponse {
  success: boolean;
  message: string;
  data: {
    model_info: {
      id: number;
      transactions: number;
      min_sup: number;
      min_conf: number;
      total_rules: number;
      created_at: string;
    };
    rules: FPGrowthRule[];
    total: number;
    limit: number;
    offset: number;
  };
}

export declare function getFPGrowthRules(params?: { limit?: number; offset?: number }): Promise<FPGrowthRulesResponse>;
export interface Province {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
  wards: any[];
}

export interface Ward {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  province_code: number;
  district_code: number;
}

export function getProvinces(): Promise<Province[]>;
export function getWards(): Promise<Ward[]>;
