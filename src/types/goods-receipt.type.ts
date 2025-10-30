import type { GoodsReceiptItem } from "./goods-receipt-item.type";

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
  attachments?: string[];
}
