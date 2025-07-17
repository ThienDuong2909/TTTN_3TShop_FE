import { useState } from "react";
import { POForm, PurchaseOrder, PurchaseOrderFilters as PurchaseOrderFiltersType } from "../types";

export const usePurchaseOrderForm = (currentUserId: string) => {
  const [poForm, setPOForm] = useState<POForm>({
    supplierId: "",
    expectedDeliveryDate: "",
    notes: "",
    items: [],
  });

  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [filters, setFilters] = useState<PurchaseOrderFiltersType>({
    searchQuery: "",
    statusFilter: "all",
  });

  const resetForm = () => {
    setPOForm({
      supplierId: "",
      expectedDeliveryDate: "",
      notes: "",
      items: [],
    });
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
  };

  const closeCreateDialog = () => {
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
    filters,
    
    // Actions
    resetForm,
    updateFilter,
    getFilteredPOs,
    openCreateDialog,
    closeCreateDialog,
    openDetailDialog,
    closeDetailDialog,
  };
}; 