export interface DeliveryStaff {
  MaNV: number;
  TenNV: string;
  DiaChi: string;
  SoDonDangGiao: number;
  KhuVucPhuTrach: string | null;
}

// Order interfaces
export interface OrderCustomer {
  MaKH: number;
  TenKH: string;
  SDT: string;
  DiaChi: string;
  CCCD: string;
}

export interface OrderEmployee {
  MaNV: number;
  TenNV: string;
}

export interface OrderStatus {
  MaTTDH: number;
  TrangThai: string;
}

export interface OrderProduct {
  MaSP: number;
  TenSP: string;
  MoTa: string;
}

export interface OrderSize {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

export interface OrderColor {
  MaMau: number;
  TenMau: string;
  MaHex: string;
}

export interface OrderProductDetail {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  SanPham: OrderProduct;
  KichThuoc: OrderSize;
  Mau: OrderColor;
}

export interface OrderItem {
  MaCTDDH: number;
  MaDDH: number;
  MaCTSP: number;
  SoLuong: number;
  DonGia: string;
  MaPhieuTra: number | null;
  SoLuongTra: number;
  ChiTietSanPham: OrderProductDetail;
}

export interface Order {
  MaDDH: number;
  MaKH: number;
  MaNV_Duyet: number;
  MaNV_Giao: number | null;
  NgayTao: string;
  DiaChiGiao: string;
  ThoiGianGiao: string;
  NguoiNhan: string;
  SDT: string; // Số điện thoại của đơn hàng
  MaTTDH: number;
  TongTien: number;
  KhachHang: OrderCustomer;
  NguoiDuyet: OrderEmployee;
  NguoiGiao: OrderEmployee | null;
  TrangThaiDH: OrderStatus;
  CT_DonDatHangs: OrderItem[];
  HoaDon: Invoice | null;
}

export interface Invoice {
  SoHD: string;
  NgayLap: string;
}