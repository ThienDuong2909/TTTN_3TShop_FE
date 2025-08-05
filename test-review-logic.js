// Test case cho logic đánh giá đơn hàng dựa trên API response
const orderWithReviews = {
  "MaDDH": 5,
  "TrangThaiDH": { "TrangThai": "HOANTAT" },
  "CT_DonDatHangs": [
    {
      "MaCTDDH": 16,
      "ChiTietSanPham": { 
        "SanPham": { "TenSP": "Áo thun nam" },
        "Mau": { "TenMau": "Đỏ" },
        "KichThuoc": { "TenKichThuoc": "L" }
      },
      "BinhLuans": [
        { "MaBL": 6, "MoTa": "Oke sẽ mua tiếp", "SoSao": 5 }
      ] // Đã có đánh giá
    },
    {
      "MaCTDDH": 26,
      "ChiTietSanPham": { 
        "SanPham": { "TenSP": "Serenity Tee 2025" },
        "Mau": { "TenMau": "Cam" },
        "KichThuoc": { "TenKichThuoc": "M" }
      },
      "BinhLuans": [] // Chưa có đánh giá
    }
  ],
  "DanhSachBinhLuan": [
    {
      "MaBL": 6,
      "MaCTDDH": 16,
      "MoTa": "Oke sẽ mua tiếp",
      "SoSao": 5,
      "NgayBinhLuan": "2025-08-02T08:36:41.000Z",
      "TenSanPham": "Áo thun nam",
      "KichThuoc": "L",
      "MauSac": "Đỏ"
    }
  ]
};

const orderNoReviews = {
  "MaDDH": 3,
  "TrangThaiDH": { "TrangThai": "HOANTAT" },
  "CT_DonDatHangs": [
    {
      "MaCTDDH": 2,
      "ChiTietSanPham": { 
        "SanPham": { "TenSP": "Áo thun nam" }
      },
      "BinhLuans": []
    }
  ],
  "DanhSachBinhLuan": []
};

// Logic test functions
const hasReviews = (order) => {
  return order.DanhSachBinhLuan && order.DanhSachBinhLuan.length > 0;
};

const getUnreviewedProducts = (order) => {
  return order.CT_DonDatHangs.filter(ct => !ct.BinhLuans || ct.BinhLuans.length === 0);
};

const getReviewedProducts = (order) => {
  return order.CT_DonDatHangs.filter(ct => ct.BinhLuans && ct.BinhLuans.length > 0);
};

// Test cases
console.log("=== TEST RESULTS ===");
console.log("Order 5:");
console.log("- Có đánh giá:", hasReviews(orderWithReviews)); // true -> "Xem đánh giá"
console.log("- Sản phẩm đã đánh giá:", getReviewedProducts(orderWithReviews).length); // 1
console.log("- Sản phẩm chưa đánh giá:", getUnreviewedProducts(orderWithReviews).length); // 1
console.log("- Action: Hiển thị nút 'Xem đánh giá', click vào 'Đánh giá' chỉ show sản phẩm chưa review");

console.log("\nOrder 3:");
console.log("- Có đánh giá:", hasReviews(orderNoReviews)); // false -> "Đánh Giá"
console.log("- Sản phẩm đã đánh giá:", getReviewedProducts(orderNoReviews).length); // 0
console.log("- Sản phẩm chưa đánh giá:", getUnreviewedProducts(orderNoReviews).length); // 1
console.log("- Action: Hiển thị nút 'Đánh Giá', click để đánh giá tất cả sản phẩm");

// UI Logic
console.log("\n=== UI BEHAVIOR ===");
console.log("Order 5 - Mixed reviews:");
console.log("- Button:", hasReviews(orderWithReviews) ? "Xem đánh giá (blue)" : "Đánh Giá (default)");
console.log("- Products with badge:", getReviewedProducts(orderWithReviews).map(p => p.ChiTietSanPham.SanPham.TenSP));
console.log("- Available to review:", getUnreviewedProducts(orderWithReviews).map(p => p.ChiTietSanPham.SanPham.TenSP));

console.log("\nOrder 3 - No reviews:");
console.log("- Button:", hasReviews(orderNoReviews) ? "Xem đánh giá (blue)" : "Đánh Giá (default)");
console.log("- Products with badge:", getReviewedProducts(orderNoReviews).map(p => p.ChiTietSanPham.SanPham.TenSP));
console.log("- Available to review:", getUnreviewedProducts(orderNoReviews).map(p => p.ChiTietSanPham.SanPham.TenSP));
