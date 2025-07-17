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
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
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

  const initializeGRForm = (po: PurchaseOrder) => {
    setGRForm({
      purchaseOrderId: po?.id || "",
      receivedBy: currentUserId,
      notes: "",
      items: (po?.items || []).map((item, index) => ({
        purchaseOrderItemId: `${po?.id || "unknown"}-${index + 1}`,
        productId: item.productId,
        productName: item.productName,
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Default to ordered quantity
        unitPrice: item.unitPrice,
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
  };

  // Filter goods receipts based on search and status
  const getFilteredGRs = (goodsReceipts: any[]) => {
    return (goodsReceipts || []).filter((gr) => {
      const matchesSearch =
        gr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gr.purchaseOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gr.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
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
      const po = availablePOs.find((p) => p.id === poId);
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
    
    // Actions
    initializeGRForm,
    resetForm,
    getFilteredGRs,
    handlePOSelect,
  };
}; 