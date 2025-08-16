// Hệ thống phân quyền 3TShop - Cập nhật theo tài liệu mới
export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
  permissions: string[];
}

// Định nghĩa tất cả permissions trong hệ thống theo tài liệu
export const PERMISSIONS = {
  // Product permissions (sanpham)
  'sanpham.xem': 'Xem sản phẩm',
  'sanpham.tao': 'Tạo sản phẩm',
  'sanpham.sua': 'Cập nhật sản phẩm',
  'sanpham.xoa': 'Xóa sản phẩm',

  // Order permissions (donhang)
  'donhang.xem': 'Xem tất cả đơn hàng',
  'donhang.xem_cua_minh': 'Xem đơn hàng của mình',
  'donhang.xem_duoc_giao': 'Xem đơn hàng được phân công giao',
  'donhang.tao': 'Tạo đơn hàng',
  'donhang.capnhat_trangthai': 'Cập nhật trạng thái đơn hàng',
  'donhang.phancong_giaohang': 'Phân công giao hàng',
  'donhang.xacnhan_giaohang': 'Xác nhận giao hàng',

  // Comment permissions (binhluan)
  'binhluan.tao': 'Tạo bình luận',
  'binhluan.sua_cua_minh': 'Sửa bình luận của mình',
  'binhluan.xoa_cua_minh': 'Xóa bình luận của mình',
  'binhluan.kiemduyet': 'Kiểm duyệt bình luận',

  // Cart permissions (giohang)
  'giohang.xem': 'Xem giỏ hàng',
  'giohang.them': 'Thêm vào giỏ hàng',
  'giohang.xoa': 'Xóa khỏi giỏ hàng',

  // Employee permissions (nhanvien)
  'nhanvien.xem': 'Xem nhân viên',
  'nhanvien.phancong': 'Phân công nhân viên',

  // Invoice permissions (hoadon)
  'hoadon.xem': 'Xem hóa đơn',
  'hoadon.tao': 'Tạo hóa đơn',

  // Supplier permissions (nhacungcap)
  'nhacungcap.xem': 'Xem nhà cung cấp',
  'nhacungcap.tao': 'Tạo nhà cung cấp',
  'nhacungcap.sua': 'Cập nhật nhà cung cấp',
  'nhacungcap.xoa': 'Xóa nhà cung cấp',

  // Category permissions (danhmuc)
  'danhmuc.tao': 'Tạo danh mục',
  'danhmuc.sua': 'Cập nhật danh mục',
  'danhmuc.xoa': 'Xóa danh mục',

  // Color permissions (mausac)
  'mausac.tao': 'Tạo màu sắc',
  'mausac.sua': 'Cập nhật màu sắc',
  'mausac.xoa': 'Xóa màu sắc',

  // Size permissions (kichthuoc)
  'kichthuoc.tao': 'Tạo kích thước',
  'kichthuoc.sua': 'Cập nhật kích thước',
  'kichthuoc.xoa': 'Xóa kích thước',

  // Import permissions (nhaphang)
  'nhaphang.xem': 'Xem phiếu nhập hàng',
  'nhaphang.tao': 'Tạo phiếu nhập hàng',
  'nhaphang.sua': 'Cập nhật phiếu nhập hàng',

  // Purchase order permissions (dathang)
  'dathang.xem': 'Xem đơn đặt hàng NCC',
  'dathang.tao': 'Tạo đơn đặt hàng NCC',
  'dathang.sua': 'Cập nhật đơn đặt hàng NCC',
  'dathang.xoa': 'Xóa đơn đặt hàng NCC',

  // Department permissions (bophan)
  'bophan.xem': 'Xem bộ phận',

  // Exchange rate permissions (tigia)
  'tigia.xem': 'Xem tỷ giá',

  // Order status permissions (trangthaidonhang)
  'trangthaidonhang.xem': 'Xem trạng thái đơn hàng',

  // Account permissions (taikhoan)
  'taikhoan.tao': 'Tạo tài khoản',

  // Return permissions (trahang)
  'thongtin.xem': 'Xem thông tin trả hàng',

  // Full access permission (toanquyen)
  'toanquyen': 'Toàn quyền hệ thống',
} as const;

