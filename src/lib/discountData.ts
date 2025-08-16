// Types for discount data
export interface ProductForDiscount {
  MaSP: number;
  TenSP: string;
  AnhSP: string;
  DanhMuc: string;
  GiaGoc: number;
  TrangThai: string;
}

export interface DotGiamGia {
  MaDot: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  MoTa: string;
  TrangThai: string;
  SoLuongSanPham?: number;
  CT_DotGiamGia?: Array<{
    MaCTDGG: number;
    MaDot: number;
    MaSP: number;
    PhanTramGiam: string;
    SanPham: {
      MaSP: number;
      TenSP: string;
      AnhSanPhams: Array<{
        DuongDan: string;
      }>;
      ThayDoiGia: Array<{
        Gia: string;
        NgayApDung: string;
      }>;
    };
  }>;
}

export interface ChiTietDotGiamGia {
  MaCTDGG: number;
  MaDot: number;
  MaSP: number;
  TenSP: string;
  AnhSP: string;
  GiaGoc: number;
  PhanTramGiam: number;
  GiaSauGiam: number;
}

// Utility functions
export const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", 
    currency: "VND",
  }).format(numAmount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export const calculateDiscountStatus = (startDate: string, endDate: string): string => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to compare only dates
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (now < start) {
    return "Chưa bắt đầu";
  } else if (now > end) {
    return "Đã kết thúc";
  } else {
    return "Đang diễn ra";
  }
};

export const calculateDiscountedPrice = (originalPrice: number, discountPercent: number) => {
  return originalPrice * (1 - discountPercent / 100);
};

// Mock data - to be replaced with API calls
export const availableProducts: ProductForDiscount[] = [
  {
    MaSP: 1,
    TenSP: "Áo thun nam cổ tròn",
    AnhSP: "/images/products/1.jpg",
    DanhMuc: "Áo nam",
    GiaGoc: 299000,
    TrangThai: "active"
  },
  {
    MaSP: 2,
    TenSP: "Quần jean nam slim fit",
    AnhSP: "/images/products/2.jpg", 
    DanhMuc: "Quần nam",
    GiaGoc: 599000,
    TrangThai: "active"
  },
  {
    MaSP: 3,
    TenSP: "Váy nữ dáng suông",
    AnhSP: "/images/products/3.jpg",
    DanhMuc: "Váy nữ", 
    GiaGoc: 459000,
    TrangThai: "active"
  },
  // Add more mock products as needed
];

// Get available products for discount (excluding already discounted ones)
export const getAvailableProductsForDiscount = (excludeMaDot?: number): ProductForDiscount[] => {
  // In a real implementation, this would call an API to get products
  // that are not already in the specified discount period
  return availableProducts.filter(product => product.TrangThai === "active");
};

// Get discount details by period
export const getDiscountDetailsByPeriod = (maDot: number): ChiTietDotGiamGia[] => {
  // Mock implementation - in reality this would call an API
  return [
    {
      MaCTDGG: 1,
      MaDot: maDot,
      MaSP: 1,
      TenSP: "Áo thun nam cổ tròn",
      AnhSP: "/images/products/1.jpg",
      GiaGoc: 299000,
      PhanTramGiam: 15,
      GiaSauGiam: 254150
    },
    {
      MaCTDGG: 2,
      MaDot: maDot,
      MaSP: 2, 
      TenSP: "Quần jean nam slim fit",
      AnhSP: "/images/products/2.jpg",
      GiaGoc: 599000,
      PhanTramGiam: 20,
      GiaSauGiam: 479200
    }
  ];
};
