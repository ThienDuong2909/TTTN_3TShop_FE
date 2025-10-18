export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  address?: string;
  role: "KhachHang" | "NhanVienCuaHang" | "NhanVienGiaoHang" | "Admin";
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
