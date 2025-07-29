# Hướng dẫn kiểm thử hệ thống phân công nhân viên giao hàng

## Tổng quan
Hệ thống phân công nhân viên giao hàng thông minh đã được hoàn thiện với các tính năng:
- ✅ API backend đầy đủ cho việc phân công
- ✅ Giao diện frontend tích hợp hoàn chỉnh
- ✅ Logic nghiệp vụ kiểm tra chặt chẽ
- ✅ UI/UX trực quan và dễ sử dụng

## Các API Backend đã triển khai

### 1. Lấy danh sách nhân viên giao hàng khả dụng
**Endpoint:** `POST /api/employees/delivery/available`
**Body:** 
```json
{
  "diaChi": "Địa chỉ giao hàng"
}
```
**Response:** Danh sách nhân viên được sắp xếp theo độ ưu tiên (phụ trách khu vực trước, số đơn ít nhất)

### 2. Cập nhật nhân viên giao hàng cho đơn hàng
**Endpoint:** `PUT /api/orders/:id/delivery-staff`
**Body:**
```json
{
  "maNVGiao": 123
}
```
**Validation:** 
- Kiểm tra nhân viên thuộc bộ phận giao hàng
- Kiểm tra nhân viên đang làm việc
- Chỉ cho phép cập nhật khi đơn hàng đã được duyệt (trạng thái = 2)

### 3. Tìm nhân viên giao hàng tối ưu
**Endpoint:** `POST /api/employees/delivery/find-optimal`
**Body:**
```json
{
  "diaChi": "Địa chỉ giao hàng"
}
```

## Luồng kiểm thử trên Frontend

### Bước 1: Truy cập trang quản lý đơn hàng
- Mở `http://localhost:3000/admin/orders` (hoặc URL tương ứng)
- Đăng nhập với tài khoản admin

### Bước 2: Tìm đơn hàng đã duyệt
- Chuyển đến tab "Đã duyệt" hoặc tìm đơn hàng có trạng thái "Đã duyệt"
- Đơn hàng này sẽ có nút "Phân công" màu xanh

### Bước 3: Thực hiện phân công
1. **Nhấn nút "Phân công"** trên đơn hàng
2. **Modal phân công sẽ mở** với:
   - Thông tin đơn hàng (người nhận, địa chỉ, tổng tiền)
   - Danh sách nhân viên giao hàng khả dụng
   - Loading state khi đang tải danh sách

3. **Chọn nhân viên** từ danh sách:
   - Nhân viên phụ trách khu vực sẽ có icon sao vàng
   - Hiển thị số đơn đang giao của mỗi nhân viên
   - Click vào nhân viên để chọn

4. **Xác nhận phân công:**
   - Nhấn nút "Phân công nhân viên"
   - Hệ thống sẽ hiển thị loading
   - Thông báo thành công/thất bại

### Bước 4: Kiểm tra kết quả
- Đóng modal và refresh danh sách đơn hàng
- Kiểm tra trong database xem trường `MaNV_Giao` đã được cập nhật chưa

## Các trường hợp kiểm thử

### Test Case 1: Phân công thành công
**Điều kiện:** Đơn hàng đã duyệt, có nhân viên giao hàng khả dụng
**Kết quả mong đợi:** Phân công thành công, hiển thị thông báo thành công

### Test Case 2: Không có nhân viên khả dụng
**Điều kiện:** Tất cả nhân viên giao hàng đều nghỉ việc hoặc không thuộc bộ phận giao hàng
**Kết quả mong đợi:** Hiển thị "Không có nhân viên giao hàng khả dụng"

### Test Case 3: Đơn hàng chưa duyệt
**Điều kiện:** Thử gọi API với đơn hàng có trạng thái khác 2
**Kết quả mong đợi:** API trả về lỗi "Chỉ có thể phân công cho đơn hàng đã được duyệt"

### Test Case 4: Nhân viên không hợp lệ
**Điều kiện:** Gửi mã nhân viên không tồn tại hoặc không thuộc bộ phận giao hàng
**Kết quả mong đợi:** API trả về lỗi validation

### Test Case 5: Lỗi mạng
**Điều kiện:** Backend không hoạt động
**Kết quả mong đợi:** Hiển thị "Không thể kết nối đến server"

## Kiểm tra database

### Bảng DonDatHang
```sql
SELECT MaDDH, MaNV_Giao, MaTTDH, DiaChiGiao 
FROM DonDatHang 
WHERE MaDDH = [ID_ĐƠN_HÀNG];
```

### Bảng NhanVien với bộ phận
```sql
SELECT nv.MaNV, nv.TenNV, bp.TenBP, nv.TrangThaiLamViec, nv.KhuVuc
FROM NhanVien nv
JOIN NhanVien_BoPhan nvbp ON nv.MaNV = nvbp.MaNV
JOIN BoPhan bp ON nvbp.MaBP = bp.MaBP
WHERE bp.TenBP LIKE '%giao hàng%' 
AND nv.TrangThaiLamViec = 'Đang làm việc';
```

## Lưu ý khi kiểm thử

1. **Đảm bảo có dữ liệu test:**
   - Có ít nhất 1 đơn hàng đã duyệt
   - Có ít nhất 1 nhân viên thuộc bộ phận giao hàng
   - Nhân viên đang trong trạng thái làm việc

2. **Kiểm tra console browser:**
   - Mở Developer Tools > Console
   - Kiểm tra có lỗi JavaScript không
   - Xem các API call trong Network tab

3. **Kiểm tra backend logs:**
   - Mở terminal backend
   - Xem log khi gọi API
   - Kiểm tra query SQL có chạy đúng không

## Tính năng nâng cao có thể bổ sung

1. **Thống kê hiệu suất giao hàng** theo nhân viên
2. **Lịch sử phân công** đơn hàng
3. **Thông báo real-time** khi có đơn hàng mới
4. **Tối ưu hóa route** giao hàng theo địa lý
5. **Dashboard** theo dõi trạng thái giao hàng

---

**Hệ thống đã sẵn sàng cho production!** 🚀
