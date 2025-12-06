import { data } from "react-router-dom";
import api from "./fetch";

// ===================
// HELPER FUNCTIONS
// ===================

// Xử lý lỗi đơn giản
const handleError = (error) => {
  const message =
    error.response?.data?.message || error.message || "Có lỗi xảy ra";
  const errorDetail = error.response?.data?.error;
  console.error("API Error:", message);
  // Return error object with success: false to be consistent
  // Return specific error message in 'error' field if available, otherwise use generic message or true
  return {
    success: false,
    error: errorDetail || message || true,
    message,
  };
};

// Xử lý API response chung - kiểm tra lỗi 401 cho tất cả API calls
const handleApiCall = async (apiCallFn) => {
  try {
    const response = await apiCallFn();
    return response;
  } catch (error) {
    // Kiểm tra lỗi 401 Unauthorized
    if (error.response?.status === 401) {
      const unauthorizedMessage = "Bạn không có quyền truy cập";
      console.error("API Error 401:", unauthorizedMessage);
      showError(unauthorizedMessage);
      throw { error: true, message: unauthorizedMessage, status: 401 };
    }
    throw error;
  }
};

// Wrapper chung cho tất cả API calls để tự động kiểm tra 401
const apiWrapper = {
  get: async (url, config) => handleApiCall(() => api.get(url, config)),
  post: async (url, data, config) =>
    handleApiCall(() => api.post(url, data, config)),
  put: async (url, data, config) =>
    handleApiCall(() => api.put(url, data, config)),
  delete: async (url, config) => handleApiCall(() => api.delete(url, config)),
};

// Format date cho API
const formatDateForApi = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

// ===================
// EMPLOYEE API
// ===================

