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
  getProductDetails,
} from "../../../services/api";

// Transform API data to match our interface
const transformPurchaseOrderFromAPI = (apiPO: any): PurchaseOrder => ({
  id: apiPO.MaPDH,
  supplierId: apiPO.MaNCC,
  supplierName: apiPO.TenNCC || apiPO.MaNCC,
  items: (apiPO.details || []).map((item: any) => ({
    MaSP: item.MaCTSP,
    productName: item.TenSP || item.MaCTSP,
    MaMau: item.MaMau || "",
    MaKichThuoc: item.MaKichThuoc || "",
    quantity: item.SoLuong || 0,
    unitPrice: item.DonGia || 0,
    totalPrice: item.ThanhTien || (item.SoLuong * item.DonGia) || 0,
  })),
  status: getStatusFromTrangThai(apiPO.MaTrangThai),
  totalAmount: apiPO.TongTien || 0,
  orderDate: apiPO.NgayDat || new Date().toISOString(),
  expectedDeliveryDate: apiPO.NgayGiaoHang || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  notes: apiPO.GhiChu || "",
  createdBy: apiPO.MaNV || "",
});

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
});

// Helper function to map status
const getStatusFromTrangThai = (maTrangThai: number): PurchaseOrder["status"] => {
  switch (maTrangThai) {
    case 1: return "draft";
    case 2: return "sent";
    case 3: return "confirmed";
    case 4: return "completed";
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
      const orders = Array.isArray(response) ? response : [];
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
      console.log("Calling getProductDetails API...");
      const response = await getProductDetails();
      
      // Try to handle different response formats
      let productData: any[] = [];
      if (Array.isArray(response)) {
        productData = response;
      } else if (response && Array.isArray((response as any).data)) {
        productData = (response as any).data;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to find array in common properties
        const responseObj = response as any;
        productData = responseObj.products || responseObj.items || responseObj.result || responseObj.productDetails || [];
      }
      
      
      if (productData.length > 0) {
        const transformedProducts = productData.map(transformProductFromAPI);
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
      
      const supplier = suppliers.find(s => s.id === poForm.supplierId);
      if (!supplier) {
        throw new Error("Không tìm thấy nhà cung cấp");
      }

      // Transform data for API
      const apiData = {
        MaPDH: `PO${Date.now()}`, // Generate unique ID
        NgayDat: new Date().toISOString().split('T')[0],
        MaNV: currentUserId,
        MaNCC: poForm.supplierId,
        MaTrangThai: 1, // Draft status
        GhiChu: poForm.notes || "",
        details: poForm.items.map(item => ({
          MaCTSP: item.MaSP,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          SoLuong: item.quantity,
          DonGia: item.unitPrice,
          ThanhTien: item.quantity * item.unitPrice,
        })),
      };

      console.log("Sending API data:", apiData);
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
    sendPurchaseOrder,
    confirmPurchaseOrder,
    navigateToGoodsReceipt,
    refreshData,
    setSelectedPO,
  };
}; 