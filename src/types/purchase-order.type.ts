import type { PurchaseOrderItem } from "./purchase-order-item.type";

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status:
    | "draft"
    | "sent"
    | "confirmed"
    | "partially_received"
    | "completed"
    | "cancelled";
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  createdBy: string;
}
