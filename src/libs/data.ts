import { Product } from "../components/ProductCard";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string;
  subcategories?: Category[];
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  donGia?: number;
} 

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  address?: string;
  role: "CUSTOMER" | "staff" | "admin";
  department?: string;
  permissions?: string[];
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  isActive?: boolean;
  customerGroup?: "regular" | "vip" | "premium";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  salary?: number;
  hireDate?: string;
  emergencyContact?: string;
}

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

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  products: string[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  staffCount: number;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  applicableProducts?: string[];
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

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

export interface GoodsReceiptItem {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  selectedColor?: string;
  selectedSize?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  condition: "good" | "damaged" | "defective";
  notes?: string;
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
  attachments?: string[];
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Thời trang Nam",
    slug: "nam",
    description: "Bộ sưu tập thời trang nam hiện đại",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    subcategories: [
      {
        id: "1-1",
        name: "Áo sơ mi",
        slug: "ao-so-mi-nam",
        description: "Áo sơ mi nam công sở và casual",
        image:
          "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop",
        parentId: "1",
      },
      {
        id: "1-2",
        name: "Áo thun",
        slug: "ao-thun-nam",
        description: "Áo thun nam chất lượng cao",
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",
        parentId: "1",
      },
      {
        id: "1-3",
        name: "Quần jeans",
        slug: "quan-jeans-nam",
        description: "Quần jeans nam đa dạng kiểu dáng",
        image:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop",
        parentId: "1",
      },
      {
        id: "1-4",
        name: "Áo khoác",
        slug: "ao-khoac-nam",
        description: "Áo khoác nam 4 mùa",
        image:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop",
        parentId: "1",
      },
    ],
  },
  {
    id: "2",
    name: "Thời trang Nữ",
    slug: "nu",
    description: "Bộ sưu tập thời trang nữ thanh lịch",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616c273e185?w=400&h=600&fit=crop",
    subcategories: [
      {
        id: "2-1",
        name: "Váy đầm",
        slug: "vay-dam",
        description: "Váy đầm nữ thanh lịch",
        image:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop",
        parentId: "2",
      },
      {
        id: "2-2",
        name: "Áo kiểu",
        slug: "ao-kieu",
        description: "Áo kiểu nữ đa dạng",
        image:
          "https://images.unsplash.com/photo-1564557287817-3785e38ec1a5?w=400&h=600&fit=crop",
        parentId: "2",
      },
      {
        id: "2-3",
        name: "Chân váy",
        slug: "chan-vay",
        description: "Chân váy nữ thời trang",
        image:
          "https://images.unsplash.com/photo-1583496661160-fb5886a13d74?w=400&h=600&fit=crop",
        parentId: "2",
      },
      {
        id: "2-4",
        name: "Áo blazer",
        slug: "ao-blazer",
        description: "Áo blazer nữ công sở",
        image:
          "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=600&fit=crop",
        parentId: "2",
      },
    ],
  },
  {
    id: "3",
    name: "Trẻ em",
    slug: "tre-em",
    description: "Thời trang trẻ em đáng yêu",
    image:
      "https://images.unsplash.com/photo-1503944168164-b8ec44ca4730?w=400&h=600&fit=crop",
    subcategories: [
      {
        id: "3-1",
        name: "Bé trai",
        slug: "be-trai",
        description: "Thời trang bé trai",
        image:
          "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&h=600&fit=crop",
        parentId: "3",
      },
      {
        id: "3-2",
        name: "Bé gái",
        slug: "be-gai",
        description: "Thời trang bé gái",
        image:
          "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=600&fit=crop",
        parentId: "3",
      },
    ],
  },
  {
    id: "4",
    name: "Phụ kiện",
    slug: "phu-kien",
    description: "Phụ kiện thời trang đa dạng",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=600&fit=crop",
    subcategories: [
      {
        id: "4-1",
        name: "Túi xách",
        slug: "tui-xach",
        description: "Túi xách cao cấp",
        image:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=600&fit=crop",
        parentId: "4",
      },
      {
        id: "4-2",
        name: "Giày dép",
        slug: "giay-dep",
        description: "Giày dép thời trang",
        image:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop",
        parentId: "4",
      },
    ],
  },
];

