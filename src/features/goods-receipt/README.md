# Chức năng Import Excel cho Phiếu Nhập Hàng

## Tổng quan

Chức năng Import Excel cho phép người dùng nhập dữ liệu phiếu nhập hàng từ file Excel một cách nhanh chóng và chính xác.

## Tính năng chính

### 1. Tải Template Excel
- Tự động tạo template Excel dựa trên phiếu đặt hàng đã chọn
- Bao gồm tất cả sản phẩm từ phiếu đặt hàng
- Định dạng sẵn với header và styling
- Tên file: `goods_receipt_template_{Mã_Phiếu_Đặt_Hàng}.xlsx`

### 2. Upload và Xử lý File Excel
- Hỗ trợ định dạng `.xlsx` và `.xls`
- Giới hạn kích thước file: 5MB
- Validation cấu trúc file và dữ liệu
- Xử lý lỗi chi tiết với thông báo cụ thể

### 3. Validation dữ liệu
- Kiểm tra các cột bắt buộc
- Validate định dạng dữ liệu
- Kiểm tra tính hợp lệ của số lượng
- Validate tình trạng sản phẩm

### 4. Preview dữ liệu
- Xem trước dữ liệu đã import
- Hiển thị thông tin chi tiết từng sản phẩm
- Tính toán tổng giá trị
- Hiển thị tình trạng sản phẩm với badge màu sắc

## Cấu trúc Template Excel

### Các cột bắt buộc:
1. **STT**: Số thứ tự
2. **product_id**: Mã sản phẩm
3. **product_name**: Tên sản phẩm
4. **color**: Màu sắc (tùy chọn)
5. **size**: Kích thước (tùy chọn)
6. **ordered_quantity**: Số lượng đã đặt
7. **received_quantity**: Số lượng nhận (bắt buộc)
8. **condition**: Tình trạng sản phẩm (good/damaged/defective)
9. **notes**: Ghi chú (tùy chọn)

### Ví dụ dữ liệu:
```
STT | product_id | product_name | color | size | ordered_quantity | received_quantity | condition | notes
1   | SP001      | Áo sơ mi nam | #ffffff | L | 50 | 48 | good | Nhận thiếu 2 cái
2   | SP002      | Quần jean | #0000ff | M | 30 | 30 | good | 
```

## Cách sử dụng

### Bước 1: Chọn phiếu đặt hàng
- Chọn phiếu đặt hàng từ dropdown
- Hệ thống sẽ tự động load thông tin sản phẩm

### Bước 2: Tải template Excel
- Nhấn nút "Tải Template Excel"
- File template sẽ được tải về với tên: `goods_receipt_template_{Mã_Phiếu}.xlsx`

### Bước 3: Điền dữ liệu
- Mở file template trong Excel
- Điền thông tin số lượng nhận, tình trạng, ghi chú
- Lưu file

### Bước 4: Upload file
- Nhấn nút "Upload File Excel"
- Chọn file đã điền dữ liệu
- Hệ thống sẽ validate và xử lý dữ liệu

### Bước 5: Xem trước và xác nhận
- Xem trước dữ liệu đã import
- Kiểm tra thông tin chính xác
- Xác nhận để tạo phiếu nhập hàng

## Validation Rules

### 1. Validation cấu trúc file
- File phải có ít nhất 1 dòng dữ liệu
- Phải có các cột bắt buộc: product_id, product_name, received_quantity

### 2. Validation dữ liệu
- **product_id**: Không được để trống
- **product_name**: Không được để trống
- **received_quantity**: Phải là số dương
- **condition**: Phải là một trong: good, damaged, defective

### 3. Validation logic nghiệp vụ
- Số lượng nhận không được vượt quá số lượng đặt
- Sản phẩm phải tồn tại trong phiếu đặt hàng

## Xử lý lỗi

### 1. Lỗi cấu trúc file
- Thiếu cột bắt buộc
- File không có dữ liệu
- Định dạng file không đúng

### 2. Lỗi dữ liệu
- Dữ liệu không hợp lệ
- Số lượng âm hoặc không phải số
- Tình trạng không đúng định dạng

### 3. Lỗi logic nghiệp vụ
- Sản phẩm không tồn tại trong phiếu đặt hàng
- Số lượng nhận vượt quá số lượng đặt

## Giao diện người dùng

### 1. Card Import Excel
- Header với icon và tiêu đề
- Nút tải template và upload file
- Hiển thị trạng thái import

### 2. Thông báo lỗi
- Alert component với icon cảnh báo
- Hiển thị danh sách lỗi chi tiết
- Giới hạn hiển thị 5 lỗi đầu tiên

### 3. Thông báo thành công
- Alert component với icon check
- Hiển thị số lượng dữ liệu đã import
- Nút xem trước và xóa dữ liệu

### 4. Dialog Preview
- Bảng hiển thị dữ liệu đã import
- Thông tin chi tiết từng sản phẩm
- Tổng giá trị nhập hàng
- Badge màu sắc cho tình trạng

## Technical Details

### Dependencies
- `xlsx`: Xử lý file Excel
- `lucide-react`: Icons
- `@radix-ui/react-dialog`: Dialog component
- `@radix-ui/react-alert`: Alert component

### State Management
- `excelData`: Dữ liệu thô từ Excel
- `excelError`: Thông báo lỗi
- `validationErrors`: Danh sách lỗi validation
- `processedItems`: Dữ liệu đã xử lý
- `isPreviewOpen`: Trạng thái dialog preview

### Key Functions
- `handleFileUpload`: Xử lý upload file
- `validateExcelStructure`: Kiểm tra cấu trúc file
- `validateExcelData`: Kiểm tra dữ liệu
- `processExcelData`: Xử lý và chuyển đổi dữ liệu
- `downloadExcelTemplate`: Tạo và tải template
- `clearExcelData`: Xóa dữ liệu đã import

## Best Practices

### 1. Template Design
- Sử dụng header với styling rõ ràng
- Đặt độ rộng cột phù hợp
- Sử dụng màu sắc để phân biệt header

### 2. Error Handling
- Hiển thị lỗi chi tiết với số dòng
- Giới hạn số lượng lỗi hiển thị
- Cung cấp hướng dẫn sửa lỗi

### 3. User Experience
- Preview dữ liệu trước khi xác nhận
- Toast notification cho các hành động
- Nút xóa dữ liệu để import lại

### 4. Performance
- Giới hạn kích thước file upload
- Validation từng bước để tránh xử lý dữ liệu lỗi
- Lazy loading cho dialog preview 