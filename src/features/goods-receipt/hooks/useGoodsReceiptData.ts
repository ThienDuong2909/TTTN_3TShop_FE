import { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/use-toast";
import {
  getGoodsReceipts,
  createGoodsReceipt,
  updateInventoryAfterReceipt,
  getAvailablePurchaseOrders,
  getPurchaseOrderForReceipt,
} from "../../../services/api";

interface GoodsReceiptItem {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  selectedColor: string;
  selectedSize: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  condition: "good" | "damaged" | "defective";
  notes?: string;
  totalReceivedValue: number;
}

interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  items: GoodsReceiptItem[];
  status: "draft" | "completed";
  totalReceivedValue: number;
  receiptDate: string;
  receivedBy: string;
  notes?: string;
}

interface PurchaseOrder {
  id?: string;
  MaPDH?: string;
  supplierId?: string;
  MaNCC?: number;
  supplierName?: string;
  NhaCungCap?: {
    MaNCC: number;
    TenNCC: string;
    DiaChi?: string;
    SDT?: string;
    Email?: string;
  };
  orderDate?: string;
  NgayDat?: string;
  status?: string;
  TrangThaiDatHangNCC?: {
    MaTrangThai: number;
    TenTrangThai: string;
  };
  totalAmount?: number;
  items?: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
  }>;
  CT_PhieuDatHangNCCs?: Array<{
    MaCTSP: string;
    TenSP: string;
    SoLuong: number;
    DonGia: number;
    [key: string]: any;
  }>;
}

interface GRForm {
  purchaseOrderId: string;
  receivedBy: string;
  notes: string;
  items: Omit<GoodsReceiptItem, "totalReceivedValue">[];
}

export const useGoodsReceiptData = (currentUserId: string) => {
  const { toast } = useToast();
  
  // State
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [availablePOs, setAvailablePOs] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  
  const [loading, setLoading] = useState({
    goodsReceipts: false,
    purchaseOrders: false,
    creating: false,
    refreshing: false,
  });

  const [stats, setStats] = useState({
    pendingPOs: 0,
    monthlyReceipts: 0,
    totalValue: 0,
  });

  // Load goods receipts
  const loadGoodsReceipts = async () => {
    setLoading(prev => ({ ...prev, goodsReceipts: true }));
    
    try {
      const response = await getGoodsReceipts();
      
      // Extract data from response object or use response directly if it's already an array
      const receipts = (response as any)?.data || response;
      setGoodsReceipts(Array.isArray(receipts) ? receipts : []);
      
      // Calculate stats
      const currentMonth = new Date().getMonth();
      const receiptsArray = Array.isArray(receipts) ? receipts : [];
      const monthlyReceipts = receiptsArray.filter(
        (gr: GoodsReceipt) => new Date(gr.receiptDate).getMonth() === currentMonth
      ).length;
      const totalValue = receiptsArray.reduce(
        (sum: number, gr: GoodsReceipt) => sum + (gr.totalReceivedValue || 0),
        0
      );
      
      setStats(prev => ({
        ...prev,
        monthlyReceipts,
        totalValue,
      }));
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách phiếu nhập hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, goodsReceipts: false }));
    }
  };

  // Load available purchase orders
  const loadAvailablePurchaseOrders = async () => {
    setLoading(prev => ({ ...prev, purchaseOrders: true }));
    
    try {
      const response = await getAvailablePurchaseOrders();
      console.log(response);
      
      // Extract data from response object
      const orders = (response as any)?.data || []; 
      setAvailablePOs(Array.isArray(orders) ? orders : []);
      setStats(prev => ({
        ...prev,
        pendingPOs: Array.isArray(orders) ? orders.length : 0,
      }));
    } catch (error) {
      toast({
        title: "Lỗi tải phiếu đặt hàng",
        description: "Không thể tải danh sách phiếu đặt hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, purchaseOrders: false }));
    }
  };

  // Load purchase order details
  const loadPurchaseOrderDetails = async (poId: string) => {
    try {
      const poDetails = await getPurchaseOrderForReceipt(poId);
      if (poDetails) {
        setSelectedPO(poDetails);
        return poDetails;
      }
    } catch (error) {
      toast({
        title: "Lỗi tải chi tiết phiếu đặt hàng",
        description: "Không thể tải chi tiết phiếu đặt hàng",
        variant: "destructive",
      });
    }
    return null;
  };

  // Create goods receipt
  const createGoodsReceiptRecord = async (grForm: GRForm) => {
    if (!grForm.purchaseOrderId || (grForm.items || []).length === 0) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng chọn phiếu đặt hàng và kiểm tra số lượng nhận",
        variant: "destructive",
      });
      return false;
    }

    setLoading(prev => ({ ...prev, creating: true }));
    
    try {
      const goodsReceiptData = {
        SoPN: `GR${Date.now()}`, // Generate unique ID
        NgayNhap: new Date(),
        MaPDH: grForm.purchaseOrderId,
        MaNV: grForm.receivedBy,
        details: (grForm.items || []).map(item => ({
          MaCTSP: item.productId,
          SoLuong: item.receivedQuantity,
          DonGia: item.unitPrice,
          TinhTrang: item.condition,
          GhiChu: item.notes || "",
        })),
      };

      const result = await createGoodsReceipt(goodsReceiptData);

      if (result) {
        // Update inventory after successful creation
        try {
          await updateInventoryAfterReceipt(result.id);
        } catch (error) {
          toast({
            title: "Cảnh báo",
            description: "Phiếu nhập đã tạo nhưng không thể cập nhật tồn kho",
            variant: "destructive",
          });
        }

        toast({
          title: "Thành công",
          description: "Phiếu nhập hàng đã được tạo thành công",
        });

        // Reload data
        await Promise.all([
          loadGoodsReceipts(),
          loadAvailablePurchaseOrders(),
        ]);

        return true;
      }
    } catch (error) {
      toast({
        title: "Lỗi tạo phiếu nhập hàng",
        description: "Không thể tạo phiếu nhập hàng",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
    return false;
  };

  // Refresh all data
  const refreshData = async () => {
    setLoading(prev => ({ ...prev, refreshing: true }));
    
    try {
      await Promise.all([
        loadGoodsReceipts(),
        loadAvailablePurchaseOrders(),
      ]);
      
      toast({
        title: "Dữ liệu đã được cập nhật",
        description: "Tất cả dữ liệu đã được tải lại thành công",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadGoodsReceipts();
    loadAvailablePurchaseOrders();
  }, []);

  return {
    // Data
    goodsReceipts,
    availablePOs,
    selectedPO,
    selectedGR,
    stats,
    loading,
    
    // Actions
    loadGoodsReceipts,
    loadAvailablePurchaseOrders,
    loadPurchaseOrderDetails,
    createGoodsReceiptRecord,
    refreshData,
    setSelectedPO,
    setSelectedGR,
  };
}; 