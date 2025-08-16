# Hệ Thống Phân Quyền 3TShop - Cập Nhật Hoàn Chỉnh

## Tổng Quan
Hệ thống phân quyền đã được cập nhật hoàn toàn từ hệ thống dựa trên vai trò (role-based) sang hệ thống dựa trên quyền hạn (permission-based) với tên quyền bằng tiếng Việt theo tài liệu.

## Các Thay Đổi Chính

### 1. Cập Nhật Tên Quyền Hạn
Tất cả quyền hạn đã được đổi từ tiếng Anh sang tiếng Việt:

| Quyền Cũ | Quyền Mới | Mô Tả |
|----------|-----------|-------|
| `product.view` | `sanpham.xem` | Xem sản phẩm |
| `product.create` | `sanpham.tao` | Tạo sản phẩm |
| `product.update` | `sanpham.sua` | Cập nhật sản phẩm |
| `product.delete` | `sanpham.xoa` | Xóa sản phẩm |
| `order.view` | `donhang.xem` | Xem tất cả đơn hàng |
| `order.view_own` | `donhang.xem_cua_minh` | Xem đơn hàng của mình |
| `order.view_assigned` | `donhang.xem_duoc_giao` | Xem đơn hàng được phân công |
| `order.create` | `donhang.tao` | Tạo đơn hàng |
| `order.update_status` | `donhang.capnhat_trangthai` | Cập nhật trạng thái đơn hàng |
| `order.assign_delivery` | `donhang.phancong_giaohang` | Phân công giao hàng |
| `order.confirm_delivery` | `donhang.xacnhan_giaohang` | Xác nhận giao hàng |
| `admin.*` | `toanquyen` | Toàn quyền hệ thống |

### 2. Cập Nhật Vai Trò
Các vai trò đã được cập nhật với quyền hạn mới:

#### Admin (Quản trị viên)
- **Quyền hạn**: `toanquyen` (Toàn quyền hệ thống)

#### NhanVienCuaHang (Nhân viên cửa hàng)
- **Quyền hạn**:
  - `sanpham.xem`, `sanpham.tao`, `sanpham.sua`, `sanpham.xoa`
  - `donhang.xem`, `donhang.capnhat_trangthai`
  - `hoadon.xem`, `hoadon.tao`
  - `nhacungcap.xem`, `nhacungcap.tao`, `nhacungcap.sua`, `nhacungcap.xoa`
  - `danhmuc.tao`, `danhmuc.sua`, `danhmuc.xoa`
  - `mausac.tao`, `mausac.sua`, `mausac.xoa`
  - `kichthuoc.tao`, `kichthuoc.sua`, `kichthuoc.xoa`
  - `nhaphang.xem`, `nhaphang.tao`, `nhaphang.sua`
  - `dathang.xem`, `dathang.tao`, `dathang.sua`
  - `bophan.xem`, `trangthaidonhang.xem`

#### NhanVienGiaoHang (Nhân viên giao hàng)
- **Quyền hạn**:
  - `donhang.xem_duoc_giao`, `donhang.xacnhan_giaohang`, `donhang.capnhat_trangthai`
  - `nhanvien.xem`, `nhanvien.phancong`
  - `donhang.phancong_giaohang`

#### KhachHang (Khách hàng)
- **Quyền hạn**:
  - `sanpham.xem`
  - `donhang.tao`, `donhang.xem_cua_minh`
  - `giohang.xem`, `giohang.them`, `giohang.xoa`
  - `binhluan.tao`, `binhluan.sua_cua_minh`, `binhluan.xoa_cua_minh`
  - `thongtin.xem`

## Các File Đã Cập Nhật

### 1. `src/utils/permissions.ts`
- ✅ Cập nhật tất cả quyền hạn sang tiếng Việt
- ✅ Cập nhật vai trò với quyền hạn mới
- ✅ Cập nhật route permissions mapping
- ✅ Loại bỏ wildcard permissions (.*)

### 2. `src/pages/ProductManagement.tsx`
- ✅ Cập nhật kiểm tra quyền `sanpham.xem` và `toanquyen`
- ✅ Cập nhật quyền chỉnh sửa `sanpham.sua`

### 3. `src/pages/AdminDashboard.tsx`
- ✅ Cập nhật kiểm tra quyền admin dashboard
- ✅ Cập nhật quyền thêm sản phẩm `sanpham.tao`
- ✅ Cập nhật quyền xóa sản phẩm `sanpham.xoa`
- ✅ Cập nhật quyền quản lý đơn hàng `donhang.capnhat_trangthai`

### 4. `src/components/AdminSidebar.tsx`
- ✅ Cập nhật tất cả navigation items với quyền hạn mới
- ✅ Thêm alternative permissions cho các menu items
- ✅ Thêm menu "Kích thước" với quyền `kichthuoc.*`

