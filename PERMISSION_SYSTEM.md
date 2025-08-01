# HỆ THỐNG PHÂN QUYỀN 3TSHOP

## Tổng quan
Hệ thống phân quyền được thiết kế với 4 vai trò chính, mỗi vai trò có quyền hạn riêng biệt:

## 1. ADMIN (MaVaiTro: 1)
**Mô tả**: Toàn quyền - có thể truy cập tất cả chức năng

**Quyền hạn**:
- `admin.*` - Tất cả quyền trong hệ thống

## 2. NHÂN VIÊN CỬA HÀNG (MaVaiTro: 2)
**Mô tả**: Nhân viên cửa hàng - quản lý sản phẩm, nhập hàng, đặt hàng

**Quyền hạn**:
- `product.*` - Tất cả quyền sản phẩm (thêm, sửa, xóa, xem)
- `import.*` - Tất cả quyền nhập hàng
- `purchase.*` - Tất cả quyền đặt hàng NCC
- `supplier.*` - Quản lý nhà cung cấp
- `category.*` - Quản lý loại sản phẩm
- `color.*` - Quản lý màu sắc
- `size.*` - Quản lý kích thước
- `order.view` - Xem đơn hàng
- `order.update_status` - Cập nhật trạng thái đơn hàng
- `invoice.*` - Quản lý hóa đơn
- `employee.view` - Xem thông tin nhân viên
- `department.view` - Xem thông tin bộ phận
- `profile.view` - Xem thông tin cá nhân
- `profile.update` - Cập nhật thông tin cá nhân

## 3. NHÂN VIÊN GIAO HÀNG (MaVaiTro: 3)
**Mô tả**: Nhân viên giao hàng - xem đơn hàng được phân công, xác nhận giao hàng

**Quyền hạn**:
- `order.view_assigned` - Xem đơn hàng được phân công
- `order.confirm_delivery` - Xác nhận đã giao hàng
- `order.update_status` - Cập nhật trạng thái đơn hàng (chỉ đơn được phân công)
- `profile.view` - Xem thông tin cá nhân
- `profile.update` - Cập nhật thông tin cá nhân

## 4. KHÁCH HÀNG (MaVaiTro: 4)
**Mô tả**: Khách hàng - đặt hàng, xem đơn hàng của mình

**Quyền hạn**:
- `product.view` - Xem sản phẩm
- `order.create` - Tạo đơn hàng
- `order.view_own` - Xem đơn hàng của mình
- `cart.*` - Quản lý giỏ hàng
- `profile.view` - Xem thông tin cá nhân
- `profile.update` - Cập nhật thông tin cá nhân

## CÁCH SỬ DỤNG

### 1. ProtectedRoute Component
```tsx
// Bảo vệ route với permission cụ thể
<ProtectedRoute requiredPermissions={['product.*']}>
  <ProductManagement />
</ProtectedRoute>

// Bảo vệ route chỉ cho admin
<ProtectedRoute requireAdmin>
  <AdminDashboard />
</ProtectedRoute>
```

### 2. PermissionGuard Component
```tsx
// Kiểm tra permission trong component
<PermissionGuard permissions={['product.create']}>
  <Button>Thêm sản phẩm</Button>
</PermissionGuard>

// Kiểm tra nhiều permission (cần tất cả)
<PermissionGuard permissions={['order.view', 'order.update']} requireAll>
  <OrderActions />
</PermissionGuard>
```

### 3. usePermission Hook
```tsx
import { usePermission } from '../components/PermissionGuard';

function MyComponent() {
  const { hasPermission, hasAnyPermission } = usePermission();
  
  if (hasPermission('product.create')) {
    return <CreateProductButton />;
  }
  
  return null;
}
```

### 4. Kiểm tra permission trong code
```tsx
import { hasPermission } from '../utils/permissions';

const userPermissions = user.permissions || [];
if (hasPermission(userPermissions, 'product.delete')) {
  // Có quyền xóa sản phẩm
}
```

## CẬP NHẬT DATABASE

### 1. Cập nhật bảng VaiTro
```sql
-- Xóa dữ liệu cũ
DELETE FROM VaiTro;

-- Thêm vai trò mới
INSERT INTO VaiTro (MaVaiTro, TenVaiTro) VALUES
(1, 'Admin'),
(2, 'NhanVienCuaHang'),
(3, 'NhanVienGiaoHang'),
(4, 'KhachHang');
```

### 2. Cập nhật API Response
API login cần trả về cấu trúc:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "MaKH": "KH001",
      "TenKH": "Nguyễn Văn A",
      "TaiKhoan": {
        "MaTK": "TK001",
        "Email": "user@example.com",
        "VaiTro": {
          "MaVaiTro": 1,
          "TenVaiTro": "Admin"
        }
      }
    }
  }
}
```

## ROUTE PERMISSIONS

### Admin Routes
- `/admin` - `admin.*`
- `/admin/dashboard` - `admin.*`
- `/admin/products` - `product.*`
- `/admin/add-product` - `product.create`
- `/admin/categories` - `category.*`
- `/admin/purchase-orders` - `purchase.*`
- `/admin/goods-receipt` - `import.*`
- `/admin/orders` - `order.view`
- `/admin/suppliers` - `supplier.*`
- `/admin/invoices` - `invoice.*`
- `/admin/employees` - `employee.*`
- `/admin/departments` - `department.*`
- `/admin/colors` - `color.*`
- `/admin/permissions` - `admin.*`

### User Routes
- `/profile` - `profile.view`
- `/cart` - `cart.view`
- `/checkout` - `cart.view`, `order.create`
- `/orders` - `order.view_own`

## TÍNH NĂNG MỚI

### 1. Trang Quản lý Phân quyền
- Truy cập: `/admin/permissions`
- Chỉ admin mới có quyền truy cập
- Hiển thị danh sách vai trò và quyền hạn
- Thống kê hệ thống phân quyền

### 2. Component RoleInfo
- Hiển thị thông tin vai trò và quyền hạn của user hiện tại
- Có thể sử dụng trong profile hoặc dashboard

### 3. PermissionGuard
- Component bảo vệ các phần tử UI
- Hook usePermission để kiểm tra quyền trong code

## LƯU Ý

1. **Bảo mật**: Luôn kiểm tra permission ở cả frontend và backend
2. **Performance**: Cache permissions trong localStorage để tránh gọi API nhiều lần
3. **UX**: Hiển thị thông báo phù hợp khi user không có quyền
4. **Maintenance**: Cập nhật permissions khi thêm tính năng mới

## TROUBLESHOOTING

### Lỗi thường gặp:
1. **User không có permissions**: Kiểm tra API response có trả về MaVaiTro đúng không
2. **Route không load**: Kiểm tra requiredPermissions có đúng không
3. **Component không hiển thị**: Kiểm tra PermissionGuard có đúng syntax không

### Debug:
```tsx
// Log permissions để debug
console.log('User permissions:', user.permissions);
console.log('Required permissions:', requiredPermissions);
console.log('Has permission:', hasPermission(userPermissions, 'product.create'));
``` 