// Lấy danh sách nhân viên
export const getEmployees = async () => {
  try {
    const response = await api.get("/employees");
    const result = response.data;

    if (result.success && Array.isArray(result.data)) {
      const mapped = result.data.map((item) => {
        // Find latest department (most recent NgayBatDau) for all employee info
        const latestDepartment =
          item.NhanVien_BoPhans?.reduce((latest, current) => {
            if (!latest) return current;
            return new Date(current.NgayBatDau) > new Date(latest.NgayBatDau)
              ? current
              : latest;
          }, null) || {};

        const mappedEmployee = {
          maNV: item.MaNV,
          tenNV: item.TenNV || "MISSING NAME",
          ngaySinh: item.NgaySinh,
          diaChi: item.DiaChi,
          luong: item.Luong ? parseInt(item.Luong) : undefined,
          maTK: item.MaTK,

          department: latestDepartment.BoPhan?.MaBoPhan?.toString() || "",
          departmentName: latestDepartment.BoPhan?.TenBoPhan || "",
          username: item.TaiKhoan?.Email || "MISSING EMAIL",
          isActive: latestDepartment.TrangThai || "",
          createdAt: latestDepartment.NgayBatDau || "",
          updatedAt: latestDepartment.NgayKetThuc || "",
          khuVucPhuTrach: item.KhuVucPhuTrach || [],
        };
        return mappedEmployee;
      });

      return mapped;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Không thể tải danh sách nhân viên");
  }
};

// Lấy thông tin nhân viên hiện tại
export const getCurrentEmployee = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo nhân viên mới
export const createEmployee = async (data) => {
  try {
    const response = await api.post("/employees", data);
    const result = response.data;

    if (result.success) {
      return result;
    } else {
      throw new Error(result.message || "Không thể tạo nhân viên");
    }
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error(error.response?.data?.message || "Lỗi khi tạo nhân viên");
  }
};

// Cập nhật thông tin nhân viên
export const updateEmployee = async (employeeId, data) => {
  try {
    const response = await api.put(`/employees/${employeeId}`, data);
    const result = response.data;

    if (result.success) {
      return result;
    } else {
      throw new Error(result.message || "Không thể cập nhật nhân viên");
    }
  } catch (error) {
    console.error("Error updating employee:", error);
    throw new Error(
      error.response?.data?.message || "Lỗi khi cập nhật nhân viên"
    );
  }
};

// Điều chuyển nhân viên
export const transferEmployee = async (data) => {
  try {
    const response = await api.post("/employees/transfer", data);
    const result = response.data;

    if (result.success) {
      return result;
    } else {
      throw new Error(result.message || "Không thể điều chuyển nhân viên");
    }
  } catch (error) {
    console.error("Error transferring employee:", error);
    throw new Error(
      error.response?.data?.message || "Lỗi khi điều chuyển nhân viên"
    );
  }
};

// Lấy lịch sử làm việc của nhân viên
export const getEmployeeWorkHistory = async (employeeId) => {
  try {
    const response = await api.get(
      `/employees/${employeeId}/department-history`
    );
    const result = response.data;

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching employee work history:", error);
    return []; // Return empty array on error to prevent forEach issues
  }
};

// Lấy thông tin chi tiết nhân viên
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// PERMISSIONS API
// ===================

// Lấy quyền của user hiện tại
export const fetchMyPermissions = async () => {
  try {
    const res = await api.get("/permissions/my-permissions");
    return res.data?.data || [];
  } catch (error) {
    return handleError(error);
  }
};

// Lấy tất cả quyền (admin)
export const fetchAllPermissions = async () => {
  try {
    const res = await api.get("/permissions/all");
    return res.data?.data || [];
  } catch (error) {
    return handleError(error);
  }
};
export const fetchAllPermissionsByRole = async (roleId) => {
  try {
    const res = await api.get(`/permissions/role/${roleId}`);
    return res.data?.data || [];
  } catch (error) {
    return handleError(error);
  }
};

// (Optional) Lấy quyền của một nhân viên theo id — nếu backend hỗ trợ
export const fetchEmployeePermissions = async (nhanVienId) => {
  try {
    const res = await api.get(`/permissions/employee/${nhanVienId}`);
    // Cho phép backend trả về mảng id hoặc mảng object { id }
    const data = res.data?.data || [];
    if (!Array.isArray(data)) return [];
    if (data.length > 0 && typeof data[0] === "object") {
      return data.map((p) => p.id).filter((v) => typeof v === "number");
    }
    return data;
  } catch (error) {
    // Nếu không có endpoint này, trả về mảng rỗng để UI vẫn hoạt động
    return [];
  }
};

// Gán quyền cho nhân viên (admin)
export const assignPermissionsToEmployee = async (
  nhanVienId,
  permissionIds
) => {
  try {
    const res = await api.put(`/permissions/employee/${nhanVienId}`, {
      permissionIds,
    });
    return res.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// SUPPLIER API
// ===================

// Lấy danh sách nhà cung cấp với phân trang
export const getSuppliers = async (page = 1) => {
  try {
    const response = await api.get(`/suppliers?page=${page}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy tất cả nhà cung cấp (không phân trang) - dùng cho ProductAdd
export const getAllSuppliers = async () => {
  try {
    const response = await api.get("/suppliers/get-all");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching all suppliers:", error);
    return [];
  }
};

// Tạo nhà cung cấp mới
export const createSupplier = async (data) => {
  try {
    const response = await api.post("/suppliers", data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật thông tin nhà cung cấp
export const updateSupplier = async (supplierId, data) => {
  try {
    const response = await api.put(`/suppliers/${supplierId}`, data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xóa nhà cung cấp
export const deleteSupplier = async (supplierId) => {
  try {
    const response = await api.delete(`/suppliers/${supplierId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thông tin chi tiết nhà cung cấp
export const getSupplierById = async (supplierId) => {
  try {
    const response = await api.get(`/suppliers/${supplierId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// DEPARTMENT API
// ===================

// Lấy danh sách bộ phận
export const getDepartments = async () => {
  try {
    const response = await api.get("/department");
    const result = response.data;

    if (result && result.success && Array.isArray(result.data)) {
      return result;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { success: false, data: [] };
  }
};

// Tạo bộ phận mới
export const createDepartment = async (data) => {
  try {
    const response = await api.post("/department", data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật thông tin bộ phận
export const updateDepartment = async (departmentId, data) => {
  try {
    const response = await api.put(`/department/${departmentId}`, data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái bộ phận (ẩn/hiển thị)
export const updateDepartmentStatus = async (departmentId, status) => {
  try {
    const response = await api.put(`/department/${departmentId}`, {
      TrangThai: status,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thông tin chi tiết bộ phận
export const getDepartmentById = async (departmentId) => {
  try {
    const response = await api.get(`/department/${departmentId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// PRODUCT API
// ===================

// Lấy danh sách sản phẩm với phân trang và filter
export const getProducts = async (params = {}) => {
  try {
    const { page = 1, pageSize = 8, search = "", category = "" } = params;

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) queryParams.append("search", search);
    // Nếu chọn "all" thì không truyền MaLoaiSP cho API
    if (category && category !== "all")
      queryParams.append("MaLoaiSP", category);

    const response = await api.get(
      `/products/get-all-products?${queryParams.toString()}`
    );
    const result = response.data;

    if (
      result.success &&
      result.data &&
      result.data.data &&
      Array.isArray(result.data.data)
    ) {
      return {
        success: true,
        data: result.data.data,
        pagination: {
          page: result.data.page || page,
          pageSize: result.data.pageSize || pageSize,
          total: result.data.total || 0,
          totalPages: Math.ceil(
            (result.data.total || 0) / (result.data.pageSize || pageSize)
          ),
        },
      };
    } else {
      console.error("Invalid products data structure:", result);
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          pageSize: pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      data: [],
      pagination: {
        page: 1,
        pageSize: params.pageSize || 8,
        total: 0,
        totalPages: 0,
      },
    };
  }
};

// Lấy sản phẩm theo nhà cung cấp
export const getProductsBySupplier = async (supplierId) => {
  try {
    const response = await api.get(`/products/supplier/${supplierId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy chi tiết sản phẩm
export const getProductDetails = async () => {
  try {
    const response = await api.get("/product-details");
    console.log("getProductDetails response:", response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy chi tiết sản phẩm theo ID (cho AdminProductDetail)
export const getProductDetailById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Thêm chi tiết sản phẩm (variant)
export const addProductDetail = async (data) => {
  try {
    const response = await api.post("/products/add-detail", data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật tồn kho sản phẩm
export const updateProductStock = async (stockUpdates) => {
  try {
    const response = await api.post("/products/update-stock", stockUpdates);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy màu và kích thước theo sản phẩm
export const getProductColorsSizes = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}/colors-sizes`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// PURCHASE ORDER API
// ===================

// Lấy danh sách đơn đặt hàng
export const getPurchaseOrders = async () => {
  try {
    const response = await api.get("/purchase-orders");
    console.log("getPurchaseOrders response:", response.data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo đơn đặt hàng mới
export const createPurchaseOrder = async (data) => {
  try {
    console.log("=== API createPurchaseOrder ===");
    console.log("Input data:", data);

    const orderData = {
      MaPDH: data.MaPDH,
      NgayDat: formatDateForApi(data.NgayDat),
      MaNV: data.MaNV,
      MaNCC: data.MaNCC,
      MaTrangThai: data.MaTrangThai,
      NgayKienNghiGiao: formatDateForApi(data.NgayKienNghiGiao),
      details: data.details.map((item) => {
        console.log("Processing item:", item);
        const mappedItem = {
          MaSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.SoLuong,
          DonGia: item.DonGia,
          ThanhTien: item.ThanhTien,
        };
        console.log("Mapped item:", mappedItem);
        return mappedItem;
      }),
    };

    console.log("Final orderData:", orderData);
    console.log("Sending to backend:", JSON.stringify(orderData, null, 2));

    const response = await api.post("/purchase-orders", orderData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy đơn đặt hàng theo ID
export const getPurchaseOrderById = async (id) => {
  try {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật phiếu đặt hàng
export const updatePurchaseOrder = async (id, data) => {
  try {
    console.log("=== API updatePurchaseOrder ===");
    console.log("ID:", id);
    console.log("Input data:", data);

    const orderData = {
      MaPDH: id,
      NgayDat: formatDateForApi(
        data.NgayDat || new Date().toISOString().split("T")[0]
      ),
      MaNV: data.MaNV || 1,
      MaNCC: data.MaNCC,
      MaTrangThai: data.MaTrangThai || 1,
      GhiChu: data.GhiChu || "",
      NgayKienNghiGiao: formatDateForApi(data.NgayKienNghiGiao),
      details: data.details.map((item) => {
        console.log("Processing item:", item);
        const mappedItem = {
          MaSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.SoLuong,
          DonGia: item.DonGia,
          ThanhTien: item.ThanhTien,
        };
        console.log("Mapped item:", mappedItem);
        return mappedItem;
      }),
    };

    console.log("Final orderData:", orderData);
    console.log("Sending to backend:", JSON.stringify(orderData, null, 2));
    console.log("API endpoint:", `/purchase-orders/${id}`);

    let response;
    try {
      // Try the main endpoint first
      response = await api.put(`/purchase-orders/${id}`, orderData);
      console.log("API response:", response);
    } catch (error) {
      console.log("Main endpoint failed, trying alternative...");
      // Try alternative endpoint if main one fails
      try {
        response = await api.put(`/purchase-orders/update/${id}`, orderData);
        console.log("Alternative endpoint response:", response);
      } catch (altError) {
        console.log("Alternative endpoint also failed");
        // Try another possible endpoint
        try {
          response = await api.put(`/phieu-dat-hang/${id}`, orderData);
          console.log("Vietnamese endpoint response:", response);
        } catch (vietError) {
          console.log("Vietnamese endpoint also failed");
          // Try POST method instead of PUT
          try {
            response = await api.post(
              `/purchase-orders/${id}/update`,
              orderData
            );
            console.log("POST update endpoint response:", response);
          } catch (postError) {
            console.log("POST update endpoint also failed");
            throw error; // Throw the original error
          }
        }
      }
    }

    return response.data;
  } catch (error) {
    handleError(error);
    throw error; // Re-throw the error so the calling function can handle it
  }
};

// Cập nhật trạng thái đơn đặt hàng
export const updatePurchaseOrderStatus = async (id, statusId) => {
  try {
    const response = await api.put(`/purchase-orders/${id}/status`, {
      MaTrangThai: statusId,
    });
    return response.data;
  } catch (error) {
    handleError(error);
    throw error; // Re-throw the error so the calling function can handle it
  }
};

// Lấy đơn đặt hàng có thể tạo phiếu nhập
export const getAvailablePurchaseOrders = async () => {
  try {
    const response = await api.get("/purchase-orders/available-for-receipt");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy chi tiết đơn đặt hàng để tạo phiếu nhập
export const getPurchaseOrderForReceipt = async (id) => {
  try {
    const response = await api.get(`/purchase-orders/${id}/for-receipt`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy trạng thái nhập hàng của từng sản phẩm trong phiếu đặt hàng NCC
export const getPurchaseOrderReceivedStatus = async (purchaseOrderId) => {
  try {
    const response = await api.get(
      `/purchase-orders/${purchaseOrderId}/received-status`
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// GOODS RECEIPT API
// ===================

// Lấy danh sách phiếu nhập hàng
export const getGoodsReceipts = async () => {
  try {
    const response = await api.get("/goods-receipts");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo phiếu nhập hàng mới
export const createGoodsReceipt = async (data) => {
  try {
    const receiptData = {
      SoPN: data.SoPN,
      NgayNhap: formatDateForApi(data.NgayNhap),
      MaPDH: data.MaPDH,
      MaNV: data.MaNV,
      details: data.details.map((item) => ({
        MaCTSP: item.MaCTSP,
        SoLuong: item.SoLuong,
        DonGia: item.DonGia,
        TinhTrang: item.TinhTrang || "good",
        GhiChu: item.GhiChu || "",
      })),
    };

    const response = await api.post("/goods-receipts", receiptData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy phiếu nhập hàng theo ID
export const getGoodsReceiptById = async (id) => {
  try {
    const response = await api.get(`/goods-receipts/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Cập nhật tồn kho sau khi nhập hàng
export const updateInventoryAfterReceipt = async (receiptId) => {
  try {
    const response = await api.put(
      `/goods-receipts/${receiptId}/update-inventory`
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// BASIC DATA API
// ===================

// Lấy danh sách màu sắc
export const getColors = async () => {
  try {
    const response = await api.get("/colors");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Tạo màu mới
export const createColor = async (colorData) => {
  try {
    const response = await api.post("/colors", colorData);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Cập nhật màu
export const updateColor = async (colorId, colorData) => {
  try {
    const response = await api.put(`/colors/${colorId}`, colorData);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// ===================
// ADDRESS API
// ===================

export const getProvinces = async () => {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/v2/p/");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};

export const getWards = async () => {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/v2/w/");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching wards:", error);
    return [];
  }
};

export const getDistricts = async () => {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/v2/d/");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
};

// Xóa màu
export const deleteColor = async (colorId) => {
  try {
    const response = await api.delete(`/colors/${colorId}`);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Lấy danh sách size
export const getSizes = async () => {
  try {
    const response = await api.get("/sizes");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Lấy danh sách trạng thái đơn đặt hàng
export const getPurchaseOrderStatuses = async () => {
  try {
    const response = await api.get("/purchase-order-statuses");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// ORDERS API
// ===================

// ===================
// ORDER MANAGEMENT API
// ===================

// Lấy danh sách đơn hàng theo trạng thái
export const getOrdersByStatus = async (status) => {
  try {
    const response = await api.get(`/orders/by-status?status=${status}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thống kê đơn hàng
export const getOrderStatistics = async () => {
  try {
    const response = await api.get("/orders/statistics");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy chi tiết đơn hàng theo ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái đơn hàng đơn lẻ
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, statusData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái đơn hàng hàng loạt
export const updateBatchOrderStatus = async (ordersData) => {
  try {
    const response = await api.put("/orders/batch/status", ordersData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách nhân viên giao hàng có sẵn
export const getAvailableDeliveryStaff = async (deliveryTime, address) => {
  try {
    const response = await api.post("/employees/delivery/available", {
      thoigiangiao: deliveryTime,
      diaChi: address,
    });

    // Handle the new API response structure
    if (
      response.data &&
      response.data.success &&
      Array.isArray(response.data.data)
    ) {
      return {
        success: true,
        message: response.data.message,
        data: response.data.data.map((staff) => ({
          MaNV: staff.MaNV,
          TenNV: staff.TenNV,
          DiaChi: staff.DiaChi,
          SoDonDangGiao: staff.SoDonDangGiao || 0,
          KhuVucPhuTrach: staff.KhuVucPhuTrach || null,
        })),
      };
    }

    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật nhân viên giao hàng cho đơn hàng
export const updateOrderDeliveryStaff = async (orderId, staffData) => {
  try {
    const response = await api.put(
      `/orders/${orderId}/delivery-staff`,
      staffData
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Hoàn tất đơn hàng hàng loạt
export const updateBatchOrderCompletion = async (orders) => {
  try {
    const response = await api.put("/orders/batch/status", { orders });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Hoàn tất đơn hàng đơn lẻ
export const updateOrderCompletion = async (orderId, data) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, data);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// DELIVERY STAFF API
// ===================

// Lấy đơn hàng được phân công cho nhân viên giao hàng
export const getAssignedOrders = async (params = {}) => {
  try {
    const { page = 1, limit = 10, status } = params;
    let url = `/orders/delivery/assigned?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${status}`;
    }

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xác nhận hoàn thành giao hàng
export const confirmOrderDelivery = async (orderId) => {
  try {
    const response = await api.put(`/orders/delivery/${orderId}/confirm`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy chi tiết đơn hàng cho admin
export const getOrderDetailById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/detail`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// INVOICE API
// ===================

// Lấy chi tiết hóa đơn theo số hóa đơn
export const getInvoiceDetail = async (invoiceNumber) => {
  try {
    const response = await api.get(`/invoices/detail/${invoiceNumber}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy hóa đơn theo mã đơn hàng
export const getInvoiceByOrderId = async (orderId) => {
  try {
    const response = await api.get(`/invoices/order/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo hóa đơn mới
export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post("/invoices", invoiceData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// RETURN REQUEST API
// ===================

// Tạo yêu cầu trả hàng
export const createReturnRequest = async (returnData) => {
  try {
    const response = await api.post("/return/request", returnData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// AUTH API
// ===================

// Đăng nhập
export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Đăng nhập bằng Google
export const googleLogin = async (idToken) => {
  try {
    const response = await api.post("/auth/google-login", { idToken });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Đăng ký
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ===================
// UTILITY FUNCTIONS
// ===================

// Show loading toast
export const showLoading = (message = "Đang tải...") => {
  // Implement your loading toast here
  console.log(message);
};

// Show success toast
export const showSuccess = (message = "Thành công!") => {
  // Implement your success toast here
  console.log(message);
};

// Show error toast
export const showError = (message = "Có lỗi xảy ra!") => {
  // Implement your error toast here
  console.error(message);
};

// Format giá tiền
export const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

// Format ngày tháng để hiển thị
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export { formatDateForApi };

//Product-api
export const getAllProducts = async () => {
  try {
    const response = await api.get("/san-pham");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi gọi API sản phẩm:", error);
    throw error;
  }
};
export const getProductDetail = async (id) => {
  try {
    const response = await api.get(`/san-pham/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    throw error;
  }
};

export const addToCartApi = async (data) => {
  try {
    const response = await api.post("/gio-hang/them", data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};
export const getCartItemsApi = async (maKH) => {
  const response = await api.get(`/gio-hang/${maKH}`);
  return response.data.data; // dữ liệu giỏ hàng
};

export const removeFromCartApi = async (
  maKH,
  maSP,
  maHex,
  tenKichThuoc,
  donGia
) => {
  try {
    const response = await api.delete("/gio-hang/xoa", {
      data: { maKH, maSP, maHex, tenKichThuoc, donGia },
    });
    return response.data.data; // trả lại cart cập nhật nếu cần
  } catch (error) {
    console.error("Lỗi xoá sản phẩm khỏi giỏ hàng:", error);
    throw error;
  }
};

export const createOrder = async (payload) => {
  const response = await api.post("/gio-hang/dat-hang", payload);
  return response.data;
};

// services/api.js

export async function checkStockAvailability(maCTSP) {
  const response = await api.post("/san-pham/kiem-tra-ton-kho", { maCTSP });
  return response.data.data;
}
export const clearCartApi = async (maKH) => {
  const response = await api.post("/gio-hang/xoa-tat-ca", { maKH });
  return response.data.data;
};
// Lấy tất cả danh mục sản phẩm
// Giả sử API trả về danh mục theo đường dẫn "/loai-sp" hoặc "/category"
export const getAllCategories = async () => {
  try {
    const response = await api.get("/category/");
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw error;
  }
};
export const getProductsByCategory = async (id) => {
  const res = await api.post(`/category/products`, { maLoaiSP: id });
  return res.data.data;
};

// ...existing code...

export const getCurrentExchangeRate = async () => {
  try {
    const res = await api.get("/tigia/co-hieu-luc");
    return res.data.data?.GiaTri; // trả về số, ví dụ: 24000
  } catch (error) {
    console.error("Lỗi lấy tỉ giá:", error);
    throw error;
  }
};

export const getBestSellerProducts = async () => {
  try {
    const res = await api.get("/san-pham/best-sellers");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
    throw error;
  }
};

export const getNewProducts = async () => {
  try {
    const res = await api.get("/san-pham/new-product");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm mới:", error);
    throw error;
  }
};

export const getDiscountProducts = async () => {
  try {
    const res = await api.get("/san-pham/discount");
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm giảm giá:", error);
    throw error;
  }
};

export const getSearchProducts = async (q) => {
  try {
    const res = await api.get(
      `/san-pham/search?keyword=${encodeURIComponent(q)}`
    );
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi tìm kiếm sản phẩm:", error);
    throw error;
  }
};

export const getCustomerOrders = async (maKH) => {
  try {
    const res = await api.post("/gio-hang/don-hang", { maKH });
    return res.data?.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng khách hàng:", error);
    throw error;
  }
};

export const getOrderDetail = async ({ maKH, maDDH }) => {
  try {
    const res = await api.post("/gio-hang/don-hang/chi-tiet", { maKH, maDDH });
    return res.data?.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    throw error;
  }
};

export const getRevenueReport = async (startDate, endDate) => {
  try {
    const response = await api.post(`/orders/revenue-report`, {
      ngayBatDau: startDate,
      ngayKetThuc: endDate,
    });
    console.log("Revenue Report Response:", response.data.data);

    return response.data?.data;
  } catch (error) {
    return handleError(error);
  }
};

export const cancelOrder = async (maKH, maDDH) => {
  try {
    const response = await api.post("/orders/cancel", { maKH, maDDH });
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await api.get(`/category/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin danh mục:", error);
    throw error;
  }
};

// ===================
// REVIEW/COMMENT API
// ===================

// Submit product review
export const submitReview = async (reviewData) => {
  try {
    const response = await api.post("/binh-luan", {
      maCTDonDatHang: reviewData.MaCTDonDatHang,
      moTa: reviewData.MoTa,
      soSao: reviewData.SoSao,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Submit multiple product reviews
export const submitMultipleReviews = async (reviewList) => {
  try {
    const response = await api.post("/binh-luan", {
      binhLuanList: reviewList.map((review) => ({
        maCTDonDatHang: review.maCTDonDatHang,
        moTa: review.moTa,
        soSao: review.soSao,
      })),
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get product comments/reviews
export const getProductComments = async (productId) => {
  try {
    const response = await api.get(`/comments/product/${productId}`);
    return response.data?.data || { comments: [], summary: null };
  } catch (error) {
    console.error("Error fetching product comments:", error);
    return { comments: [], summary: null };
  }
};

// ===================
// RETURN REQUESTS API
// ===================

// Tạo phiếu trả hàng
export const createReturnSlip = async (returnData) => {
  try {
    const response = await api.post("/return/slip", returnData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách yêu cầu trả hàng
export const getReturnRequests = async () => {
  try {
    const response = await api.get("/return/requests");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getCustomerProfile = async () => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật thông tin profile khách hàng
export const updateCustomerProfile = async (maKH, profileData) => {
  try {
    const response = await api.put(`/customers/profile/${maKH}`, profileData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Upload ảnh đại diện
export const uploadAvatar = async (avatarData) => {
  try {
    const response = await api.put("/customers/upload-avatar", {
      maKH: avatarData.maKH,
      AnhDaiDien: avatarData.AnhDaiDien,
    });
    return response.data;
  } catch (error) {
    console.error("Upload avatar error:", error);
    throw error;
  }
};

// ===================
// ACCOUNT SETTINGS API
// ===================

// Lấy thông tin tài khoản
export const getAccountInfo = async () => {
  try {
    const response = await api.get("/auth/account");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Đổi mật khẩu
export const changePassword = async (passwordData) => {
  try {
    const response = await api.post("/auth/change-password", {
      matKhauCu: passwordData.matKhauCu,
      matKhauMoi: passwordData.matKhauMoi,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách phiếu trả hàng theo trạng thái
export const getReturnRequestsByStatus = async (status) => {
  try {
    const response = await api.get(`/return/requests?status=${status}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách phiếu trả hàng (slips) theo trạng thái
export const getReturnSlipsByStatus = async (status) => {
  try {
    const response = await api.get(`/return/slips?trangThai=${status}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái phiếu trả hàng
export const updateReturnSlipStatus = async (returnSlipId, statusData) => {
  try {
    const response = await api.put(
      `/return/slip/${returnSlipId}/approve`,
      statusData
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo phiếu chi cho phiếu trả hàng
export const createReturnPayment = async (paymentData) => {
  try {
    const response = await api.post("/return/payment", paymentData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// PROMOTION/DISCOUNT API
// ===================

// Lấy danh sách đợt giảm giá
export const getPromotions = async () => {
  try {
    const response = await api.get("/promotions");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo đợt giảm giá mới
export const createPromotion = async (promotionData) => {
  try {
    const response = await api.post("/promotions", promotionData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật đợt giảm giá
export const updatePromotion = async (promotionId, promotionData) => {
  try {
    const response = await api.put(`/promotions/${promotionId}`, promotionData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xóa đợt giảm giá
export const deletePromotion = async (promotionId) => {
  try {
    const response = await api.delete(`/promotions/${promotionId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thông tin chi tiết đợt giảm giá
export const getPromotionById = async (promotionId) => {
  try {
    const response = await api.get(`/api/promotions/${promotionId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách sản phẩm cho đợt giảm giá
export const getProductsForPromotion = async () => {
  try {
    const response = await api.get("/products");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách sản phẩm available cho đợt giảm giá
export const getAvailableProducts = async (maDot) => {
  try {
    const response = await api.get(`/promotions/${maDot}/available-products`);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    return handleError(error);
  }
};

export const getAvailableProductsForPromotion = async () => {
  try {
    const response = await api.get(`/products`);
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    return handleError(error);
  }
};

// Xóa sản phẩm khỏi đợt giảm giá
export const removeProductFromPromotion = async (maDot, maSP) => {
  try {
    const response = await api.delete(`promotions/${maDot}/products/${maSP}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Thêm sản phẩm vào đợt giảm giá
export const addProductToPromotion = async (maDot, productData) => {
  try {
    const response = await api.post(
      `/promotions/${maDot}/products`,
      productData
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Validate promotion period for conflicts
export const validatePromotionPeriod = async (ngayBatDau, ngayKetThuc) => {
  try {
    const response = await api.post("/promotions/validate-period", {
      ngayBatDau,
      ngayKetThuc,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get areas
export const getAreas = async () => {
  try {
    const response = await api.get("/areas");
    const result = response.data;

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    } else {
      console.warn("Unexpected areas API response structure:", result);
      return [];
    }
  } catch (error) {
    console.error("🔥 getAreas error:", error);
    return []; // Return empty array on error
  }
};

// ===================
// CATEGORY API
// ===================

// Lấy danh sách danh mục sản phẩm
export const getCategories = async () => {
  try {
    const response = await api.get("/category");
    const result = response.data;

    if (result && result.success && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      console.error("Categories data is not in expected format:", result);
      return [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Tạo danh mục mới
export const createCategory = async (data) => {
  try {
    const response = await api.post("/category", {
      TenLoai: data.TenLoai,
      HinhMinhHoa: data.HinhMinhHoa,
      NgayTao: new Date(),
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật thông tin danh mục
export const updateCategory = async (categoryId, data) => {
  try {
    const response = await api.put(`/category/${categoryId}`, {
      TenLoai: data.TenLoai,
      HinhMinhHoa: data.HinhMinhHoa,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xóa danh mục
export const deleteCategory = async (categoryId) => {
  try {
    const response = await api.delete(`/category/${categoryId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy thông tin chi tiết danh mục
// export const getCategoryById = async (categoryId) => {
//   try {
//     const response = await api.get(`/category/${categoryId}`);
//     return response.data;
//   } catch (error) {
//     return handleError(error);
//   }
// };

// ===================
// PRODUCT MANAGEMENT API
// ===================

// Cập nhật sản phẩm
export const updateProduct = async (productId, updateData) => {
  try {
    const response = await api.put(`/products/${productId}/update`, updateData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật trạng thái sản phẩm (ẩn/hiện)
export const updateProductStatus = async (productId, status) => {
  try {
    const response = await api.put(`/products/${productId}`, {
      TrangThai: status,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy chi tiết sản phẩm cho quản lý
export const getProductByIdForManagement = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Tạo sản phẩm mới
export const createProduct = async (productData) => {
  try {
    const response = await api.post("/products", productData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xóa sản phẩm
export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách đơn hàng tháng hiện tại
export const getCurrentMonthOrders = async () => {
  try {
    const response = await api.get("/orders/current-month");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const getAllEmployees = async () => {
  try {
    const response = await apiWrapper.get("/employees");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách phiếu đặt hàng từ nhà cung cấp
export const getPurchaseOrdersNCC = async () => {
  try {
    const response = await apiWrapper.get("/phieu-dat-hang-ncc");
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// DELIVERY AREA MANAGEMENT API
// ===================

// Lấy danh sách khu vực phụ trách của nhân viên
export const getEmployeeAreas = async (employeeId) => {
  try {
    const response = await apiWrapper.get(`/nhan-vien/${employeeId}/khu-vuc`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Lấy danh sách khu vực chưa phụ trách của nhân viên
export const getAvailableAreasForEmployee = async (employeeId) => {
  try {
    const response = await apiWrapper.get(
      `/nhan-vien/${employeeId}/khu-vuc-chua-phu-trach`
    );
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Xóa khu vực phụ trách của nhân viên
export const removeEmployeeAreas = async (areaIds) => {
  try {
    const response = await apiWrapper.delete("/nhan-vien/khu-vuc", {
      data: {
        danhSachMaNVKV: areaIds,
      },
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Thêm khu vực phụ trách cho nhân viên
export const addEmployeeAreas = async (employeeId, areaData) => {
  try {
    const response = await apiWrapper.post(`/nhan-vien/${employeeId}/khu-vuc`, {
      danhSachKhuVuc: areaData,
    });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// ===================
// INVENTORY REPORT API
// ===================

export const getInventoryReport = async (reportDate) => {
  return handleApiCall(async () => {
    const response = await api.get(`/bao-cao-ton-kho/${reportDate}/raw`);
    return response.data;
  });
};

export const getInventoryReportPDF = async (reportDate, nguoiLap) => {
  return handleApiCall(async () => {
    const response = await api.get(
      `/bao-cao-ton-kho/${reportDate}/pdf?nguoilap=${encodeURIComponent(
        nguoiLap
      )}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  });
};

// Profit Report APIs
export const getProfitReport = async (ngayBatDau, ngayKetThuc) => {
  return handleApiCall(async () => {
    const response = await api.post("/bao-cao-loi-nhuan", {
      ngayBatDau,
      ngayKetThuc,
    });
    return response.data;
  });
};

export const getProfitReportPDF = async (ngayBatDau, ngayKetThuc, nguoiLap) => {
  return handleApiCall(async () => {
    const response = await api.post(
      "/bao-cao-loi-nhuan/pdf",
      {
        ngayBatDau,
        ngayKetThuc,
        nguoiLap,
      },
      {
        responseType: "blob",
      }
    );
    return response.data;
  });
};

export const getProductRecommendations = async (
  items,
  k = 8,
  excludeIncart = true,
  requireInstock = false
) => {
  try {
    const response = await api.post("/san-pham/recommendations", {
      items,
      k,
      exclude_incart: excludeIncart,
      require_instock: requireInstock,
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy gợi ý sản phẩm:", error);
    return {
      success: false,
      data: {
        recommendations: {
          groups: [],
        },
      },
    };
  }
};

// ===================
// FP-GROWTH CONFIG API
// ===================

// Lấy cấu hình FP-Growth
export const getFPGrowthConfig = async () => {
  try {
    const response = await apiWrapper.get("/fpgrowth/config");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error);
  }
};

// Cập nhật cấu hình FP-Growth
export const updateFPGrowthConfig = async (configData) => {
  try {
    const response = await apiWrapper.post("/fpgrowth/config", configData);
    console.log("Raw update response:", response);
    // Backend có thể trả về response.data hoặc response.data.data
    const data = response.data?.data || response.data;
    return {
      success: true,
      data: data,
      message: response.data?.message || "Cập nhật cấu hình thành công",
    };
  } catch (error) {
    console.error("Update FP-Growth config error:", error);
    return handleError(error);
  }
};

// Lấy danh sách rules FP-Growth
export const getFPGrowthRules = async (params = {}) => {
  try {
    const response = await api.get("/fpgrowth/rules", { params });
    return response.data;
  } catch (error) {
    console.error("Get FP-Growth rules error:", error);
    return handleError(error);
  }
};

// Làm mới cache FP-Growth
export const refreshFPGrowthCache = async () => {
  try {
    const response = await api.get("/fpgrowth/refresh-cache");
    return response.data;
  } catch (error) {
    console.error("Refresh FP-Growth cache error:", error);
    return handleError(error);
  }
};
