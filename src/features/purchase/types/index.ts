export interface PurchaseOrderItem {
  MaSP: string | number;
  productName: string;
  MaMau: number | "";
  MaKichThuoc: number | "";
  colorName?: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string | number;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: "draft" | "sent" | "confirmed" | "partially_received" | "completed" | "cancelled";
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy: string | number;
}

export interface Supplier {
  id: string | number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Product {
  id: string | number;
  name: string;
  price: number;
  description?: string;
  category?: string;
}

export interface Color {
  MaMau: number;
  TenMau: string;
  MaHex?: string;
}

export interface Size {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

export interface ProductColorSize {
  colors: Color[];
  sizes: Size[];
}

export interface POForm {
  supplierId: string;
  expectedDeliveryDate: string;
  notes: string;
  items: Omit<PurchaseOrderItem, "totalPrice">[];
}

export interface PurchaseOrderStats {
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalValue: number;
  monthlyOrders: number;
}

export interface PurchaseOrderLoading {
  purchaseOrders: boolean;
  suppliers: boolean;
  products: boolean;
  creating: boolean;
  updating: boolean;
  refreshing: boolean;
}

export interface PurchaseOrderFilters {
  searchQuery: string;
  statusFilter: string;
} 