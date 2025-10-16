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
  console.log('transformPurchaseOrderFromAPI - apiPO:', apiPO); // Debug log
  
  const items = (apiPO.CT_PhieuDatHangNCCs || []).map((item: any, index: number) => {
    console.log(`transformPurchaseOrderFromAPI - item ${index}:`, item); // Debug log
    
    // Debug: Check the structure of ChiTietSanPham
    if (item.ChiTietSanPham) {
      console.log(`  ChiTietSanPham structure:`, {
        Mau: item.ChiTietSanPham.Mau,
        KichThuoc: item.ChiTietSanPham.KichThuoc,
        SanPham: item.ChiTietSanPham.SanPham
      });
    }
    
    const transformedItem = {
      MaSP: item.ChiTietSanPham?.MaSP || item.MaSP,
      productName: item.ChiTietSanPham?.SanPham?.TenSP || item.productName || "Sản phẩm không tên",
      MaCTSP: item.MaCTSP || item.ChiTietSanPham?.MaCTSP || "",
      colorName: item.ChiTietSanPham?.Mau?.TenMau || item.colorName || "",
      colorHex: item.ChiTietSanPham?.Mau?.MaHex || item.colorHex || "",
      sizeName: item.ChiTietSanPham?.KichThuoc?.TenKichThuoc || item.sizeName || "",
      quantity: item.SoLuong || 0,
      unitPrice: parseFloat(item.DonGia) || 0,
      totalPrice: (item.SoLuong || 0) * (parseFloat(item.DonGia) || 0),
    };
    console.log(`transformPurchaseOrderFromAPI - transformedItem ${index}:`, transformedItem); // Debug log
    return transformedItem;
  });
  
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
    NgayKienNghiGiao: apiPO.NgayKienNghiGiao || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: apiPO.GhiChu || "",
    createdBy: apiPO.MaNV || "",
  };
  
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

const transformProductFromAPI = (apiProduct: any): Product => {
  const transformed = {
    id: apiProduct.MaSP || apiProduct.MaCTSP || apiProduct.id,
    name: apiProduct.TenSP || apiProduct.TenSanPham || apiProduct.name || apiProduct.MaCTSP || "Sản phẩm không tên",
    price: parseFloat(apiProduct.DonGia) || parseFloat(apiProduct.Gia) || 0,
    description: apiProduct.MoTa || apiProduct.description || "",
    category: apiProduct.LoaiSP || apiProduct.category || "clothing",
    // Giữ lại MaNCC để filter theo nhà cung cấp
    MaNCC: apiProduct.MaNCC || apiProduct.supplierId,
    // Thêm các thông tin khác nếu có
    color: apiProduct.Mau?.TenMau || apiProduct.color || "",
    size: apiProduct.KichThuoc?.TenKichThuoc || apiProduct.size || "",
    stock: apiProduct.SoLuongTon || apiProduct.stock || 0,
  };
  
  return transformed;
};

