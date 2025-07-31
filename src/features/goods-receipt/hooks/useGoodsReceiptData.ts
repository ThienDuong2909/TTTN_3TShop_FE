import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getGoodsReceipts,
  createGoodsReceipt,
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

export const getStatusFromTrangThai = (maTrangThai: number): PurchaseOrder["status"] => {
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

export const useGoodsReceiptData = (currentUserId: string) => {
  
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
      const receipts = ((response as any)?.data || response || []).map((r: any) => ({
        id: r.SoPN,
        purchaseOrderId: r.MaPDH,
        supplierId: r.PhieuDatHangNCC?.MaNCC,
        supplierName: r.PhieuDatHangNCC?.NhaCungCap?.TenNCC,
        receiptDate: r.NgayNhap,
        receivedBy: r.NhanVien?.TenNV,
        items: (r.CT_PhieuNhaps || []).map((item: any) => ({
          purchaseOrderItemId: item.MaCTSP,
          productId: item.MaCTSP,
          productName: item.ChiTietSanPham?.SanPham?.TenSP || "",
          selectedColor: item.ChiTietSanPham?.Mau?.MaHex ? `#${item.ChiTietSanPham.Mau.MaHex}` : "",
          colorName: item.ChiTietSanPham?.Mau?.TenMau || "",
          selectedSize: item.ChiTietSanPham?.KichThuoc?.TenKichThuoc || "",
          orderedQuantity: item.SoLuongDat || 0,
          receivedQuantity: item.SoLuong,
          unitPrice: parseFloat(item.DonGia),
          condition: item.TinhTrang || "good",
          notes: item.GhiChu,
          totalReceivedValue: parseFloat(item.DonGia) * item.SoLuong,
        })),
        totalReceivedValue: (r.CT_PhieuNhaps || []).reduce(
          (sum: number, item: any) => sum + parseFloat(item.DonGia) * item.SoLuong,
          0
        ),
        status: r.TrangThai || "completed",
      }));
      setGoodsReceipts(receipts);
      
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
      toast.error("Lỗi tải dữ liệu", {
        description: "Không thể tải danh sách phiếu nhập hàng"
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
      
      // Extract data from response object
      const orders = (response as any)?.data || []; 
      setAvailablePOs(Array.isArray(orders) ? orders : []);
      setStats(prev => ({
        ...prev,
        pendingPOs: Array.isArray(orders) ? orders.length : 0,
      }));
    } catch (error) {
      toast.error("Lỗi tải phiếu đặt hàng", {
        description: "Không thể tải danh sách phiếu đặt hàng"
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
        setSelectedPO(poDetails.data);
        return poDetails.data;
      }
    } catch (error) {
      toast.error("Lỗi tải chi tiết phiếu đặt hàng", {
        description: "Không thể tải chi tiết phiếu đặt hàng"
      });
    }
    return null;
  };

  // Create goods receipt
  const createGoodsReceiptRecord = async (grForm: GRForm) => {
    if (!grForm.purchaseOrderId || (grForm.items || []).length === 0) {
      toast.error("Thông tin không đầy đủ", {
        description: "Vui lòng chọn phiếu đặt hàng và kiểm tra số lượng nhận"
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
        toast.success("Thành công", {
          description: "Phiếu nhập hàng đã được tạo thành công"
        });

        // Reload data
        await Promise.all([
          loadGoodsReceipts(),
          loadAvailablePurchaseOrders(),
        ]);

        return true;
      }
    } catch (err: any) {
      let errorMessage = "Không thể tạo phiếu nhập hàng";
      if (err && err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      toast.error("Lỗi tạo phiếu nhập hàng", {
        description: errorMessage
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
      
      toast.success("Dữ liệu đã được cập nhật", {
        description: "Tất cả dữ liệu đã được tải lại thành công"
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