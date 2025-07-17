export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: "draft" | "sent" | "confirmed" | "partially_received" | "completed" | "cancelled";
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
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