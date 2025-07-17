export interface GoodsReceiptItem {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  selectedColor: string;
  selectedSize: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  condition: "good" | "damaged" | "defective";
  notes?: string;
  totalReceivedValue: number;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  items: GoodsReceiptItem[];
  status: "draft" | "completed";
  totalReceivedValue: number;
  receiptDate: string;
  receivedBy: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface GRForm {
  purchaseOrderId: string;
  receivedBy: string;
  notes: string;
  items: Omit<GoodsReceiptItem, "totalReceivedValue">[];
}

export interface GoodsReceiptStats {
  pendingPOs: number;
  monthlyReceipts: number;
  totalValue: number;
}

export interface GoodsReceiptLoading {
  goodsReceipts: boolean;
  purchaseOrders: boolean;
  creating: boolean;
  refreshing: boolean;
} 