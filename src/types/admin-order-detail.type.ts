export interface OrderDetail {
  ThongTinDonHang: {
    MaDDH: number;
    NgayTao: string;
    TrangThai: {
      Ma: number;
      Ten: string;
    };
    TongSoLuong: number;
    TongTien: number;
  };
  ThongTinNguoiNhan: {
    HoTen: string;
    SDT: string;
    DiaChi: string;
    ThoiGianGiao: string;
  };
  ThongTinKhachHang: {
    MaKH: number;
    TenKH: string;
    SDT: string;
    DiaChi: string;
    CCCD: string;
  };
  ThongTinXuLy: {
    NguoiDuyet: {
      MaNV: number;
      TenNV: string;
    };
    NguoiGiao: {
      MaNV: number;
      TenNV: string;
    };
  };
  DanhSachSanPham: Array<{
    MaCTDDH: number;
    MaCTSP: number;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
    SoLuongTra: number;
    SanPham: {
      MaSP: number;
      TenSP: string;
      KichThuoc: string;
      MauSac: {
        TenMau: string;
        MaHex: string;
      };
      HinhAnh?: {
        MaAnh: number;
        TenFile: string;
        DuongDan: string;
      } | null;
    };
  }>;
  ThongTinHoaDon: any;
}