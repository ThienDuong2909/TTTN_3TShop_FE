import { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  PurchaseOrder,
  Supplier,
  Product,
  POForm,
  PurchaseOrderStats,
  PurchaseOrderLoading,
} from "../types";
import {
  getPurchaseOrders,
  createPurchaseOrder as createPurchaseOrderAPI,
  updatePurchaseOrderStatus,
  getSuppliers,
} from "../../../services/api";
import { updatePurchaseOrder as updatePurchaseOrderAPI } from "../../../services/commonService";

// Wrapper function for getProducts
const getProductsWrapper = async () => {
  const api = await import("../../../services/api");
  return (api as any).getProducts();
};

// Transform API data to match our interface
const transformPurchaseOrderFromAPI = (apiPO: any): PurchaseOrder => {
  console.log("Transforming purchase order:", apiPO);
  
  const items = (apiPO.CT_PhieuDatHangNCCs || []).map((item: any) => ({
    MaSP: item.ChiTietSanPham?.MaSP || item.MaCTSP,
    productName: item.ChiTietSanPham?.SanPham?.TenSP || item.MaCTSP,
    MaMau: item.ChiTietSanPham?.MaMau || "",
    MaKichThuoc: item.ChiTietSanPham?.MaKichThuoc || "",
    colorName: item.ChiTietSanPham?.Mau?.TenMau || "",
    sizeName: item.ChiTietSanPham?.KichThuoc?.TenKichThuoc || "",
    quantity: item.SoLuong || 0,
    unitPrice: parseFloat(item.DonGia) || 0,
    totalPrice: (item.SoLuong || 0) * (parseFloat(item.DonGia) || 0),
  }));
  
  // Calculate total amount from items
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  
  const transformed = {
    id: apiPO.MaPDH,
    supplierId: apiPO.MaNCC,
    supplierName: apiPO.NhaCungCap?.TenNCC || apiPO.MaNCC,
    items,
    status: getStatusFromTrangThai(apiPO.TrangThaiDatHangNCC?.MaTrangThai || apiPO.MaTrangThai),
    totalAmount,
    orderDate: apiPO.NgayDat || new Date().toISOString(),
    expectedDeliveryDate: apiPO.NgayGiaoHang || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: apiPO.GhiChu || "",
    createdBy: apiPO.MaNV || "",
  };
  
  console.log("Transformed purchase order:", transformed);
  return transformed;
};

const transformSupplierFromAPI = (apiSupplier: any): Supplier => ({
  id: apiSupplier.MaNCC,
  name: apiSupplier.TenNCC || apiSupplier.MaNCC,
  contactPerson: apiSupplier.NguoiLienHe || "",
  phone: apiSupplier.DienThoai || "",
  email: apiSupplier.Email || "",
  address: apiSupplier.DiaChi || "",
});

const transformProductFromAPI = (apiProduct: any): Product => ({
  id: apiProduct.MaSP,
  name: apiProduct.TenSP || apiProduct.MaCTSP,
  price: apiProduct.DonGia || 0,
  description: apiProduct.MoTa || "",
  category: apiProduct.LoaiSP || "clothing",
  // Giữ lại MaNCC để filter theo nhà cung cấp
  MaNCC: apiProduct.MaNCC,
});

// Helper function to map status
const getStatusFromTrangThai = (maTrangThai: number): PurchaseOrder["status"] => {
  switch (maTrangThai) {
    case 1: return "draft";
    case 2: return "sent";
    case 3: return "confirmed";
    case 4: return "partially_received";
    case 5: return "completed";
    case 5: return "cancelled";
    default: return "draft";
  }
};

