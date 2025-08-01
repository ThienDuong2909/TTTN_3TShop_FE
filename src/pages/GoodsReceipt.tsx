import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import { useApp } from "../contexts/AppContext";

// Import components and hooks
import {
  GoodsReceiptStats,
  GoodsReceiptTable,
  CreateGoodsReceiptDialog,
  useGoodsReceiptData,
  useGoodsReceiptForm,
} from "../features/goods-receipt";

import React, { useState } from "react";

export default function GoodsReceipt() {
  const { state } = useApp();
  const navigate = useNavigate();

  // Thêm state resetKey để force remount ExcelImport
  const [resetKey, setResetKey] = useState(0);

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" &&
      !state.user.permissions?.includes("import.*"))
  ) {
    navigate("/admin");
    return null;
  }

  // Initialize hooks
  const {
    goodsReceipts,
    availablePOs,
    selectedPO,
    stats,
    loading,
    loadPurchaseOrderDetails,
    createGoodsReceiptRecord,
    refreshData,
    setSelectedGR,
    setSelectedPO,
  } = useGoodsReceiptData(state.user.id);

  const {
    grForm,
    setGRForm,
    isCreateGROpen,
    setIsCreateGROpen,
    searchQuery,
    setSearchQuery,
    getFilteredGRs,
    resetForm,
    excelData,
    setExcelData,
    excelError,
    setExcelError,
    excelValidationErrors,
    setExcelValidationErrors,
  } = useGoodsReceiptForm(
    state.user.id,
    availablePOs,
    loadPurchaseOrderDetails
  );

  // Handle purchase order selection
  const handlePOSelect = async (poId: string) => {
    setGRForm(prev => ({ ...prev, purchaseOrderId: poId }));
    await loadPurchaseOrderDetails(poId);
  };

  // Handle create goods receipt
  const handleCreateGR = async (form: any) => {
    const success = await createGoodsReceiptRecord(form);
    if (success) {
      setIsCreateGROpen(false);
      resetForm();
    }
  };

  // Handle view details
  const handleViewDetails = (gr: any) => {
    setSelectedGR(gr);
    // You can add a view details modal here
  };

  // Handle dialog open/close
  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setSelectedPO(null); // Đặt null trước để form con nhận đúng giá trị
      resetForm(); // Reset mọi state liên quan
      setResetKey((k) => k + 1); // Tăng key để force remount ExcelImport
    }
    setIsCreateGROpen(open);
  };

  // Get filtered goods receipts
  const filteredGRs = getFilteredGRs(goodsReceipts);

  return (
    <div>
      <AdminHeader title="Quản lý phiếu nhập hàng" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Tìm kiếm phiếu nhập hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Search className="h-4 w-4 text-muted-foreground" />
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
                
                <CreateGoodsReceiptDialog
                  key={resetKey}
                  open={isCreateGROpen}
                  onOpenChange={handleDialogOpenChange}
                  trigger={
                    <Button className="bg-brand-600 hover:bg-brand-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo phiếu nhập hàng
                    </Button>
                  }
                  grForm={grForm}
                  setGRForm={setGRForm}
                  availablePOs={availablePOs}
                  selectedPO={selectedPO}
                  onPOSelect={handlePOSelect}
                  onCreateGR={handleCreateGR}
                  loading={loading}
                  currentUserName={state.user.name || ""}
                  currentUserId={state.user.id}
                  excelData={excelData}
                  setExcelData={setExcelData}
                  excelError={excelError}
                  setExcelError={setExcelError}
                  excelValidationErrors={excelValidationErrors}
                  setExcelValidationErrors={setExcelValidationErrors}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <GoodsReceiptStats stats={stats} loading={loading} />

            {/* Goods Receipts Table */}
            <GoodsReceiptTable
              goodsReceipts={filteredGRs}
              loading={loading.goodsReceipts}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
