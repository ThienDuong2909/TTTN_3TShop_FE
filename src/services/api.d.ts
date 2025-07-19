// Purchase Order functions
export function getPurchaseOrders(): Promise<any[]>;
export function createPurchaseOrder(data: any): Promise<any>;
export function getPurchaseOrderById(id: string): Promise<any>;
export function updatePurchaseOrderStatus(id: string, statusId: number): Promise<any>;
export function getSuppliers(): Promise<any[]>;
export function getEmployees(): Promise<any[]>;
export function getPurchaseOrderStatuses(): Promise<any[]>;
export function getProductDetails(): Promise<any[]>;

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
// Cart functions
export function addToCartApi(data: {
  maKH: number;
  maSP: number;
  soLuong: number;
  maHex: number;
  tenKichThuoc: number;
}): Promise<any>;

export function getCartItemsApi (maKH: string | number): Promise<any>;
export function removeFromCartApi (maKH: number, maSP :number, maHex : string, tenKichThuoc: string): Promise<any>;
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