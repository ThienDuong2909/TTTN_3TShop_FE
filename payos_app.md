import React, { useState, useEffect } from "react";
import "./App.css";
const OrderInformation = () => (
  <div className="main-box">
    <div className="checkout">
      <div className="product">
        <p><strong>Tên sản phẩm:</strong> Mì tôm Hảo Hảo ly</p>
        <p><strong>Giá tiền:</strong> 2000 VNĐ</p>
        <p><strong>Số lượng:</strong> 1</p>
      </div>
      <form action="/create-payment-link" method="post">
        <button type="submit" id="create-payment-link-btn">
          Tạo Link thanh toán
        </button>
      </form>
    </div>
  </div>
);

const CheckoutMessage = ({ message }) => (
  <div className="main-box">
    <div className="checkout">
      <div className="product">
        <p>{message}</p>
      </div>
      <form action="/">
        <button type="submit" id="create-payment-link-btn">
          Quay lại trang thanh toán
        </button>
      </form>
    </div>
  </div>
);

export default function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Kiểm tra trạng thái đơn hàng
    const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setMessage("Thanh toán thành công. Cảm ơn bạn đã sử dụng payOS!");
    }

    if (query.get("canceled")) {
      setMessage(
        "Thanh toán thất bại. Nếu có bất kỳ câu hỏi nào hãy gửi email tới support@payos.vn."
      );
    }
  }, []);

  return message ? (
    <CheckoutMessage message={message} />
  ) : (
    <OrderInformation />
  );
}