### 5. `src/pages/PurchaseOrders.tsx`
- ✅ Cập nhật kiểm tra quyền `dathang.xem` và `toanquyen`

### 6. `src/pages/GoodsReceipt.tsx`
- ✅ Cập nhật kiểm tra quyền `nhaphang.xem` và `toanquyen`

### 7. `src/pages/PermissionManagement.tsx`
- ✅ Cập nhật kiểm tra quyền `toanquyen`

### 8. `src/components/ProtectedRoute.jsx`
- ✅ Cập nhật kiểm tra quyền admin với `toanquyen`

## Quyền Hạn Theo Module

### Sản Phẩm (sanpham)
- `sanpham.xem` - Xem sản phẩm
- `sanpham.tao` - Tạo sản phẩm
- `sanpham.sua` - Cập nhật sản phẩm
- `sanpham.xoa` - Xóa sản phẩm

### Đơn Hàng (donhang)
- `donhang.xem` - Xem tất cả đơn hàng
- `donhang.xem_cua_minh` - Xem đơn hàng của mình
- `donhang.xem_duoc_giao` - Xem đơn hàng được phân công giao
- `donhang.tao` - Tạo đơn hàng
- `donhang.capnhat_trangthai` - Cập nhật trạng thái đơn hàng
- `donhang.phancong_giaohang` - Phân công giao hàng
- `donhang.xacnhan_giaohang` - Xác nhận giao hàng

### Bình Luận (binhluan)
- `binhluan.tao` - Tạo bình luận
- `binhluan.sua_cua_minh` - Sửa bình luận của mình
- `binhluan.xoa_cua_minh` - Xóa bình luận của mình
- `binhluan.kiemduyet` - Kiểm duyệt bình luận

### Giỏ Hàng (giohang)
- `giohang.xem` - Xem giỏ hàng
- `giohang.them` - Thêm vào giỏ hàng
- `giohang.xoa` - Xóa khỏi giỏ hàng

### Nhân Viên (nhanvien)
- `nhanvien.xem` - Xem nhân viên
- `nhanvien.phancong` - Phân công nhân viên

### Hóa Đơn (hoadon)
- `hoadon.xem` - Xem hóa đơn
- `hoadon.tao` - Tạo hóa đơn

### Nhà Cung Cấp (nhacungcap)
- `nhacungcap.xem` - Xem nhà cung cấp
- `nhacungcap.tao` - Tạo nhà cung cấp
- `nhacungcap.sua` - Cập nhật nhà cung cấp
- `nhacungcap.xoa` - Xóa nhà cung cấp

### Danh Mục (danhmuc)
- `danhmuc.tao` - Tạo danh mục
- `danhmuc.sua` - Cập nhật danh mục
- `danhmuc.xoa` - Xóa danh mục

### Màu Sắc (mausac)
- `mausac.tao` - Tạo màu sắc
- `mausac.sua` - Cập nhật màu sắc
- `mausac.xoa` - Xóa màu sắc

### Kích Thước (kichthuoc)
- `kichthuoc.tao` - Tạo kích thước
- `kichthuoc.sua` - Cập nhật kích thước
- `kichthuoc.xoa` - Xóa kích thước

### Nhập Hàng (nhaphang)
- `nhaphang.xem` - Xem phiếu nhập hàng
- `nhaphang.tao` - Tạo phiếu nhập hàng
- `nhaphang.sua` - Cập nhật phiếu nhập hàng

### Đặt Hàng (dathang)
- `dathang.xem` - Xem đơn đặt hàng NCC
- `dathang.tao` - Tạo đơn đặt hàng NCC
- `dathang.sua` - Cập nhật đơn đặt hàng NCC
- `dathang.xoa` - Xóa đơn đặt hàng NCC

### Bộ Phận (bophan)
- `bophan.xem` - Xem bộ phận

### Tỷ Giá (tigia)
- `tigia.xem` - Xem tỷ giá

### Trạng Thái Đơn Hàng (trangthaidonhang)
- `trangthaidonhang.xem` - Xem trạng thái đơn hàng

### Tài Khoản (taikhoan)
- `taikhoan.tao` - Tạo tài khoản

### Trả Hàng (trahang)
- `thongtin.xem` - Xem thông tin trả hàng

### Toàn Quyền (toanquyen)
- `toanquyen` - Toàn quyền hệ thống

## Route Permissions Mapping

