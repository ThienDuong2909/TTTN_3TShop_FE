📁 Website Structure
├── 🏠 Public Area
│   ├── Trang chủ (Index.tsx) - Landing page đầy đủ
│   ├── Trang sản phẩm (ProductListing.tsx) - Danh sách sản phẩm
│   ├── Chi tiết sản phẩm (ProductDetail.tsx) - Thông tin chi tiết
│   ├── Đăng nhập (Login.tsx) - Form authentication
│   └── Đăng ký (Register.tsx) - Form registration
│
├── 🔐 Protected User Area
│   ├── Hồ sơ (Profile.tsx) - Quản lý tài khoản
│   ├── Giỏ hàng (Cart.tsx) - Shopping cart
│   └── Thanh toán (Checkout.tsx) - Payment process
│
├── 👨‍💼 Admin Area (AdminLayout)
│   ├── Dashboard (AdminDashboard.tsx) - Tổng quan hệ thống
│   ├── Quản lý sản phẩm (ProductManagement.tsx) - CRUD products
│   ├── Đơn đặt hàng (PurchaseOrders.tsx) - Order management
│   └── Phiếu nhập hàng (GoodsReceipt.tsx) - Inventory management
│
└── 📋 Business Operations
    ├── Phiếu đặt hàng (PurchaseOrderPage.jsx) - Create purchase orders
    └── Phiếu nhập hàng (GoodsReceiptPage.jsx) - Create goods receipts