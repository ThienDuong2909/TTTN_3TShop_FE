# Hướng dẫn cấu hình Cloudinary cho upload hình ảnh

## Bước 1: Tạo tài khoản Cloudinary
1. Truy cập https://cloudinary.com/
2. Đăng ký tài khoản miễn phí
3. Xác nhận email và đăng nhập

## Bước 2: Lấy thông tin cấu hình
1. Vào Dashboard của Cloudinary
2. Sao chép **Cloud Name** (ví dụ: `your_cloud_name`)
3. Vào **Settings** > **Upload** 
4. Tạo một **Upload Preset**:
   - Click "Add upload preset"
   - Chọn mode: **Unsigned** 
   - Đặt tên preset (ví dụ: `product_images`)
   - Lưu preset

## Bước 3: Cập nhật cấu hình trong code
Mở file `src/config/cloudinary.ts` và thay đổi:

```typescript
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'your_actual_cloud_name', // Thay bằng Cloud Name thực tế
  UPLOAD_PRESET: 'your_actual_upload_preset', // Thay bằng Upload Preset thực tế
  get API_URL() {
    return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  }
};
```

## Ví dụ cấu hình:
```typescript
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'tttn-3tshop',
  UPLOAD_PRESET: 'product_images',
  get API_URL() {
    return `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  }
};
```

## Bước 4: Test upload
1. Khởi động lại ứng dụng: `npm run dev`
2. Vào trang thêm sản phẩm
3. Thử upload một hình ảnh để kiểm tra

## Troubleshooting
- **Lỗi "Upload preset not found"**: Kiểm tra lại tên upload preset
- **Lỗi "Invalid cloud name"**: Kiểm tra lại cloud name
- **Lỗi CORS**: Đảm bảo upload preset được đặt ở mode "Unsigned"

## Tính năng hiện tại:
- ✅ Upload từ 1-5 hình ảnh
- ✅ Validation file (chỉ nhận hình ảnh, tối đa 5MB)
- ✅ Hiển thị progress khi upload
- ✅ Tự động đặt ảnh đầu tiên làm ảnh chính
- ✅ Thông báo chi tiết kết quả upload