// Helper function to map status
const getStatusFromTrangThai = (maTrangThai: number): PurchaseOrder["status"] => {
  switch (maTrangThai) {
    case 1: return "draft" ;
    case 2: return "sent";
    case 3: return "confirmed";
    case 4: return "partially_received";
    case 5: return "completed";
    case 6: return "cancelled";
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
    setLoading(prev => ({ ...prev, purchaseOrders: true }));
    
    try {
      const response = await getPurchaseOrders();
      console.log('loadPurchaseOrders - raw response:', response); // Debug log
      
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
      
      console.log('loadPurchaseOrders - extracted orders:', orders); // Debug log
      
      const transformedOrders = orders.map(transformPurchaseOrderFromAPI);
      console.log('loadPurchaseOrders - transformed orders:', transformedOrders); // Debug log
      
      // Debug: Check if items have colorName and sizeName
      transformedOrders.forEach((po, poIndex) => {
        console.log(`PO ${poIndex} (${po.id}) items:`, po.items);
        po.items.forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex}: colorName="${item.colorName}", sizeName="${item.sizeName}"`);
          // Also log the raw item data for debugging
          console.log(`  Raw item data:`, item);
        });
      });
      
      // Set purchase orders
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
    setLoading(prev => ({ ...prev, suppliers: true }));
    
    try {
      const response = await getSuppliers();
      
      // Extract supplier data from the API response structure
      let supplierData: any[] = [];
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        const responseObj = response as any;
        if (responseObj.success && responseObj.data && responseObj.data.data) {
          // API response structure: { success: true, data: { data: Array } }
          supplierData = responseObj.data.data;
        } else if (Array.isArray(responseObj.data)) {
          supplierData = responseObj.data;
        } else {
          // Fallback: try to find array in common properties
          supplierData = responseObj.suppliers || responseObj.items || responseObj.result || [];
        }
      } else if (Array.isArray(response)) {
        supplierData = response;
      }
      
      if (supplierData.length > 0) {
        const transformedSuppliers = supplierData.map(transformSupplierFromAPI);
        setSuppliers(transformedSuppliers);
      } else {
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
      
      // Handle different API response structures
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        const responseObj = response as any;
        if (responseObj.success && responseObj.data && Array.isArray(responseObj.data)) {
          // API response structure: { success: true, data: Array }
          productData = responseObj.data;
        } else if (responseObj.data && responseObj.data.data && Array.isArray(responseObj.data.data)) {
          // API response structure: { data: { data: Array } }
          productData = responseObj.data.data;
        } else if (Array.isArray(responseObj.data)) {
          productData = responseObj.data;
        } else {
          // Fallback: try to find array in common properties
          productData = responseObj.products || responseObj.items || responseObj.result || [];
        }
      } else if (Array.isArray(response)) {
        productData = response;
      }
      
      if (productData.length > 0) {
        const transformedProducts = productData.map(transformProductFromAPI);
        setProducts(transformedProducts);
      } else {
        setProducts([]);
        toast.info("Không có sản phẩm", {
          description: "Nhà cung cấp này chưa có sản phẩm nào"
        });
      }
    } catch (error: any) {
      console.error("Error loading products by supplier:", error);
      setProducts([]);
      toast.error("Lỗi tải sản phẩm", {
        description: "Không thể tải danh sách sản phẩm của nhà cung cấp"
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

    // Validate that all items have colorId and sizeId
    const invalidItems = poForm.items.filter(item => !item.colorId || !item.sizeId);
    if (invalidItems.length > 0) {
      toast.error("Thông tin không đầy đủ", {
        description: "Vui lòng chọn màu và kích thước cho tất cả sản phẩm"
      });
      return false;
    }



    setLoading(prev => ({ ...prev, creating: true }));
    
    try {
      
      const supplier = suppliers.find(s => s.id.toString() === poForm.supplierId.toString());
      
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
        NgayKienNghiGiao: poForm.expectedDeliveryDate, // Add expected delivery date
        GhiChu: poForm.notes || "",
        details: poForm.items.map(item => {
          
          const mappedItem = {
            MaSP: item.MaSP,
            MaMau: item.colorId,
            MaKichThuoc: item.sizeId,
            SoLuong: item.quantity,
            DonGia: item.unitPrice,
            ThanhTien: item.quantity * item.unitPrice,
          };
          
          return mappedItem;
        }),
      };

      console.log("DEBUG - Final apiData:", apiData);

      const result = await createPurchaseOrderAPI(apiData);
      
      toast.success("Thành công", {
        description: "Phiếu đặt hàng đã được tạo thành công"
      });

      // Refresh data from API instead of adding to state
      await Promise.all([
        loadPurchaseOrders(),
        loadSuppliers(),
      ]);
      
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

    // Validate that all items have colorId and sizeId
    const invalidItems = poForm.items.filter(item => !item.colorId || !item.sizeId);
    if (invalidItems.length > 0) {
      toast.error("Thông tin không đầy đủ", {
        description: "Vui lòng chọn màu và kích thước cho tất cả sản phẩm"
      });
      return false;
    }

    setLoading(prev => ({ ...prev, updating: true }));
    
    try {
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
        NgayKienNghiGiao: poForm.expectedDeliveryDate, // Add expected delivery date
        GhiChu: poForm.notes || "",
        details: poForm.items.map(item => ({
          MaSP: item.MaSP,
          MaMau: item.colorId,
          MaKichThuoc: item.sizeId,
          SoLuong: item.quantity,
          DonGia: item.unitPrice,
          ThanhTien: item.quantity * item.unitPrice,
        })),
      };

      const result = await updatePurchaseOrderAPI(poId, apiData);
      
      // Check if the API call was successful
      if (!result || result.error) {
        throw new Error(result?.error || "Cập nhật phiếu đặt hàng thất bại");
      }
      
      toast.success("Thành công", {
        description: "Phiếu đặt hàng đã được cập nhật thành công"
      });

      // Refresh data from API instead of updating state
      await Promise.all([
        loadPurchaseOrders(),
        loadSuppliers(),
      ]);
      
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
    const downloadUrl = `http://localhost:8080${excelFile.downloadUrl}`;
    window.open(downloadUrl, '_blank');
  };

  // Send purchase order
  const sendPurchaseOrder = async (poId: string) => {
    // Add to sending loading state
    setActionLoading(prev => ({ ...prev, sending: [...prev.sending, poId] }));
    
    try {
      const response = await updatePurchaseOrderStatus(poId, 2); // Status 2 = sent
      
      // Check if response contains excel file data
      if (response?.excelFile) {
        downloadExcel(response.excelFile);
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp và file Excel đã được tải về"
        });
      } else if (response?.data?.excelFile) {
        downloadExcel(response.data.excelFile);
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp và file Excel đã được tải về"
        });
      } else {
        toast.success("Đã gửi phiếu đặt hàng", {
          description: "Phiếu đặt hàng đã được gửi cho nhà cung cấp"
        });
      }
      
      // Refresh data from API instead of updating state
      await loadPurchaseOrders();
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
        description: "Phiếu đặt hàng đã được xác nhận thành công"
      });
      
      // Refresh data from API instead of updating state
      await loadPurchaseOrders();
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
    loadPurchaseOrders();
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (suppliers && suppliers.length > 0 && purchaseOrders) {
      // Không tự động load products ở đây, để component gọi handleSupplierChange khi cần
    }
  }, [suppliers, purchaseOrders]);

  // Helper function to handle supplier selection and load products
  const handleSupplierChange = async (supplierId: string | number) => {
    if (!supplierId) {
      setProducts([]);
      return;
    }
    
    // Load products for the selected supplier
    await loadProducts(supplierId);
  };

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
    handleSupplierChange, // Thêm hàm helper này
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