### Admin Routes
- `/admin` - `toanquyen`, `donhang.xem_duoc_giao`, `donhang.xem`
- `/admin/dashboard` - `toanquyen`, `donhang.xem_duoc_giao`, `donhang.xem`
- `/admin/products` - `sanpham.xem`
- `/admin/add-product` - `sanpham.tao`
- `/admin/products/:id` - `sanpham.xem`
- `/admin/categories` - `danhmuc.tao`, `danhmuc.sua`, `danhmuc.xoa`
- `/admin/purchase-orders` - `dathang.xem`, `dathang.tao`, `dathang.sua`
- `/admin/goods-receipt` - `nhaphang.xem`, `nhaphang.tao`, `nhaphang.sua`
- `/admin/orders` - `donhang.xem`, `donhang.xem_duoc_giao`
- `/admin/orders/:id` - `donhang.xem`, `donhang.xem_duoc_giao`
- `/admin/customers` - `toanquyen`
- `/admin/suppliers` - `nhacungcap.xem`, `nhacungcap.tao`, `nhacungcap.sua`, `nhacungcap.xoa`
- `/admin/invoices` - `hoadon.xem`, `hoadon.tao`
- `/admin/discounts` - `toanquyen`
- `/admin/reviews` - `toanquyen`
- `/admin/employees` - `nhanvien.xem`, `nhanvien.phancong`
- `/admin/departments` - `bophan.xem`, `toanquyen`
- `/admin/colors` - `mausac.tao`, `mausac.sua`, `mausac.xoa`
- `/admin/sizes` - `kichthuoc.tao`, `kichthuoc.sua`, `kichthuoc.xoa`
- `/admin/permissions` - `toanquyen`
- `/admin/return-management` - `thongtin.xem`, `toanquyen`

### User Routes
- `/profile` - `toanquyen`
- `/cart` - `giohang.xem`
- `/checkout` - `giohang.xem`, `donhang.tao`
- `/orders` - `donhang.xem_cua_minh`
- `/orders/:id` - `donhang.xem_cua_minh`

## Lợi Ích Của Hệ Thống Mới

1. **Kiểm Soát Chi Tiết**: Mỗi hành động có quyền hạn riêng biệt
2. **Tái Sử Dụng**: Quyền hạn có thể dễ dàng gán cho các vai trò khác nhau
3. **Linh Hoạt**: Dễ dàng thêm quyền hạn mới mà không cần thay đổi code
4. **Code Sạch**: Pattern authorization nhất quán trên tất cả routes
5. **Bảo Mật Tốt Hơn**: Kiểm soát chính xác hơn về những gì mỗi user có thể làm

## Cách Sử Dụng

### 1. ProtectedRoute Component
```tsx
// Bảo vệ route với permission cụ thể
<ProtectedRoute requiredPermissions={['sanpham.xem']}>
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
<PermissionGuard permissions={['sanpham.tao']}>
  <Button>Thêm sản phẩm</Button>
</PermissionGuard>

// Kiểm tra nhiều permission (cần tất cả)
<PermissionGuard permissions={['donhang.xem', 'donhang.sua']} requireAll>
  <OrderActions />
</PermissionGuard>
```

### 3. usePermission Hook
```tsx
import { usePermission } from '../components/PermissionGuard';

function MyComponent() {
  const { hasPermission, hasAnyPermission } = usePermission();
  
  if (hasPermission('sanpham.tao')) {
    return <CreateProductButton />;
  }
  
  return null;
}
```

### 4. Kiểm tra permission trong code
```tsx
import { hasPermission } from '../utils/permissions';

const userPermissions = user.permissions || [];
if (hasPermission(userPermissions, 'sanpham.xoa')) {
  // Có quyền xóa sản phẩm
}
```

## Bước Tiếp Theo

1. ✅ Cập nhật tất cả file frontend với hệ thống permission mới
2. 🔄 Cập nhật API backend để trả về permissions theo format mới
3. 🔄 Cập nhật database với bảng permissions mới
4. 🔄 Test hệ thống permission mới
5. 🔄 Cập nhật documentation cho team

## Lưu Ý

1. **Bảo mật**: Luôn kiểm tra permission ở cả frontend và backend
2. **Performance**: Cache permissions trong localStorage để tránh gọi API nhiều lần
3. **UX**: Hiển thị thông báo phù hợp khi user không có quyền
4. **Maintenance**: Cập nhật permissions khi thêm tính năng mới

## Troubleshooting

### Lỗi thường gặp:
1. **User không có permissions**: Kiểm tra API response có trả về MaVaiTro đúng không
2. **Route không load**: Kiểm tra requiredPermissions có đúng không
3. **Component không hiển thị**: Kiểm tra PermissionGuard có đúng syntax không

### Debug:
```tsx
// Log permissions để debug
console.log('User permissions:', user.permissions);
console.log('Required permissions:', requiredPermissions);
console.log('Has permission:', hasPermission(userPermissions, 'sanpham.tao'));
``` 