import type { Product } from "../components/ProductCard";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  donGia?: number;
}
