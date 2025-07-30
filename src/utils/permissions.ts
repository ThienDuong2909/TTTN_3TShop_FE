// Hệ thống phân quyền 3TShop
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

// Định nghĩa tất cả permissions trong hệ thống
export const PERMISSIONS = {
  // Product permissions
  'product.view': 'Xem sản phẩm',
  'product.create': 'Tạo sản phẩm',
  'product.update': 'Cập nhật sản phẩm',
  'product.delete': 'Xóa sản phẩm',
  'product.*': 'Tất cả quyền sản phẩm',

  // Import permissions
  'import.view': 'Xem nhập hàng',
  'import.create': 'Tạo phiếu nhập hàng',
  'import.update': 'Cập nhật phiếu nhập hàng',
  'import.delete': 'Xóa phiếu nhập hàng',
  'import.*': 'Tất cả quyền nhập hàng',

  // Purchase permissions
  'purchase.view': 'Xem đặt hàng NCC',
  'purchase.create': 'Tạo đơn đặt hàng NCC',
  'purchase.update': 'Cập nhật đơn đặt hàng NCC',
  'purchase.delete': 'Xóa đơn đặt hàng NCC',
  'purchase.*': 'Tất cả quyền đặt hàng NCC',

  // Supplier permissions
  'supplier.view': 'Xem nhà cung cấp',
  'supplier.create': 'Tạo nhà cung cấp',
  'supplier.update': 'Cập nhật nhà cung cấp',
  'supplier.delete': 'Xóa nhà cung cấp',
  'supplier.*': 'Tất cả quyền nhà cung cấp',

  // Category permissions
  'category.view': 'Xem loại sản phẩm',
  'category.create': 'Tạo loại sản phẩm',
  'category.update': 'Cập nhật loại sản phẩm',
  'category.delete': 'Xóa loại sản phẩm',
  'category.*': 'Tất cả quyền loại sản phẩm',

  // Color permissions
  'color.view': 'Xem màu sắc',
  'color.create': 'Tạo màu sắc',
  'color.update': 'Cập nhật màu sắc',
  'color.delete': 'Xóa màu sắc',
  'color.*': 'Tất cả quyền màu sắc',

  // Size permissions
  'size.view': 'Xem kích thước',
  'size.create': 'Tạo kích thước',
  'size.update': 'Cập nhật kích thước',
  'size.delete': 'Xóa kích thước',
  'size.*': 'Tất cả quyền kích thước',

  // Order permissions
  'order.view': 'Xem đơn hàng',
  'order.view_own': 'Xem đơn hàng của mình',
  'order.view_assigned': 'Xem đơn hàng được phân công',
  'order.create': 'Tạo đơn hàng',
  'order.update': 'Cập nhật đơn hàng',
  'order.update_status': 'Cập nhật trạng thái đơn hàng',
  'order.confirm_delivery': 'Xác nhận giao hàng',
  'order.delete': 'Xóa đơn hàng',

  // Invoice permissions
  'invoice.view': 'Xem hóa đơn',
  'invoice.create': 'Tạo hóa đơn',
  'invoice.update': 'Cập nhật hóa đơn',
  'invoice.delete': 'Xóa hóa đơn',
  'invoice.*': 'Tất cả quyền hóa đơn',

  // Employee permissions
  'employee.view': 'Xem thông tin nhân viên',
  'employee.create': 'Tạo nhân viên',
  'employee.update': 'Cập nhật nhân viên',
  'employee.delete': 'Xóa nhân viên',
  'employee.*': 'Tất cả quyền nhân viên',

  // Department permissions
  'department.view': 'Xem thông tin bộ phận',
  'department.create': 'Tạo bộ phận',
  'department.update': 'Cập nhật bộ phận',
  'department.delete': 'Xóa bộ phận',
  'department.*': 'Tất cả quyền bộ phận',

  // Profile permissions
  'profile.view': 'Xem thông tin cá nhân',
  'profile.update': 'Cập nhật thông tin cá nhân',

  // Cart permissions
  'cart.view': 'Xem giỏ hàng',
  'cart.add': 'Thêm vào giỏ hàng',
  'cart.update': 'Cập nhật giỏ hàng',
  'cart.remove': 'Xóa khỏi giỏ hàng',
  'cart.*': 'Tất cả quyền giỏ hàng',

  // Admin permissions
  'admin.*': 'Tất cả quyền trong hệ thống',
} as const;

// Định nghĩa các vai trò
export const ROLES: Record<string, Role> = {
  ADMIN: {
    id: 1,
    name: 'Admin',
    displayName: 'Quản trị viên',
    permissions: ['admin.*'], // Tất cả quyền
  },
  STORE_STAFF: {
    id: 2,
    name: 'NhanVienCuaHang',
    displayName: 'Nhân viên cửa hàng',
    permissions: [
      'product.*',
      'import.*',
      'purchase.*',
      'supplier.*',
      'category.*',
      'color.*',
      'size.*',
      'order.view',
      'order.update_status',
      'invoice.*',
      'employee.view',
      'department.view',
      'profile.view',
      'profile.update',
    ],
  },
  DELIVERY_STAFF: {
    id: 3,
    name: 'NhanVienGiaoHang',
    displayName: 'Nhân viên giao hàng',
    permissions: [
      'order.view_assigned',
      'order.confirm_delivery',
      'order.update_status',
      'profile.view',
      'profile.update',
    ],
  },
  CUSTOMER: {
    id: 4,
    name: 'KhachHang',
    displayName: 'Khách hàng',
    permissions: [
      'product.view',
      'order.create',
      'order.view_own',
      'cart.*',
      'profile.view',
      'profile.update',
    ],
  },
};

// Helper functions
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (!userPermissions || userPermissions.length === 0) return false;
  
  // Kiểm tra quyền cụ thể
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Kiểm tra wildcard permissions
  const wildcardPermission = requiredPermission.split('.')[0] + '.*';
  if (userPermissions.includes(wildcardPermission)) return true;
  
  // Kiểm tra admin permission
  if (userPermissions.includes('admin.*')) return true;
  
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

// Route permissions mapping
export const ROUTE_PERMISSIONS = {
  // Admin routes
  '/admin': ['admin.*'],
  '/admin/dashboard': ['admin.*'],
  '/admin/products': ['product.*'],
  '/admin/add-product': ['product.create'],
  '/admin/products/:id': ['product.view'],
  '/admin/categories': ['category.*'],
  '/admin/purchase-orders': ['purchase.*'],
  '/admin/goods-receipt': ['import.*'],
  '/admin/orders': ['order.view'],
  '/admin/orders/:id': ['order.view'],
  '/admin/customers': ['admin.*'],
  '/admin/suppliers': ['supplier.*'],
  '/admin/invoices': ['invoice.*'],
  '/admin/discounts': ['admin.*'],
  '/admin/reviews': ['admin.*'],
  '/admin/employees': ['employee.*'],
  '/admin/departments': ['department.*'],
  '/admin/colors': ['color.*'],

  // User routes
  '/profile': ['profile.view'],
  '/cart': ['cart.view'],
  '/checkout': ['cart.view', 'order.create'],
  '/orders': ['order.view_own'],
  '/orders/:id': ['order.view_own'],
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