export const usePurchaseOrderData = (currentUserId: string) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  const [loading, setLoading] = useState<PurchaseOrderLoading>({
    purchaseOrders: false,
    suppliers: false,
    products: false,
    creating: false,
    updating: false,
    refreshing: false,
  });

  const [stats, setStats] = useState<PurchaseOrderStats>({
    totalOrders: 0,
    draftOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalValue: 0,
    monthlyOrders: 0,
  });

  // Load purchase orders
  const loadPurchaseOrders = async () => {
    setLoading(prev => ({ ...prev, purchaseOrders: true }));
    
    try {
      const response = await getPurchaseOrders();
      console.log("response", response);
      
      // Handle API response structure: {success, message, data}
      let orders: any[] = [];
      if (Array.isArray(response)) {
        orders = response;
      } else if (response && Array.isArray((response as any).data)) {
        orders = (response as any).data;
      } else if (response && typeof response === 'object') {
        // Try to find array in common properties
        const responseObj = response as any;
        orders = responseObj.orders || responseObj.items || responseObj.result || [];
      }
      
      const transformedOrders = orders.map(transformPurchaseOrderFromAPI);
      setPurchaseOrders(transformedOrders);
      
      // Calculate stats
      const currentMonth = new Date().getMonth();
      const totalOrders = transformedOrders.length;
      const draftOrders = transformedOrders.filter(po => po.status === "draft").length;
      const pendingOrders = transformedOrders.filter(po => po.status === "sent" || po.status === "confirmed").length;
      const completedOrders = transformedOrders.filter(po => po.status === "completed").length;
      const totalValue = transformedOrders.reduce((sum, po) => sum + po.totalAmount, 0);
      const monthlyOrders = transformedOrders.filter(
        po => new Date(po.orderDate).getMonth() === currentMonth
      ).length;
      
      setStats({
        totalOrders,
        draftOrders,
        pendingOrders,
        completedOrders,
        totalValue,
        monthlyOrders,
      });
    } catch (error: any) {
      console.error("Error loading purchase orders:", error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách phiếu đặt hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, purchaseOrders: false }));
    }
  };

  // Load suppliers
  const loadSuppliers = async () => {
    console.log("loadSuppliers called");
    setLoading(prev => ({ ...prev, suppliers: true }));
    
    try {
      console.log("Calling getSuppliers API...");
      const response = await getSuppliers();
      
      // Try to handle different response formats
      let supplierData: any[] = [];
      if (Array.isArray(response)) {
        supplierData = response;
      } else if (response && Array.isArray((response as any).data)) {
        supplierData = (response as any).data;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to find array in common properties
        const responseObj = response as any;
        supplierData = responseObj.suppliers || responseObj.items || responseObj.result || [];
      }
      
      if (supplierData.length > 0) {
        const transformedSuppliers = supplierData.map(transformSupplierFromAPI);
        console.log("Transformed suppliers:", transformedSuppliers);
        setSuppliers(transformedSuppliers);
      } else {
        console.log("No suppliers found or empty array");
        setSuppliers([]);
      }
    } catch (error: any) {
      console.error("Error loading suppliers:", error);
      setSuppliers([]);
      toast({
        title: "Lỗi tải nhà cung cấp",
        description: "Không thể tải danh sách nhà cung cấp",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  };

  // Load products
  const loadProducts = async () => {
    console.log("loadProducts called");
    setLoading(prev => ({ ...prev, products: true }));
    
    try {
      console.log("Calling getProducts API...");
      const response = await getProductsWrapper();

      console.log("response", response);
      
      // Try to handle different response formats
      let productData: any[] = [];
      if (Array.isArray(response)) {
        productData = response;
      } else if (response && Array.isArray((response as any).data)) {
        productData = (response as any).data;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to find array in common properties
        const responseObj = response as any;
        productData = responseObj.products || responseObj.items || responseObj.result || [];
      }
      
      console.log("Raw product data:", productData);
      
      if (productData.length > 0) {
        // Log chi tiết sản phẩm đầu tiên để kiểm tra cấu trúc
        console.log("=== PRODUCT STRUCTURE CHECK ===");
        console.log("First product raw data:", productData[0]);
        console.log("First product keys:", Object.keys(productData[0]));
        
        // Kiểm tra các trường có thể chứa thông tin nhà cung cấp
        const firstProduct = productData[0];
        console.log("Possible supplier fields:");
        console.log("- MaNCC:", firstProduct.MaNCC);
        console.log("- supplierId:", firstProduct.supplierId);
        console.log("- MaNhaCungCap:", firstProduct.MaNhaCungCap);
        console.log("- NhaCungCap:", firstProduct.NhaCungCap);
        console.log("- NCC:", firstProduct.NCC);
        console.log("- supplier_id:", firstProduct.supplier_id);
        
        const transformedProducts = productData.map(transformProductFromAPI);
        console.log("Transformed products:", transformedProducts);
        setProducts(transformedProducts);
      } else {
        console.log("No products found or empty array");
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Error loading products:", error);
      setProducts([]);
      toast({
        title: "Lỗi tải sản phẩm",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Create purchase order
  const createPurchaseOrder = async (poForm: POForm) => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm",
        variant: "destructive",
      });
      return false;
    }

    setLoading(prev => ({ ...prev, creating: true }));
    
    try {
      console.log("Creating purchase order with form data:", poForm);
      console.log("Current user ID:", currentUserId);
      console.log("Available suppliers:", suppliers);
      console.log("Looking for supplier with ID:", poForm.supplierId, "type:", typeof poForm.supplierId);
      
      const supplier = suppliers.find(s => {
        console.log("Comparing supplier.id:", s.id, "type:", typeof s.id, "with poForm.supplierId:", poForm.supplierId, "type:", typeof poForm.supplierId);
        return s.id.toString() === poForm.supplierId.toString();
      });
      
      console.log("Found supplier:", supplier);
      if (!supplier) {
        throw new Error("Không tìm thấy nhà cung cấp");
      }

      // Transform data for API
      const apiData = {
        MaPDH: `PO${Date.now()}`, // Generate unique ID
        NgayDat: new Date().toISOString().split('T')[0],
        // MaNV: currentUserId,
        MaNV: 1,
        MaNCC: poForm.supplierId,
        MaTrangThai: 1, // Draft status
        GhiChu: poForm.notes || "",
        details: poForm.items.map(item => {
          console.log("Mapping item:", item);
          console.log("Item MaSP:", item.MaSP, "type:", typeof item.MaSP);
          console.log("Item MaMau:", item.MaMau, "type:", typeof item.MaMau);
          console.log("Item MaKichThuoc:", item.MaKichThuoc, "type:", typeof item.MaKichThuoc);
          
          const mappedItem = {
            MaSP: item.MaSP,
            MaMau: item.MaMau,
            MaKichThuoc: item.MaKichThuoc,
            SoLuong: item.quantity,
            DonGia: item.unitPrice,
            ThanhTien: item.quantity * item.unitPrice,
          };
          
          console.log("Mapped item:", mappedItem);
          return mappedItem;
        }),
      };

      console.log("Final API data before sending:", apiData);
      console.log("API data details:", JSON.stringify(apiData, null, 2));
      
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      console.log("Token preview:", token ? `${token.substring(0, 20)}...` : "null");
      console.log("API URL:", (import.meta as any).env?.VITE_API_URL);

      console.log("=== CALLING createPurchaseOrderAPI ===");
      const result = await createPurchaseOrderAPI(apiData);
      console.log("=== API CALL SUCCESS ===");
      console.log("Result:", result);
      
      toast({
        title: "Thành công",
        description: "Phiếu đặt hàng đã được tạo thành công",
      });

      // Reload data
      await loadPurchaseOrders();
      
      return true;
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      let errorMessage = "Không thể tạo phiếu đặt hàng";
      
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền tạo phiếu đặt hàng.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Lỗi tạo phiếu đặt hàng",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
    return false;
  };

  // Update purchase order
  const updatePurchaseOrder = async (poId: string, poForm: POForm) => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm",
        variant: "destructive",
      });
      return false;
    }

    setLoading(prev => ({ ...prev, updating: true }));
    
    try {
      console.log("Updating purchase order with ID:", poId);
      console.log("Form data:", poForm);
      
      const supplier = suppliers.find(s => s.id.toString() === poForm.supplierId.toString());
      if (!supplier) {
        throw new Error("Không tìm thấy nhà cung cấp");
      }

      // Transform data for API
      const apiData = {
        NgayDat: new Date().toISOString().split('T')[0],
        MaNV: 1,
        MaNCC: poForm.supplierId,
        MaTrangThai: 1, // Keep as draft
        GhiChu: poForm.notes || "",
        details: poForm.items.map(item => ({
          MaSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.quantity,
          DonGia: item.unitPrice,
          ThanhTien: item.quantity * item.unitPrice,
        })),
      };

      console.log("Update API data:", apiData);
      
      const result = await updatePurchaseOrderAPI(poId, apiData);
      console.log("Update result:", result);
      
      toast({
        title: "Thành công",
        description: "Phiếu đặt hàng đã được cập nhật thành công",
      });

      // Reload data
      await loadPurchaseOrders();
      
      return true;
    } catch (error: any) {
      console.error("Error updating purchase order:", error);
      
      let errorMessage = "Không thể cập nhật phiếu đặt hàng";
      
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật phiếu đặt hàng.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Lỗi cập nhật phiếu đặt hàng",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
    return false;
  };

  // Send purchase order
  const sendPurchaseOrder = async (poId: string) => {
    setLoading(prev => ({ ...prev, updating: true }));
    
    try {
      await updatePurchaseOrderStatus(poId, 2); // Status 2 = sent
      
      toast({
        title: "Đã gửi phiếu đặt hàng",
        description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp",
      });
      
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error("Error sending purchase order:", error);
      toast({
        title: "Lỗi gửi phiếu đặt hàng",
        description: "Không thể gửi phiếu đặt hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  // Confirm purchase order
  const confirmPurchaseOrder = async (poId: string) => {
    setLoading(prev => ({ ...prev, updating: true }));
    
    try {
      await updatePurchaseOrderStatus(poId, 3); // Status 3 = confirmed
      
      toast({
        title: "Đã xác nhận phiếu đặt hàng",
        description: "Phiếu đặt hàng đã được xác nhận",
      });
      
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error("Error confirming purchase order:", error);
      toast({
        title: "Lỗi xác nhận phiếu đặt hàng",
        description: "Không thể xác nhận phiếu đặt hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  // Navigate to goods receipt
  const navigateToGoodsReceipt = (poId: string) => {
    navigate(`/admin/goods-receipt?po=${poId}`);
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(prev => ({ ...prev, refreshing: true }));
    
    try {
      await Promise.all([
        loadPurchaseOrders(),
        loadSuppliers(),
        loadProducts(),
      ]);
      
      toast({
        title: "Dữ liệu đã được cập nhật",
        description: "Tất cả dữ liệu đã được tải lại thành công",
      });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadProducts();
  }, []);

  return {
    // Data
    purchaseOrders,
    suppliers,
    products,
    selectedPO,
    stats,
    loading,
    
    // Actions
    loadPurchaseOrders,
    loadSuppliers,
    loadProducts,
    createPurchaseOrder,
    updatePurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    navigateToGoodsReceipt,
    refreshData,
    setSelectedPO,
  };
}; 