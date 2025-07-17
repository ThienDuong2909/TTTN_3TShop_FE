import { useNavigate } from "react-router-dom";
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

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" &&
      !state.user.permissions?.includes("manage_inventory"))
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
    createPurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    navigateToGoodsReceipt,
    refreshData,
    setSelectedPO,
  } = usePurchaseOrderData(state.user.id);

  const {
    poForm,
    setPOForm,
    isCreatePOOpen,
    setIsCreatePOOpen,
    isDetailOpen,
    setIsDetailOpen,
    filters,
    resetForm,
    updateFilter,
    getFilteredPOs,
    openCreateDialog,
    closeCreateDialog,
    openDetailDialog,
    closeDetailDialog,
  } = usePurchaseOrderForm(state.user.id);

  // Handle actions
  const handleCreatePO = async () => {
    const success = await createPurchaseOrder(poForm);
    if (success) {
      closeCreateDialog();
    }
  };

  const handleViewDetails = (po: any) => {
    setSelectedPO(po);
    openDetailDialog();
  };

  const handleEdit = (po: any) => {
    // TODO: Implement edit functionality
    console.log("Edit PO:", po.id);
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
                onOpenChange={setIsCreatePOOpen}
                trigger={
                  <Button className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo phiếu đặt hàng
                  </Button>
                }
                poForm={poForm}
                setPOForm={setPOForm}
                suppliers={suppliers}
                products={products}
                onSubmit={handleCreatePO}
                isLoading={loading.creating}
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
