import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, RefreshCw } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useApp } from "../contexts/AppContext";
import { useEffect } from "react";

// Import components and hooks
import {
  PurchaseOrderStats,
  PurchaseOrderTable,
  CreatePurchaseOrderDialog,
  PurchaseOrderDetailDialog,
  usePurchaseOrderData,
  usePurchaseOrderForm,
} from "../features/purchase";

export default function PurchaseOrders() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" &&
      !state.user.permissions?.includes("dathang.xem") &&
    !state.user.permissions?.includes("toanquyen"))
  ) {
    navigate("/admin");
    return null;
  }

  // Initialize hooks
  const {
    purchaseOrders,
    suppliers,
    products,
    selectedPO,
    stats,
    loading,
    actionLoading,
    createPurchaseOrder,
    updatePurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    navigateToGoodsReceipt,
    refreshData,
    setSelectedPO,
    loadProducts,
    setActionLoading,
  } = usePurchaseOrderData(state.user.id);

  console.log("purchaseOrders", purchaseOrders);

  const {
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
    resetForm,
    updateFilter,
    getFilteredPOs,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog,
    openDetailDialog,
    closeDetailDialog,
  } = usePurchaseOrderForm(state.user.id);

  // Handle actions
  const handleCreatePO = async () => {
    let success: boolean;
    
    if (isEditMode && editingPO) {
      success = await updatePurchaseOrder(editingPO.id, poForm);
    } else {
      success = await createPurchaseOrder(poForm);
    }
    
    if (success) {
      closeCreateDialog();
    }
  };

  const handleViewDetails = (po: any) => {
    setSelectedPO(po);
    openDetailDialog();
  };

  const handleEdit = async (po: any) => {
    console.log("Edit PO:", po);
    // Add to editing loading state
    setActionLoading((prev: any) => ({ ...prev, editing: [...prev.editing, po.id] }));
    try {
      await openEditDialog(po);
    } finally {
      // Remove from editing loading state
      setActionLoading((prev: any) => ({ 
        ...prev, 
        editing: prev.editing.filter((id: string) => id !== po.id) 
      }));
    }
  };

  const handleSend = async (poId: string) => {
    await sendPurchaseOrder(poId);
  };

  const handleConfirm = async (poId: string) => {
    await confirmPurchaseOrder(poId);
  };

  const handleCreateReceipt = (poId: string) => {
    navigateToGoodsReceipt(poId);
  };

  // Thay vì chỉ setIsCreatePOOpen(true), hãy reset form trước khi mở
  const handleOpenCreateDialog = () => {
    resetForm();
    setIsCreatePOOpen(true);
  };

  // Xử lý tham số URL để tự động mở dialog chi tiết
  useEffect(() => {
    const viewPOId = searchParams.get("view");
    if (viewPOId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find((p: any) => p.id === viewPOId);
      if (po) {
        setSelectedPO(po);
        openDetailDialog();
        // Xóa tham số URL sau khi đã xử lý
        navigate("/admin/purchase-orders", { replace: true });
      }
    }
  }, [searchParams, purchaseOrders, setSelectedPO, openDetailDialog, navigate]);

  // Get filtered purchase orders
  const filteredPOs = getFilteredPOs(purchaseOrders);

  return (
    <div>
      <AdminHeader title="Quản lý phiếu đặt hàng" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
                  <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tìm kiếm theo mã phiếu hoặc nhà cung cấp..."
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter("searchQuery", e.target.value)}
                  className="w-64"
                />
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={filters.statusFilter} onValueChange={(value) => updateFilter("statusFilter", value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="sent">Đã gửi</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="partially_received">Nhập một phần</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={loading.refreshing}
              >
                {loading.refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <CreatePurchaseOrderDialog
                open={isCreatePOOpen}
                onOpenChange={(open) => {
                  if (!open) resetForm();
                  setIsCreatePOOpen(open);
                }}
                trigger={
                  <Button 
                    className="bg-brand-600 hover:bg-brand-700" 
                    onClick={handleOpenCreateDialog}
                    disabled={loading.creating || loading.updating}
                  >
                    {loading.creating || loading.updating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {loading.creating || loading.updating ? "Đang tạo..." : "Tạo phiếu đặt hàng"}
                  </Button>
                }
                poForm={poForm}
                setPOForm={setPOForm}
                suppliers={suppliers}
                products={products}
                onSubmit={handleCreatePO}
                isLoading={loading.creating || loading.updating}
                isEditMode={isEditMode}
                editingPO={editingPO}
                isLoadingPODetails={isLoadingPODetails}
                loadProducts={loadProducts}
              />
            </div>
          </div>

          {/* Stats */}
          <PurchaseOrderStats stats={stats} loading={loading} />

            {/* Purchase Orders Table */}
            <PurchaseOrderTable
              purchaseOrders={filteredPOs}
              loading={loading.purchaseOrders}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onSend={handleSend}
              onConfirm={handleConfirm}
              onCreateReceipt={handleCreateReceipt}
              loadingStates={actionLoading}
            />

            {/* Purchase Order Details Dialog */}
            <PurchaseOrderDetailDialog
              open={isDetailOpen}
              onOpenChange={setIsDetailOpen}
              purchaseOrder={selectedPO}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
