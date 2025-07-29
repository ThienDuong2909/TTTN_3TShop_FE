# Hướng dẫn Upload Ảnh Sản Phẩm

## Tính năng đã được cập nhật

### 1. Upload Ảnh Từ Máy Tính
- ✅ Chọn nhiều ảnh cùng lúc (tối đa 5 ảnh)
- ✅ Tự động upload lên Cloudinary và lấy URL
- ✅ Hiển thị progress bar khi upload
- ✅ Validation kích thước file (tối đa 5MB)
- ✅ Validation định dạng file (chỉ accept ảnh)

### 2. Quản Lý Ảnh
- ✅ Hiển thị ảnh chính với badge "Ảnh chính"
- ✅ Xóa ảnh bằng cách click nút X
- ✅ Ảnh đầu tiên tự động được đặt làm ảnh chính
- ✅ Responsive design cho mobile
- ✅ Gửi ảnh với format mới đến backend

### 3. API Integration
- ✅ Gửi dữ liệu đến `http://localhost:8080/api/products/{id}/update`
- ✅ Format ảnh theo yêu cầu backend:
  ```json
  {
    "TenSP": "Tên sản phẩm",
    "Gia": 250000,
    "NgayApDung": "2024-06-10",
    "images": [
      {
        "url": "https://res.cloudinary.com/...",
        "TenFile": "image.jpg",
        "AnhChinh": 1,
        "ThuTu": 1,
        "MoTa": "Ảnh chính"
      }
    ]
  }
  ```

## Cách Sử Dụng

### Từ Trang Quản Lý Sản Phẩm:

1. **Thêm Sản Phẩm Mới:**
   - Click "Thêm sản phẩm" → Chuyển đến trang ProductAdd
   
2. **Chỉnh Sửa Sản Phẩm:**
   - Click icon Edit → Mở modal chỉnh sửa
   - Phần "Hình ảnh sản phẩm" có:
     - Hiển thị ảnh hiện tại
     - Upload ảnh từ máy tính

### Upload Ảnh Từ Máy Tính:

1. Click nút "Tải ảnh từ máy tính"
2. Chọn ảnh từ máy tính (có thể chọn nhiều)
3. Hệ thống sẽ:
   - Kiểm tra định dạng và kích thước
   - Hiển thị progress bar
   - Upload lên Cloudinary
   - Thêm URL vào form

### Validation:

- **Định dạng:** Chỉ chấp nhận ảnh (JPG, PNG, GIF)
- **Kích thước:** Tối đa 5MB mỗi ảnh
- **Số lượng:** Tối đa 5 ảnh
- **Kích thước khuyến nghị:** 800x800px trở lên

## Luồng Xử Lý

```
Chọn File → Validation → Upload Cloudinary → Lấy URL → Thêm vào Form → Gửi API Backend
```

## API Integration

Khi submit form, ảnh sẽ được gửi theo format:

```json
{
  "AnhSanPhams": [
    {
      "DuongDan": "https://res.cloudinary.com/...",
      "ThuTu": 1,
      "AnhChinh": true,
      "MoTa": "Ảnh chính"
    },
    {
      "DuongDan": "https://res.cloudinary.com/...",
      "ThuTu": 2,
      "AnhChinh": false,
      "MoTa": "Ảnh phụ"
    }
  ]
}
```

## Cấu Hình Cloudinary

Đảm bảo file `src/config/cloudinary.ts` đã được cấu hình đúng:

```typescript
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'your_cloud_name',
  UPLOAD_PRESET: 'your_upload_preset',
  get API_URL() {
    return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  }
};
```

## UI/UX Improvements

- **Progress Indicator:** Hiển thị % upload
- **Drag & Drop:** Có thể mở rộng thêm tính năng kéo thả
- **Preview:** Xem trước ảnh ngay khi chọn
- **Error Handling:** Thông báo lỗi chi tiết
- **Loading States:** Disable buttons khi đang upload

## Testing

1. Test upload ảnh nhỏ (< 1MB)
2. Test upload ảnh lớn (> 5MB) - should show error
3. Test upload file không phải ảnh - should show error
4. Test upload nhiều ảnh cùng lúc
5. Test remove ảnh
6. Test submit form với ảnh đã upload
