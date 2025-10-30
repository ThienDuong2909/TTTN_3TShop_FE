export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
