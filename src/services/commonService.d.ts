// Purchase Order functions
export function getPurchaseOrders(): Promise<any[]>;
export function createPurchaseOrder(data: any): Promise<any>;
export function getPurchaseOrderById(id: string): Promise<any>;
export function updatePurchaseOrderStatus(id: string, statusId: number): Promise<any>;
export function getSuppliers(): Promise<any[]>;
export function getEmployees(): Promise<any[]>;
export function getPurchaseOrderStatuses(): Promise<any[]>;
export function getProductDetails(): Promise<any[]>;
export function getProductColorsSizes(productId: string): Promise<any>;

// Goods Receipt functions
export function getGoodsReceipts(): Promise<any[]>;
export function createGoodsReceipt(data: any): Promise<any>;
export function getGoodsReceiptById(id: string): Promise<any>;
export function updateInventoryAfterReceipt(id: string): Promise<void>;
export function getAvailablePurchaseOrders(): Promise<any[]>;
export function getPurchaseOrderForReceipt(id: string): Promise<any>;

// Basic data functions
export function getColors(): Promise<any[]>;
export function getSizes(): Promise<any[]>;

// Default export
declare const commonService: {
  getPurchaseOrders(): Promise<any[]>;
  createPurchaseOrder(data: any): Promise<any>;
  getPurchaseOrderById(id: string): Promise<any>;
  updatePurchaseOrderStatus(id: string, statusId: number): Promise<any>;
  getSuppliers(): Promise<any[]>;
  getEmployees(): Promise<any[]>;
  getPurchaseOrderStatuses(): Promise<any[]>;
  getProductDetails(): Promise<any[]>;
  getProductColorsSizes(productId: string): Promise<any>;
  getGoodsReceipts(): Promise<any[]>;
  createGoodsReceipt(data: any): Promise<any>;
  getGoodsReceiptById(id: string): Promise<any>;
  updateInventoryAfterReceipt(id: string): Promise<void>;
  getAvailablePurchaseOrders(): Promise<any[]>;
  getPurchaseOrderForReceipt(id: string): Promise<any>;
  getColors(): Promise<any[]>;
  getSizes(): Promise<any[]>;
};

export default commonService; 