// Purchase Order functions
export function getPurchaseOrders(): Promise<any[]>;
export function createPurchaseOrder(data: any): Promise<any>;
export function getPurchaseOrderById(id: string): Promise<any>;
export function updatePurchaseOrderStatus(id: string, statusId: number): Promise<any>;
export function getSuppliers(): Promise<any[]>;
export function getEmployees(): Promise<any[]>;
export function getPurchaseOrderStatuses(): Promise<any[]>;
export function getProductDetails(): Promise<any[]>;
export function getPurchaseOrderReceivedStatus(id: string): Promise<any>;

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


// Auth functions
export function login(credentials: { email: string; password: string }): Promise<any>;
export function register(userData: { Email: string; Password: string; TenKH: string }): Promise<any>;

export function getRevenueReport(startDate: string, endDate: string): Promise<any>;


export function cancelOrder(maKH: number, maDDH: number): Promise<any>;
export function getCategoryById(id: number): Promise<Category>;

