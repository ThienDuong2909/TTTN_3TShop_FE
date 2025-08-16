import { useState } from "react";
import { POForm, PurchaseOrder, PurchaseOrderFilters as PurchaseOrderFiltersType } from "../types";
import { getPurchaseOrderById } from "../../../services/commonService";

// Helper function to get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export const usePurchaseOrderForm = (currentUserId: string) => {
  const [poForm, setPOForm] = useState<POForm>({
    supplierId: "",
    expectedDeliveryDate: getTomorrowDate(), // Set default to tomorrow
    notes: "",
    items: [],
  });

  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [isLoadingPODetails, setIsLoadingPODetails] = useState(false);
  
  const [filters, setFilters] = useState<PurchaseOrderFiltersType>({
    searchQuery: "",
    statusFilter: "all",
  });

  const resetForm = () => {
    setPOForm({
      supplierId: "",
      expectedDeliveryDate: getTomorrowDate(), // Set default to tomorrow when resetting
      notes: "",
      items: [],
    });
    setIsEditMode(false);
    setEditingPO(null);
  };

  // Populate form with existing PO data for editing
  const populateFormForEdit = async (po: PurchaseOrder) => {
    try {
      setIsLoadingPODetails(true);
      
      // Gọi API lấy chi tiết phiếu đặt hàng
      const poDetails = await getPurchaseOrderById(po.id);
      
      if (poDetails && poDetails.data) {
        const details = poDetails.data;
        
        setPOForm({
          supplierId: details.MaNCC ? details.MaNCC.toString() : po.supplierId.toString(),
          expectedDeliveryDate: details.NgayKienNghiGiao || po.NgayKienNghiGiao || po.expectedDeliveryDate || "",
          notes: details.GhiChu || po.notes || "",
          items: details.CT_PhieuDatHangNCCs ? details.CT_PhieuDatHangNCCs.map((item: any) => {
            const ctsp = item.ChiTietSanPham || {};
            const productName = ctsp.SanPham?.TenSP || ctsp.TenSP || item.SanPham?.TenSP || item.productName || `Sản phẩm ${ctsp.MaSP || item.MaSP || item.MaCTSP || ''}`;
            const colorName = ctsp.Mau?.TenMau || item.Mau?.TenMau || item.colorName || '';
            const sizeName = ctsp.KichThuoc?.TenKichThuoc || item.KichThuoc?.TenKichThuoc || item.sizeName || '';
            return {
              MaSP: ctsp.MaSP || item.MaSP || item.MaCTSP || '',
              productName,
              MaCTSP: item.MaCTSP || ctsp.MaCTSP || '',
              colorName,
              sizeName,
              colorId: item.Mau?.MaMau || ctsp.Mau?.MaMau || undefined,
              sizeId: item.KichThuoc?.MaKichThuoc || ctsp.KichThuoc?.MaKichThuoc || undefined,
              quantity: Number(item.SoLuong) || 0,
              unitPrice: Number(item.DonGia) || 0,
            };
          }) : po.items.map(item => ({ ...item })),
        });
        
        setIsEditMode(true);
        setEditingPO(po);
      } else {
        console.error("No PO details found");
        // Fallback to basic PO data if API fails
        setPOForm({
          supplierId: po.supplierId.toString(),
          expectedDeliveryDate: po.expectedDeliveryDate || "",
          notes: po.notes || "",
          items: po.items.map(item => ({
            MaSP: item.MaSP,
            productName: item.productName,
            MaCTSP: item.MaCTSP,
            colorName: item.colorName,
            sizeName: item.sizeName,
            colorId: item.colorId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });
        
        setIsEditMode(true);
        setEditingPO(po);
      }
    } catch (error) {
      console.error("Error loading PO details:", error);
      // Fallback to basic PO data if API fails
      setPOForm({
        supplierId: po.supplierId.toString(),
        expectedDeliveryDate: po.expectedDeliveryDate || "",
        notes: po.notes || "",
        items: po.items.map(item => ({
          MaSP: item.MaSP,
          productName: item.productName,
          MaCTSP: item.MaCTSP,
          colorName: item.colorName,
          sizeName: item.sizeName,
          colorId: item.colorId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      
      setIsEditMode(true);
      setEditingPO(po);
    } finally {
      setIsLoadingPODetails(false);
    }
  };

  const updateFilter = (key: keyof PurchaseOrderFiltersType, value: string) => {
    setFilters((prev: PurchaseOrderFiltersType) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter purchase orders based on search and status
  const getFilteredPOs = (purchaseOrders: PurchaseOrder[]) => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.id.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesStatus = filters.statusFilter === "all" || po.status === filters.statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const openCreateDialog = () => {
    setIsCreatePOOpen(true);
    setIsEditMode(false);
    setEditingPO(null);
  };

  const closeCreateDialog = () => {
    setIsCreatePOOpen(false);
    resetForm();
  };

  const openEditDialog = async (po: PurchaseOrder) => {
    setIsCreatePOOpen(true); // Open dialog first
    await populateFormForEdit(po);
  };

  const closeEditDialog = () => {
    setIsCreatePOOpen(false);
    resetForm();
  };

  const openDetailDialog = () => {
    setIsDetailOpen(true);
  };

  const closeDetailDialog = () => {
    setIsDetailOpen(false);
  };

  return {
    // Form state
    poForm,
    setPOForm,
    isCreatePOOpen,
    setIsCreatePOOpen,
    isDetailOpen,
    setIsDetailOpen,
    isEditMode,
    editingPO,
    isLoadingPODetails,
    filters,
    
    // Actions
    resetForm,
    populateFormForEdit,
    updateFilter,
    getFilteredPOs,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDetailDialog,
    closeDetailDialog,
  };
}; 