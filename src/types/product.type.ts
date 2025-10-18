export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  colors: string[];
  sizes: string[];
  rating: number;
  discount: number;
  isNew: boolean;
}
