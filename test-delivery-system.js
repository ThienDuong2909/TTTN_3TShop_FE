// Test script cho hệ thống giao hàng nhân viên
// Chạy trong browser console hoặc Node.js

// Test 1: Kiểm tra API lấy đơn hàng được phân công
async function testGetAssignedOrders() {
  console.log("🧪 Test 1: Lấy đơn hàng được phân công");

  try {
    const response = await fetch(
      "https://api.3tshop.thienduong.info/api/orders/delivery/assigned?page=1&limit=10",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("✅ Response:", data);

    if (data.success) {
      console.log("✅ API hoạt động bình thường");
      console.log(`📦 Số đơn hàng: ${data.data.orders?.length || 0}`);
    } else {
      console.log("❌ API trả về lỗi:", data.message);
    }
  } catch (error) {
    console.log("❌ Lỗi kết nối:", error.message);
  }
}

// Test 2: Kiểm tra API xác nhận giao hàng
async function testConfirmDelivery(orderId = 123) {
  console.log(`🧪 Test 2: Xác nhận giao hàng cho đơn hàng #${orderId}`);

  try {
    const response = await fetch(
      `https://api.3tshop.thienduong.info/api/orders/delivery/${orderId}/confirm`,
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer YOUR_JWT_TOKEN_HERE",
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("✅ Response:", data);

    if (data.success) {
      console.log("✅ Xác nhận giao hàng thành công");
      console.log(`📦 Trạng thái mới: ${data.data.TrangThaiDH?.TrangThai}`);
    } else {
      console.log("❌ Xác nhận giao hàng thất bại:", data.message);
    }
  } catch (error) {
    console.log("❌ Lỗi kết nối:", error.message);
  }
}

// Test 3: Kiểm tra phân quyền
function testPermissions() {
  console.log("🧪 Test 3: Kiểm tra phân quyền");

  // Mock user data
  const mockUsers = [
    {
      role: "Admin",
      permissions: ["toanquyen"],
      canViewAllOrders: true,
      canViewAssignedOrders: true,
      canConfirmDelivery: true,
    },
    {
      role: "NhanVienCuaHang",
      permissions: ["donhang.xem", "donhang.capnhat_trangthai"],
      canViewAllOrders: true,
      canViewAssignedOrders: false,
      canConfirmDelivery: false,
    },
    {
      role: "NhanVienGiaoHang",
      permissions: ["donhang.xem_duoc_giao", "donhang.xacnhan_giaohang"],
      canViewAllOrders: false,
      canViewAssignedOrders: true,
      canConfirmDelivery: true,
    },
  ];

  mockUsers.forEach((user) => {
    console.log(`👤 ${user.role}:`);
    console.log(
      `   - Xem tất cả đơn hàng: ${user.canViewAllOrders ? "✅" : "❌"}`
    );
    console.log(
      `   - Xem đơn được phân công: ${user.canViewAssignedOrders ? "✅" : "❌"}`
    );
    console.log(
      `   - Xác nhận giao hàng: ${user.canConfirmDelivery ? "✅" : "❌"}`
    );
    console.log(`   - Quyền: ${user.permissions.join(", ")}`);
  });
}

// Test 4: Kiểm tra component logic
function testComponentLogic() {
  console.log("🧪 Test 4: Kiểm tra logic component");

  const testCases = [
    {
      userRole: "NhanVienGiaoHang",
      expectedComponent: "DeliveryStaffOrders",
      description: "Nhân viên giao hàng nên thấy component riêng",
    },
    {
      userRole: "Admin",
      expectedComponent: "Orders",
      description: "Admin nên thấy component quản lý đơn hàng",
    },
    {
      userRole: "NhanVienCuaHang",
      expectedComponent: "Orders",
      description: "Nhân viên cửa hàng nên thấy component quản lý đơn hàng",
    },
  ];

  testCases.forEach((testCase) => {
    console.log(`👤 ${testCase.userRole}:`);
    console.log(`   - Component: ${testCase.expectedComponent}`);
    console.log(`   - Mô tả: ${testCase.description}`);
  });
}

// Test 5: Kiểm tra route permissions
function testRoutePermissions() {
  console.log("🧪 Test 5: Kiểm tra quyền truy cập route");

  const routes = [
    {
      path: "/admin/orders",
      permissions: ["donhang.xem", "donhang.xem_duoc_giao"],
      description: "Route quản lý đơn hàng",
    },
    {
      path: "/admin/delivery-orders",
      permissions: ["donhang.xem_duoc_giao"],
      description: "Route đơn hàng giao hàng",
    },
  ];

  routes.forEach((route) => {
    console.log(`🔗 ${route.path}:`);
    console.log(`   - Quyền cần thiết: ${route.permissions.join(", ")}`);
    console.log(`   - Mô tả: ${route.description}`);
  });
}

// Chạy tất cả test
function runAllTests() {
  console.log("🚀 Bắt đầu test hệ thống giao hàng...\n");

  testPermissions();
  console.log("\n");

  testComponentLogic();
  console.log("\n");

  testRoutePermissions();
  console.log("\n");

  console.log("📝 Để test API, hãy:");
  console.log("1. Thay thế YOUR_JWT_TOKEN_HERE bằng token thực");
  console.log("2. Chạy testGetAssignedOrders()");
  console.log("3. Chạy testConfirmDelivery(orderId)");
  console.log("\n");

  console.log("✅ Test hoàn tất!");
}

// Export functions để có thể chạy riêng lẻ
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testGetAssignedOrders,
    testConfirmDelivery,
    testPermissions,
    testComponentLogic,
    testRoutePermissions,
    runAllTests,
  };
}

// Chạy test nếu được gọi trực tiếp
if (typeof window !== "undefined") {
  // Browser environment
  window.testDeliverySystem = {
    testGetAssignedOrders,
    testConfirmDelivery,
    testPermissions,
    testComponentLogic,
    testRoutePermissions,
    runAllTests,
  };

  console.log("🔧 Delivery System Test đã sẵn sàng!");
  console.log("💡 Chạy runAllTests() để test toàn bộ hệ thống");
}
