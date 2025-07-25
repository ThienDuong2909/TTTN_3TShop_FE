import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  getProductsBySupplier,
} from "../../../services/api";
import { updatePurchaseOrder as updatePurchaseOrderAPI } from "../../../services/commonService";

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

  // Loading states for individual actions
  const [actionLoading, setActionLoading] = useState<{
    sending: string[];
    confirming: string[];
    editing: string[];
  }>({
    sending: [],
    confirming: [],
    editing: [],
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
    console.log("=== LOAD PURCHASE ORDERS CALLED ===");
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
      toast.error("Lỗi tải dữ liệu", {
        description: "Không thể tải danh sách phiếu đặt hàng"
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
      toast.error("Lỗi tải nhà cung cấp", {
        description: "Không thể tải danh sách nhà cung cấp"
      });
    } finally {
      setLoading(prev => ({ ...prev, suppliers: false }));
    }
  };

  // Load products by supplier
  const loadProducts = async (supplierId?: string | number) => {
    if (!supplierId) {
      setProducts([]);
      return;
    }
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await getProductsBySupplier(supplierId);
      let productData: any[] = [];
      if (Array.isArray(response)) {
        productData = response;
      } else if (response && Array.isArray((response as any).data)) {
        productData = (response as any).data;
      } else if (response && typeof response === 'object') {
        const responseObj = response as any;
        productData = responseObj.products || responseObj.items || responseObj.result || [];
      }
      if (productData.length > 0) {
        const transformedProducts = productData.map(transformProductFromAPI);
        setProducts(transformedProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      setProducts([]);
      toast.error("Lỗi tải sản phẩm", {
        description: "Không thể tải danh sách sản phẩm"
      });
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Create purchase order
  const createPurchaseOrder = async (poForm: POForm) => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      toast.error("Thông tin không đầy đủ", {
        description: "Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm"
      });
      return false;
    }

    setLoading(prev => ({ ...prev, creating: true }));
    
    try {
      
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
          
          const mappedItem = {
            MaSP: item.MaSP,
            MaMau: item.MaMau,
            MaKichThuoc: item.MaKichThuoc,
            SoLuong: item.quantity,
            DonGia: item.unitPrice,
            ThanhTien: item.quantity * item.unitPrice,
          };
          
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
      
      toast.success("Thành công", {
        description: "Phiếu đặt hàng đã được tạo thành công"
      });

      // Add the new purchase order to state instead of reloading all
      const newPurchaseOrder: PurchaseOrder = {
        id: apiData.MaPDH,
        supplierId: poForm.supplierId,
        supplierName: supplier.name,
        items: poForm.items.map(item => ({
          MaSP: item.MaSP,
          productName: item.productName,
          MaMau: item.MaMau,
          MaKichThuoc: item.MaKichThuoc,
          colorName: item.colorName,
          sizeName: item.sizeName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
        status: "draft",
        totalAmount: poForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        notes: poForm.notes,
        createdBy: currentUserId,
      };
      
      setPurchaseOrders(prev => [newPurchaseOrder, ...prev]);
      
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
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error("Lỗi tạo phiếu đặt hàng", {
        description: errorMessage
      });
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
    return false;
  };

  // Update purchase order
  const updatePurchaseOrder = async (poId: string, poForm: POForm) => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      toast.error("Thông tin không đầy đủ", {
        description: "Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm"
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
      
      toast.success("Thành công", {
        description: "Phiếu đặt hàng đã được cập nhật thành công"
      });

      // Update the specific purchase order in state instead of reloading all
      setPurchaseOrders(prev => 
        prev.map(po => 
          po.id === poId 
            ? {
                ...po,
                supplierId: poForm.supplierId,
                supplierName: supplier.name,
                items: poForm.items.map(item => ({
                  MaSP: item.MaSP,
                  productName: item.productName,
                  MaMau: item.MaMau,
                  MaKichThuoc: item.MaKichThuoc,
                  colorName: item.colorName,
                  sizeName: item.sizeName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.quantity * item.unitPrice,
                })),
                totalAmount: poForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
                notes: poForm.notes,
              }
            : po
        )
      );
      
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
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error("Lỗi cập nhật phiếu đặt hàng", {
        description: errorMessage
      });
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
    return false;
  };

  // Download Excel file
  const downloadExcel = (excelFile: any) => {
    console.log('Downloading excel file:', excelFile);
    const downloadUrl = `http://localhost:8080${excelFile.downloadUrl}`;
    console.log('Download URL:', downloadUrl);
    window.open(downloadUrl, '_blank');
  };

  // Send purchase order
  const sendPurchaseOrder = async (poId: string) => {
    console.log('=== SEND PURCHASE ORDER START ===', poId);
    // Add to sending loading state
    setActionLoading(prev => ({ ...prev, sending: [...prev.sending, poId] }));
    
    try {
      const response = await updatePurchaseOrderStatus(poId, 2); // Status 2 = sent
      
      console.log('Send purchase order response:', response);
      
      // Check if response contains excel file data
      if (response?.excelFile) {
        console.log('Excel file found:', response.excelFile);
        downloadExcel(response.excelFile);
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp và file Excel đã được tải về"
        });
      } else if (response?.data?.excelFile) {
        console.log('Excel file found in data:', response.data.excelFile);
        downloadExcel(response.data.excelFile);
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp và file Excel đã được tải về"
        });
      } else {
        console.log('No excel file found in response');
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp"
        });
      }
      
      console.log('=== UPDATING STATE INSTEAD OF RELOADING ===');
      // Update the specific purchase order status in state instead of reloading all
      setPurchaseOrders(prev => {
        console.log('Current purchase orders:', prev.length);
        const updated = prev.map(po => 
          po.id === poId 
            ? { ...po, status: "sent" as const }
            : po
        );
        console.log('Updated purchase orders:', updated.length);
        return updated;
      });
      console.log('=== SEND PURCHASE ORDER END ===');
    } catch (error: any) {
      console.error("Error sending purchase order:", error);
      let errorMessage = "Không thể gửi phiếu đặt hàng";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error("Lỗi gửi phiếu đặt hàng", {
        description: errorMessage
      });
    } finally {
      // Remove from sending loading state
      setActionLoading(prev => ({ 
        ...prev, 
        sending: prev.sending.filter(id => id !== poId) 
      }));
    }
  };

  // Confirm purchase order
  const confirmPurchaseOrder = async (poId: string) => {
    // Add to confirming loading state
    setActionLoading(prev => ({ ...prev, confirming: [...prev.confirming, poId] }));
    
    try {
      await updatePurchaseOrderStatus(poId, 3); // Status 3 = confirmed
      toast.success("Đã xác nhận phiếu đặt hàng", {
        description: "Phiếu đặt hàng đã được xác nhận"
      });
      
      // Update the specific purchase order status in state instead of reloading all
      setPurchaseOrders(prev => 
        prev.map(po => 
          po.id === poId 
            ? { ...po, status: "confirmed" as const }
            : po
        )
      );
    } catch (error: any) {
      console.error("Error confirming purchase order:", error);
      let errorMessage = "Không thể xác nhận phiếu đặt hàng";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error("Lỗi xác nhận phiếu đặt hàng", {
        description: errorMessage
      });
    } finally {
      // Remove from confirming loading state
      setActionLoading(prev => ({ 
        ...prev, 
        confirming: prev.confirming.filter(id => id !== poId) 
      }));
    }
  };

  // Navigate to goods receipt
  const navigateToGoodsReceipt = (poId: string) => {
    navigate(`/admin/goods-receipt?po=${poId}`);
  };

  // Refresh all data - Only use when user explicitly requests sync with server
  const refreshData = async () => {
    setLoading(prev => ({ ...prev, refreshing: true }));
    
    try {
      await Promise.all([
        loadPurchaseOrders(),
        loadSuppliers(),
        loadProducts(),
      ]);
      
      toast.success("Dữ liệu đã được cập nhật", {
        description: "Tất cả dữ liệu đã được tải lại thành công"
      });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Initialize data on mount
  // Khi supplierId thay đổi, load lại products
  useEffect(() => {
    console.log('=== COMPONENT MOUNT - Loading initial data ===');
    loadPurchaseOrders();
    loadSuppliers();
  }, []);

  useEffect(() => {
    console.log('=== useEffect [suppliers, purchaseOrders] triggered ===');
    if (suppliers && suppliers.length > 0 && purchaseOrders) {
      // Nếu có supplierId được chọn, load sản phẩm theo supplier
      // Tìm supplierId từ purchase order form hoặc state nếu có
      // Ở đây bạn cần truyền supplierId vào loadProducts khi cần
      console.log('Suppliers and purchaseOrders changed, but not calling loadProducts');
    }
  }, [suppliers, purchaseOrders]);

  // Export thêm loadProducts để component gọi khi chọn supplier
  return {
    // Data
    purchaseOrders,
    suppliers,
    products,
    selectedPO,
    stats,
    loading,
    actionLoading,
    
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
    downloadExcel,
    setActionLoading,
  };
}; 