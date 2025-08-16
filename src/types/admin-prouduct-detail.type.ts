export interface ApiProductVariant {
  MaCTSP: number;
  MaSP: number;
  MaKichThuoc: number;
  MaMau: number;
  SoLuongTon: number;
  KichThuoc: {
    MaKichThuoc: number;
    TenKichThuoc: string;
  };
  Mau: {
    MaMau: number;
    TenMau: string;
    MaHex: string;
    NgayTao: string;
    TrangThai: boolean;
  };
}

export interface ApiProductImage {
  MaAnh: number;
  MaSP: number;
  TenFile: string;
  DuongDan: string;
  AnhChinh: boolean;
  ThuTu: number;
  MoTa: string;
}

export interface ApiBinhLuan {
  MaBL: number;
  MoTa: string;
  SoSao: number;
  NgayBinhLuan: string;
  MaKH: number;
  TenKH: string;
  MaKichThuoc: number;
  MaMau: number;
  TenKichThuoc: string;
  TenMau: string;
  MaHex: string;
}

export interface ApiProductDetail {
  MaSP: number;
  TenSP: string;
  MaLoaiSP: number;
  MaNCC: number;
  MoTa: string;
  TrangThai: boolean;
  SoLuongBinhLuan?: number;
  SoSaoTrungBinh?: string;
  NhaCungCap: {
    MaNCC: number;
    TenNCC: string;
    DiaChi: string;
    SDT: string;
    Email: string;
  };
  LoaiSP: {
    MaLoaiSP: number;
    TenLoai: string;
    NgayTao: string;
    HinhMinhHoa?: string;
  };
  AnhSanPhams: ApiProductImage[];
  ThayDoiGia: Array<{
    MaSP: number;
    NgayThayDoi: string;
    Gia: string;
    NgayApDung: string;
  }>;
  ChiTietSanPhams: ApiProductVariant[];
  BinhLuan?: {
    avgRate: number;
    luotBinhLuan: number;
    DanhSachBinhLuan: ApiBinhLuan[];
  };
}