import type { CartItem } from "./cart-item.type";

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipping"
    | "delivered"
    | "cancelled"
    | "returned";
  total: number;
  shippingAddress: string;
  orderDate: string;
  deliveryDate?: string;
  paymentMethod: "cod" | "card" | "bank" | "momo";
  notes?: string;
  assignedStaff?: string;
}
