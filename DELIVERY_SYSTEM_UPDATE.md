# Hệ Thống Giao Hàng Cho Nhân Viên - Cập Nhật

## Tổng Quan
Hệ thống đã được cập nhật để nhân viên giao hàng có thể sử dụng 2 API riêng biệt:
1. **API lấy đơn hàng được phân công** - Chỉ hiển thị đơn hàng được phân công cho nhân viên đó
2. **API xác nhận giao hàng** - Cho phép nhân viên xác nhận đã giao hàng thành công

## Các Thay Đổi Chính

### 1. API Mới Cho Nhân Viên Giao Hàng

#### Lấy đơn hàng được phân công
- **Endpoint**: `GET /api/orders/delivery/assigned`
- **Quyền cần thiết**: `donhang.xem_duoc_giao`
- **Chức năng**: Chỉ trả về đơn hàng được phân công cho nhân viên giao hàng hiện tại

#### Xác nhận hoàn thành giao hàng
- **Endpoint**: `PUT /api/orders/delivery/:id/confirm`
- **Quyền cần thiết**: `donhang.xacnhan_giaohang`
- **Chức năng**: Cập nhật trạng thái đơn hàng từ "Đang giao" thành "Hoàn tất"

### 2. Component Mới

#### DeliveryStaffOrders Component
- **File**: `src/components/DeliveryStaffOrders.tsx`
- **Chức năng**: 
  - Hiển thị danh sách đơn hàng được phân công
  - Tìm kiếm và sắp xếp đơn hàng
  - Xác nhận giao hàng
  - Phân trang

### 3. Hook Permission Mới

#### usePermission Hook
- **File**: `src/hooks/usePermission.ts`
- **Chức năng**:
  - Kiểm tra quyền của người dùng
  - Xác định vai trò (Admin, Nhân viên cửa hàng, Nhân viên giao hàng, Khách hàng)
  - Hỗ trợ kiểm tra nhiều quyền cùng lúc

### 4. Route Mới

#### Route cho nhân viên giao hàng
- **URL**: `/admin/delivery-orders`
- **Quyền**: `donhang.xem_duoc_giao`
- **Component**: `DeliveryOrders`

### 5. Cập Nhật Trang Orders

#### Logic Phân Quyền
- **Admin & Nhân viên cửa hàng**: Sử dụng API cũ (`/api/orders/by-status`)
- **Nhân viên giao hàng**: Tự động chuyển sang component `DeliveryStaffOrders`

## Cách Sử Dụng

### Cho Nhân Viên Giao Hàng

1. **Đăng nhập** với tài khoản có vai trò "NhanVienGiaoHang"
2. **Truy cập** `/admin/orders` hoặc `/admin/delivery-orders`
3. **Xem đơn hàng** được phân công (chỉ hiển thị đơn hàng của mình)
4. **Xác nhận giao hàng** bằng cách click nút "Xác nhận"

### Cho Admin & Nhân Viên Cửa Hàng

1. **Đăng nhập** với tài khoản có quyền `donhang.xem`
2. **Truy cập** `/admin/orders`
3. **Quản lý tất cả đơn hàng** như bình thường
4. **Phân công nhân viên giao hàng** cho đơn hàng

## Cấu Trúc API Response

### Lấy đơn hàng được phân công
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng được phân công thành công",
  "data": {
    "orders": [
      {
        "MaDDH": 123,
        "NgayTao": "2025-01-26T10:30:00.000Z",
        "DiaChiGiao": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "NguoiNhan": "Nguyễn Văn A",
        "SDT": "0123456789",
        "ThoiGianGiao": "2025-01-26T14:00:00.000Z",
        "TongTien": 1500000,
        "KhachHang": { ... },
        "TrangThaiDH": {
          "MaTTDH": 3,
          "TrangThai": "Đang giao hàng"
        },
        "CT_DonDatHangs": [ ... ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### Xác nhận giao hàng
```json
{
  "success": true,
  "message": "Xác nhận giao hàng thành công",
  "data": {
    "MaDDH": 123,
    "TrangThaiDH": {
      "MaTTDH": 4,
      "TrangThai": "Hoàn tất"
    }
  }
}
```

## Bảo Mật

### Kiểm Tra Quyền
- **Frontend**: Sử dụng `usePermission` hook để kiểm tra quyền
- **Backend**: Kiểm tra JWT token và quyền cụ thể
- **Route Protection**: Sử dụng `ProtectedRoute` component

### Phân Quyền Theo Vai Trò
- **Admin**: Toàn quyền (`toanquyen`)
- **Nhân viên cửa hàng**: Quản lý đơn hàng (`donhang.xem`)
- **Nhân viên giao hàng**: Chỉ xem đơn được phân công (`donhang.xem_duoc_giao`)

## Testing

### Test Case 1: Nhân Viên Giao Hàng
1. Đăng nhập với tài khoản nhân viên giao hàng
2. Truy cập `/admin/orders`
3. Kiểm tra chỉ hiển thị đơn hàng được phân công
4. Test chức năng xác nhận giao hàng

### Test Case 2: Admin
1. Đăng nhập với tài khoản admin
2. Truy cập `/admin/orders`
3. Kiểm tra hiển thị tất cả đơn hàng
4. Test chức năng phân công nhân viên giao hàng

### Test Case 3: Nhân Viên Cửa Hàng
1. Đăng nhập với tài khoản nhân viên cửa hàng
2. Truy cập `/admin/orders`
3. Kiểm tra hiển thị tất cả đơn hàng
4. Test chức năng duyệt đơn hàng

## Troubleshooting

### Lỗi Thường Gặp

1. **Không hiển thị đơn hàng**
   - Kiểm tra quyền `donhang.xem_duoc_giao`
   - Kiểm tra đơn hàng có được phân công cho nhân viên không

2. **Không thể xác nhận giao hàng**
   - Kiểm tra quyền `donhang.xacnhan_giaohang`
   - Kiểm tra trạng thái đơn hàng phải là "Đang giao"

3. **Lỗi API**
   - Kiểm tra JWT token có hợp lệ không
   - Kiểm tra backend API có hoạt động không

## Cập Nhật Database

### Bảng VaiTro
```sql
-- Đảm bảo có vai trò nhân viên giao hàng
INSERT INTO VaiTro (MaVaiTro, TenVaiTro) VALUES
(3, 'NhanVienGiaoHang')
ON DUPLICATE KEY UPDATE TenVaiTro = 'NhanVienGiaoHang';
```

### Bảng Quyen
```sql
-- Thêm quyền cho nhân viên giao hàng
INSERT INTO Quyen (MaQuyen, TenQuyen, MoTa) VALUES
('donhang.xem_duoc_giao', 'Xem đơn hàng được phân công giao', 'Quyền xem đơn hàng được phân công cho nhân viên giao hàng'),
('donhang.xacnhan_giaohang', 'Xác nhận giao hàng', 'Quyền xác nhận đã giao hàng thành công')
ON DUPLICATE KEY UPDATE TenQuyen = VALUES(TenQuyen);
```

## Kết Luận

Hệ thống đã được cập nhật thành công để hỗ trợ nhân viên giao hàng với các tính năng:
- ✅ Xem đơn hàng được phân công
- ✅ Xác nhận giao hàng
- ✅ Tìm kiếm và sắp xếp
- ✅ Phân trang
- ✅ Bảo mật theo quyền
- ✅ Tương thích với hệ thống hiện tại

API cũ vẫn được giữ nguyên cho admin và nhân viên cửa hàng, đảm bảo không ảnh hưởng đến chức năng hiện có. 