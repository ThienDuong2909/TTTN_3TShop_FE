import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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

export const useGoodsReceiptForm = (
  currentUserId: string,
  availablePOs: PurchaseOrder[],
  onPOSelect: (poId: string) => void
) => {
  const [searchParams] = useSearchParams();

  const [grForm, setGRForm] = useState<GRForm>({
    purchaseOrderId: "",
    receivedBy: currentUserId,
    notes: "",
    items: [],
  });

  const [isCreateGROpen, setIsCreateGROpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Excel import states
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelError, setExcelError] = useState("");
  const [excelValidationErrors, setExcelValidationErrors] = useState<any[]>([]);

  const initializeGRForm = (po: any) => {
    const poId = po?.MaPDH || po?.id || "";
    const poItems = po?.CT_PhieuDatHangNCCs || po?.items || [];
    
    setGRForm({
      purchaseOrderId: poId,
      receivedBy: currentUserId,
      notes: "",
      items: poItems.map((item: any, index: number) => ({
        purchaseOrderItemId: `${poId}-${index + 1}`,
        productId: item.MaCTSP || item.productId || "",
        productName: item.TenSP || item.productName || "",
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        orderedQuantity: item.SoLuong || item.quantity || 0,
        receivedQuantity: item.SoLuong || item.quantity || 0, // Default to ordered quantity
        unitPrice: item.DonGia || item.unitPrice || 0,
        condition: "good" as const,
        notes: "",
      })),
    });
  };

  const resetForm = () => {
    setGRForm({
      purchaseOrderId: "",
      receivedBy: currentUserId,
      notes: "",
      items: [],
    });
    // Reset Excel data as well
    setExcelData([]);
    setExcelError("");
    setExcelValidationErrors([]);
  };

  // Filter goods receipts based on search and status
  const getFilteredGRs = (goodsReceipts: any[]) => {
    return (goodsReceipts || []).filter((gr: any) => {
      const matchesSearch =
        (gr.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (gr.MaPDH || gr.purchaseOrderId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (gr.supplierName || gr.NhaCungCap?.TenNCC || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || gr.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Handle purchase order selection
  const handlePOSelect = async (poId: string) => {
    await onPOSelect(poId);
    // The onPOSelect function should update the selectedPO state
    // and we'll initialize the form in the useEffect that watches for availablePOs changes
  };

  // Auto-open create dialog if PO is specified in URL
  useEffect(() => {
    const poId = searchParams.get("po");
    if (poId && availablePOs.length > 0) {
      const po = availablePOs.find((p: any) => (p.MaPDH || p.id) === poId);
      if (po) {
        setIsCreateGROpen(true);
        handlePOSelect(poId);
      }
    }
  }, [searchParams, availablePOs]);

  return {
    // Form state
    grForm,
    setGRForm,
    isCreateGROpen,
    setIsCreateGROpen,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    
    // Excel import state
    excelData,
    setExcelData,
    excelError,
    setExcelError,
    excelValidationErrors,
    setExcelValidationErrors,
    
    // Actions
    initializeGRForm,
    resetForm,
    getFilteredGRs,
    handlePOSelect,
  };
}; 