// Định nghĩa các vai trò theo tài liệu
export const ROLES: Record<string, Role> = {
  ADMIN: {
    id: 1,
    name: 'Admin',
    displayName: 'Quản trị viên',
    permissions: ['toanquyen'], // Toàn quyền
  },
  STORE_STAFF: {
    id: 2,
    name: 'NhanVienCuaHang',
    displayName: 'Nhân viên cửa hàng',
    permissions: [
      'sanpham.xem',
      'sanpham.tao',
      'sanpham.sua',
      'sanpham.xoa',
      'donhang.xem',
      'donhang.capnhat_trangthai',
      'hoadon.xem',
      'hoadon.tao',
      'nhacungcap.xem',
      'nhacungcap.tao',
      'nhacungcap.sua',
      'nhacungcap.xoa',
      'danhmuc.tao',
      'danhmuc.sua',
      'danhmuc.xoa',
      'mausac.tao',
      'mausac.sua',
      'mausac.xoa',
      'kichthuoc.tao',
      'kichthuoc.sua',
      'kichthuoc.xoa',
      'nhaphang.xem',
      'nhaphang.tao',
      'nhaphang.sua',
      'dathang.xem',
      'dathang.tao',
      'dathang.sua',
      'bophan.xem',
      'trangthaidonhang.xem',
    ],
  },
  DELIVERY_STAFF: {
    id: 3,
    name: 'NhanVienGiaoHang',
    displayName: 'Nhân viên giao hàng',
    permissions: [
      'donhang.xem_duoc_giao',
      'donhang.xacnhan_giaohang',
      'donhang.capnhat_trangthai',
      // 'nhanvien.xem',
      // 'nhanvien.phancong',
      // 'donhang.phancong_giaohang',
    ],
  },
  CUSTOMER: {
    id: 4,
    name: 'KhachHang',
    displayName: 'Khách hàng',
    permissions: [
      'sanpham.xem',
      'donhang.tao',
      'donhang.xem_cua_minh',
      'giohang.xem',
      'giohang.them',
      'giohang.xoa',
      'binhluan.tao',
      'binhluan.sua_cua_minh',
      'binhluan.xoa_cua_minh',
      'thongtin.xem',
    ],
  },
};

// Helper functions
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (!userPermissions || userPermissions.length === 0) return false;
  
  // Kiểm tra quyền cụ thể
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Kiểm tra toàn quyền
  if (userPermissions.includes('toanquyen')) return true;
  
  return false;
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
};

export const getRoleByMaVaiTro = (maVaiTro: number): Role | null => {
  const role = Object.values(ROLES).find(role => role.id === maVaiTro);
  return role || null;
};

export const getRoleByName = (roleName: string): Role | null => {
  const role = Object.values(ROLES).find(role => role.name === roleName);
  return role || null;
};

export const getPermissionsForRole = (roleName: string): string[] => {
  const role = getRoleByName(roleName);
  return role?.permissions || [];
};

// Route permissions mapping theo tài liệu
export const ROUTE_PERMISSIONS = {
  // Admin routes
  '/admin': ['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem'],
  '/admin/dashboard': ['toanquyen', 'donhang.xem_duoc_giao', 'donhang.xem'],
  '/admin/products': ['sanpham.xem'],
  '/admin/add-product': ['sanpham.tao'],
  '/admin/products/:id': ['sanpham.xem'],
  '/admin/categories': ['danhmuc.tao', 'danhmuc.sua', 'danhmuc.xoa'],
  '/admin/purchase-orders': ['dathang.xem', 'dathang.tao', 'dathang.sua'],
  '/admin/goods-receipt': ['nhaphang.xem', 'nhaphang.tao', 'nhaphang.sua'],
  '/admin/orders': ['donhang.xem', 'donhang.xem_duoc_giao'],
  '/admin/orders/:id': ['donhang.xem', 'donhang.xem_duoc_giao'],
  '/admin/customers': ['toanquyen'],
  '/admin/suppliers': ['nhacungcap.xem', 'nhacungcap.tao', 'nhacungcap.sua', 'nhacungcap.xoa'],
  '/admin/invoices': ['hoadon.xem', 'hoadon.tao'],
  '/admin/discounts': ['toanquyen'],
  '/admin/reviews': ['toanquyen'],
  '/admin/employees': ['nhanvien.xem', 'nhanvien.phancong'],
  '/admin/departments': ['bophan.xem', 'toanquyen'],
  '/admin/colors': ['mausac.tao', 'mausac.sua', 'mausac.xoa'],
  '/admin/sizes': ['kichthuoc.tao', 'kichthuoc.sua', 'kichthuoc.xoa'],
  '/admin/permissions': ['toanquyen'],
  '/admin/return-management': ['thongtin.xem', 'toanquyen'],

  // User routes
  '/profile': ['toanquyen', 'thongtin.xem'],
  '/cart': ['giohang.xem'],
  '/checkout': ['giohang.xem', 'donhang.tao'],
  '/orders': ['donhang.xem_cua_minh'],
  '/orders/:id': ['donhang.xem_cua_minh'],
} as const;

export const getRoutePermissions = (route: string): string[] => {
  // Tìm permission cho route cụ thể
  const exactMatch = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS];
  if (exactMatch) return [...exactMatch];

  // Tìm permission cho route pattern (với params)
  for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePattern.includes(':')) {
      const pattern = routePattern.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(route)) {
        return [...permissions];
      }
    }
  }

  return [];
}; 