export const products: Product[] = [
  // Áo sơ mi nam
  {
    id: 1,
    name: "Áo sơ mi nam trắng basic",
    price: 299000,
    originalPrice: 399000,
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop",
    rating: 4.5,
    reviews: 128,
    discount: 25,
    isNew: false,
    isBestSeller: true,
    category: "1-1",
    colors: ["#ffffff", "#000000", "#3b82f6"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },
  {
    id: 2,
    name: "Áo sơ mi nam sọc xanh",
    price: 349000,
    image:
      "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&h=600&fit=crop",
    rating: 4.3,
    reviews: 89,
    isNew: true,
    isBestSeller: false,
    category: "1-1",
    colors: ["#3b82f6", "#ffffff", "#1e293b"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 3,
    name: "Áo sơ mi nam dài tay caro",
    price: 429000,
    originalPrice: 529000,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=600&fit=crop",
    rating: 4.6,
    reviews: 156,
    discount: 19,
    isNew: false,
    isBestSeller: true,
    category: "1-1",
    colors: ["#dc2626", "#1e293b", "#ffffff"],
    sizes: ["M", "L", "XL", "XXL"],
  },

  // Áo thun nam
  {
    id: 4,
    name: "Áo thun nam basic cotton",
    price: 199000,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop",
    rating: 4.7,
    reviews: 203,
    isNew: false,
    isBestSeller: true,
    category: "1-2",
    colors: ["#000000", "#ffffff", "#dc2626", "#3b82f6"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 5,
    name: "Áo thun nam polo",
    price: 279000,
    originalPrice: 329000,
    image:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=600&fit=crop",
    rating: 4.4,
    reviews: 92,
    discount: 15,
    isNew: true,
    isBestSeller: false,
    category: "1-2",
    colors: ["#1e293b", "#dc2626", "#ffffff"],
    sizes: ["S", "M", "L", "XL", "XXL"],
  },

  // Quần jeans nam
  {
    id: 6,
    name: "Quần jeans nam slim fit",
    price: 520000,
    originalPrice: 650000,
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop",
    rating: 4.6,
    reviews: 156,
    discount: 20,
    isNew: false,
    isBestSeller: true,
    category: "1-3",
    colors: ["#1e293b", "#000000"],
    sizes: ["29", "30", "31", "32", "33", "34"],
  },
  {
    id: 7,
    name: "Quần jeans nam ripped",
    price: 589000,
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop",
    rating: 4.2,
    reviews: 78,
    isNew: true,
    isBestSeller: false,
    category: "1-3",
    colors: ["#1e293b", "#374151"],
    sizes: ["29", "30", "31", "32", "33"],
  },

  // Áo khoác nam
  {
    id: 8,
    name: "Áo khoác nam winter jacket",
    price: 899000,
    originalPrice: 1199000,
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop",
    rating: 4.8,
    reviews: 145,
    discount: 25,
    isNew: false,
    isBestSeller: true,
    category: "1-4",
    colors: ["#000000", "#1e293b", "#374151"],
    sizes: ["M", "L", "XL", "XXL"],
  },

  // Váy đầm nữ
  {
    id: 9,
    name: "Váy đầm nữ elegant",
    price: 450000,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop",
    rating: 4.8,
    reviews: 89,
    isNew: true,
    isBestSeller: false,
    category: "2-1",
    colors: ["#ec4899", "#000000", "#f59e0b"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 10,
    name: "Váy đầm dự tiệc",
    price: 679000,
    originalPrice: 849000,
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b3043b8c23?w=400&h=600&fit=crop",
    rating: 4.9,
    reviews: 124,
    discount: 20,
    isNew: false,
    isBestSeller: true,
    category: "2-1",
    colors: ["#000000", "#dc2626", "#1e40af"],
    sizes: ["S", "M", "L"],
  },

  // Áo kiểu nữ
  {
    id: 11,
    name: "Áo kiểu nữ vintage",
    price: 329000,
    image:
      "https://images.unsplash.com/photo-1564557287817-3785e38ec1a5?w=400&h=600&fit=crop",
    rating: 4.5,
    reviews: 67,
    isNew: true,
    isBestSeller: false,
    category: "2-2",
    colors: ["#ffffff", "#f59e0b", "#ec4899"],
    sizes: ["S", "M", "L", "XL"],
  },

  // Chân váy nữ
  {
    id: 12,
    name: "Chân váy nữ công sở",
    price: 279000,
    originalPrice: 349000,
    image:
      "https://images.unsplash.com/photo-1583496661160-fb5886a13d74?w=400&h=600&fit=crop",
    rating: 4.4,
    reviews: 83,
    discount: 20,
    isNew: false,
    isBestSeller: false,
    category: "2-3",
    colors: ["#000000", "#1e293b", "#6b7280"],
    sizes: ["S", "M", "L", "XL"],
  },

  // Áo blazer nữ
  {
    id: 13,
    name: "Áo blazer nữ công sở",
    price: 759000,
    originalPrice: 949000,
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=600&fit=crop",
    rating: 4.7,
    reviews: 156,
    discount: 20,
    isNew: false,
    isBestSeller: true,
    category: "2-4",
    colors: ["#000000", "#1e293b", "#ffffff"],
    sizes: ["S", "M", "L", "XL"],
  },

  // Thời trang trẻ em
  {
    id: 14,
    name: "Bộ đồ bé trai cotton",
    price: 189000,
    image:
      "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&h=600&fit=crop",
    rating: 4.6,
    reviews: 92,
    isNew: true,
    isBestSeller: false,
    category: "3-1",
    colors: ["#3b82f6", "#dc2626", "#22c55e"],
    sizes: ["2-3T", "4-5T", "6-7T", "8-9T"],
  },
  {
    id: 15,
    name: "Váy bé gái hoa xinh",
    price: 229000,
    originalPrice: 289000,
    image:
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=600&fit=crop",
    rating: 4.8,
    reviews: 78,
    discount: 21,
    isNew: false,
    isBestSeller: true,
    category: "3-2",
    colors: ["#ec4899", "#f59e0b", "#a855f7"],
    sizes: ["2-3T", "4-5T", "6-7T"],
  },

  // Túi xách
  {
    id: 16,
    name: "Túi xách nữ luxury",
    price: 1200000,
    originalPrice: 1500000,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=600&fit=crop",
    rating: 4.4,
    reviews: 67,
    discount: 20,
    isNew: false,
    isBestSeller: false,
    category: "4-1",
    colors: ["#7c2d12", "#000000", "#f59e0b"],
    sizes: ["One Size"],
  },
  {
    id: 17,
    name: "Túi xách mini đeo chéo",
    price: 399000,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=600&fit=crop",
    rating: 4.6,
    reviews: 134,
    isNew: true,
    isBestSeller: true,
    category: "4-1",
    colors: ["#000000", "#7c2d12", "#ec4899"],
    sizes: ["One Size"],
  },

  // Giày dép
  {
    id: 18,
    name: "Giày sneaker unisex",
    price: 890000,
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop",
    rating: 4.7,
    reviews: 92,
    isNew: true,
    isBestSeller: false,
    category: "4-2",
    colors: ["#ffffff", "#000000", "#ef4444", "#3b82f6"],
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43"],
  },
  {
    id: 19,
    name: "Giày boots nữ",
    price: 1290000,
    originalPrice: 1590000,
    image:
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?w=400&h=600&fit=crop",
    rating: 4.5,
    reviews: 156,
    discount: 19,
    isNew: false,
    isBestSeller: true,
    category: "4-2",
    colors: ["#000000", "#7c2d12"],
    sizes: ["35", "36", "37", "38", "39", "40"],
  },
  {
    id: 20,
    name: "Giày tây nam da thật",
    price: 1890000,
    originalPrice: 2390000,
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop",
    rating: 4.8,
    reviews: 89,
    discount: 21,
    isNew: false,
    isBestSeller: true,
    category: "4-2",
    colors: ["#000000", "#7c2d12"],
    sizes: ["39", "40", "41", "42", "43", "44"],
  },
];

export const getProductsByCategory = (categorySlug: string): Product[] => {
  if (categorySlug === "sale") {
    return products.filter(
      (product) => product.discount && product.discount > 0,
    );
  }

  const category = categories.find((cat) => cat.slug === categorySlug);
  if (!category) return [];

  // Get products from main category and subcategories
  const categoryIds = [category.id];
  if (category.subcategories) {
    categoryIds.push(...category.subcategories.map((sub) => sub.id));
  }

  return products.filter((product) =>
    categoryIds.some((id) => product.category?.startsWith(id)),
  );
};

export const getProductById = (id: number): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getFeaturedProducts = (): Product[] => {
  return products
    .filter((product) => product.isBestSeller || product.isNew)
    .slice(0, 6);
};

export const getNewProducts = (): Product[] => {
  return products.filter((product) => product.isNew);
};

export const getBestSellerProducts = (): Product[] => {
  return products.filter((product) => product.isBestSeller);
};

export const getSaleProducts = (): Product[] => {
  return products.filter((product) => product.discount && product.discount > 0);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return products.filter((product) =>
    product.name.toLowerCase().includes(lowerQuery),
  );
};

// Mock data for admin functionality
export const orders: Order[] = [
  {
    id: "ORD001",
    customerId: "CUST001",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@email.com",
    customerPhone: "0901234567",
    items: [
      {
        product: products[0],
        quantity: 2,
        selectedColor: "#ffffff",
        selectedSize: "L",
      },
      {
        product: products[1],
        quantity: 1,
        selectedColor: "#ec4899",
        selectedSize: "M",
      },
    ],
    status: "pending",
    total: 1098000,
    shippingAddress: "123 Nguyễn Huệ, Q1, TP.HCM",
    orderDate: "2024-01-15T10:30:00",
    paymentMethod: "cod",
    notes: "Giao hàng giờ hành chính",
  },
  {
    id: "ORD002",
    customerId: "CUST002",
    customerName: "Trần Thị B",
    customerEmail: "tranthib@email.com",
    customerPhone: "0912345678",
    items: [
      {
        product: products[2],
        quantity: 1,
        selectedColor: "#1e40af",
        selectedSize: "32",
      },
    ],
    status: "confirmed",
    total: 520000,
    shippingAddress: "456 Lê Lợi, Q3, TP.HCM",
    orderDate: "2024-01-14T14:20:00",
    paymentMethod: "momo",
    assignedStaff: "STAFF001",
  },
];

export const suppliers: Supplier[] = [
  {
    id: "SUP001",
    name: "Công ty May Mặc ABC",
    email: "abc@supplier.com",
    phone: "0281234567",
    address: "123 Công nghiệp, Q12, TP.HCM",
    contactPerson: "Nguyễn Văn C",
    products: ["1", "2", "3"],
  },
  {
    id: "SUP002",
    name: "Nhà Phân Phối XYZ",
    email: "xyz@supplier.com",
    phone: "0287654321",
    address: "456 Thương mại, Q7, TP.HCM",
    contactPerson: "Lê Thị D",
    products: ["4", "5", "6"],
  },
];

export const departments: Department[] = [
  {
    id: "DEPT001",
    name: "Bán hàng",
    description: "Phụ trách bán hàng và tư vấn khách hàng",
    staffCount: 5,
  },
  {
    id: "DEPT002",
    name: "Kho vận",
    description: "Quản lý kho và vận chuyển",
    staffCount: 3,
  },
  {
    id: "DEPT003",
    name: "Marketing",
    description: "Quảng cáo và marketing",
    staffCount: 2,
  },
];

export const discounts: Discount[] = [
  {
    id: "DISC001",
    code: "WELCOME20",
    name: "Chào mừng khách hàng mới",
    type: "percentage",
    value: 20,
    minOrderValue: 500000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    isActive: true,
    usageCount: 45,
    maxUsage: 100,
  },
  {
    id: "DISC002",
    code: "SUMMER50",
    name: "Giảm giá mùa hè",
    type: "fixed",
    value: 50000,
    minOrderValue: 300000,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    isActive: false,
    usageCount: 123,
    applicableProducts: ["1", "2", "3"],
  },
];

export const mockStaff: User[] = [
  {
    id: "STAFF001",
    email: "nhanvien1@fashionhub.vn",
    name: "Nguyễn Văn Nhân Viên",
    role: "staff",
    department: "DEPT001",
    permissions: ["view_orders", "manage_orders", "view_products"],
  },
  {
    id: "STAFF002",
    email: "nhanvien2@fashionhub.vn",
    name: "Trần Thị Kho",
    role: "staff",
    department: "DEPT002",
    permissions: ["view_inventory", "manage_inventory", "view_suppliers"],
  },
  {
    id: "ADMIN001",
    email: "admin@fashionhub.vn",
    name: "Quản Trị Viên",
    role: "admin",
    permissions: ["all"],
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO001",
    supplierId: "SUP001",
    supplierName: "Công ty May Mặc ABC",
    items: [
      {
        productId: "1",
        productName: "Áo sơ mi nam trắng basic",
        selectedColor: "#ffffff",
        selectedSize: "L",
        quantity: 50,
        unitPrice: 150000,
        totalPrice: 7500000,
      },
      {
        productId: "2",
        productName: "Áo sơ mi nam sọc xanh",
        selectedColor: "#3b82f6",
        selectedSize: "M",
        quantity: 30,
        unitPrice: 180000,
        totalPrice: 5400000,
      },
    ],
    status: "sent",
    totalAmount: 12900000,
    orderDate: "2024-01-10T09:00:00",
    expectedDeliveryDate: "2024-01-20",
    notes: "Đặt hàng cho mùa xuân 2024",
    createdBy: "ADMIN001",
  },
  {
    id: "PO002",
    supplierId: "SUP002",
    supplierName: "Nhà Phân Phối XYZ",
    items: [
      {
        productId: "18",
        productName: "Giày sneaker unisex",
        selectedColor: "#ffffff",
        selectedSize: "39",
        quantity: 20,
        unitPrice: 450000,
        totalPrice: 9000000,
      },
    ],
    status: "confirmed",
    totalAmount: 9000000,
    orderDate: "2024-01-12T14:30:00",
    expectedDeliveryDate: "2024-01-25",
    createdBy: "STAFF002",
  },
];

export const goodsReceipts: GoodsReceipt[] = [
  {
    id: "GR001",
    purchaseOrderId: "PO001",
    supplierId: "SUP001",
    supplierName: "Công ty May Mặc ABC",
    items: [
      {
        purchaseOrderItemId: "PO001-1",
        productId: "1",
        productName: "Áo sơ mi nam trắng basic",
        selectedColor: "#ffffff",
        selectedSize: "L",
        orderedQuantity: 50,
        receivedQuantity: 48,
        unitPrice: 150000,
        condition: "good",
        notes: "2 cái bị lỗi đóng gói",
      },
      {
        purchaseOrderItemId: "PO001-2",
        productId: "2",
        productName: "Áo sơ mi nam sọc xanh",
        selectedColor: "#3b82f6",
        selectedSize: "M",
        orderedQuantity: 30,
        receivedQuantity: 30,
        unitPrice: 180000,
        condition: "good",
      },
    ],
    status: "completed",
    totalReceivedValue: 12600000,
    receiptDate: "2024-01-18T10:15:00",
    receivedBy: "STAFF002",
    notes: "Nhập kho thành công, có 2 sản phẩm lỗi",
  },
];
