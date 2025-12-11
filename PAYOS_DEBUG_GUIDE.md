# Hướng dẫn Debug PayOS Error

## Lỗi hiện tại: "Thông tin truyền lên không hợp lệ"

Đây là lỗi từ PayOS API khi backend gửi dữ liệu không đúng format. Các nguyên nhân phổ biến:

### 1. Kiểm tra Backend Response
Mở DevTools (F12) → Tab Network → Tìm request `create-payment-link` → Xem Response

Cần kiểm tra:
- `amount`: Phải là **số nguyên** (VD: 680000, KHÔNG được 680000.5)
- `orderCode`: Phải là **số nguyên dương** (VD: 123456, KHÔNG được quá lớn hoặc âm)
- `items`: Mảng sản phẩm, mỗi item cần:
  ```json
  {
    "name": "Tên sản phẩm",
    "quantity": 1,
    "price": 680000  // Phải là số nguyên
  }
  ```

### 2. Fix Backend (Nếu có quyền)

Trong file backend xử lý PayOS (VD: `controllers/paymentController.js`):

```javascript
exports.createPaymentLink = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Lấy thông tin đơn hàng từ DB
    const order = await getOrderById(orderId);
    
    // ⚠️ ĐẢM BẢO AMOUNT LÀ SỐ NGUYÊN
    const amount = Math.round(order.totalAmount); // Làm tròn nếu có phần thập phân
    
    // ⚠️ ORDER CODE PHẢI LÀ SỐ NGUYÊN DƯƠNG
    const orderCode = Number(String(Date.now()).slice(-9)); // Lấy 9 chữ số cuối timestamp
    
    const body = {
      orderCode: orderCode,
      amount: amount, // Số nguyên
      description: `Thanh toan don hang ${orderId}`,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price) // ⚠️ Đảm bảo price là số nguyên
      })),
      returnUrl: `${process.env.CLIENT_URL}/checkout-success`,
      cancelUrl: `${process.env.CLIENT_URL}/checkout-fail`,
    };
    
    // Gọi PayOS API
    const paymentLinkResponse = await payOS.paymentRequests.create(body);
    
    // Lưu orderCode vào DB để đối soát sau
    await updateOrder(orderId, { payosOrderCode: orderCode });
    
    return res.json({
      success: true,
      data: {
        checkoutUrl: paymentLinkResponse.checkoutUrl,
      },
    });
    
  } catch (error) {
    console.error("PayOS Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

### 3. Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| "Thông tin truyền lên không hợp lệ" | `amount` hoặc `price` có phần thập phân | Dùng `Math.round()` |
| "orderCode invalid" | `orderCode` quá lớn hoặc không phải số | Dùng timestamp 9 chữ số cuối |
| "items invalid" | Thiếu trường hoặc sai kiểu dữ liệu | Kiểm tra cấu trúc items |

### 4. Test với Postman

Thử gọi trực tiếp API backend:
```
POST http://localhost:3000/api/payment/payos/create-payment-link/123
```

Xem response có đúng format không.

### 5. Liên hệ Backend Developer

Nếu bạn không có quyền sửa backend, hãy gửi thông tin sau cho backend developer:
- Screenshot lỗi trong iframe PayOS
- Request/Response của API `create-payment-link` (từ Network tab)
- Link tài liệu PayOS: https://payos.vn/docs/api/
