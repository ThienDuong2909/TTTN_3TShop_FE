import { useState, useEffect } from "react";
import {
  Package,
  Tag,
  Plus,
  Trash2,
  Search,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DotGiamGia,
  ChiTietDotGiamGia,
  formatCurrency,
  formatDate,
  calculateDiscountStatus,
} from "../lib/discountData";
import { removeProductFromPromotion } from "../services/api";
import { AddProductToDiscountDialog } from "./AddProductToDiscountDialog";
import { toast } from "sonner";

interface DiscountPeriodDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  period: DotGiamGia;
  onRefresh?: () => void; // Optional callback to refresh data
}

export function DiscountPeriodDetailDialog({
  isOpen,
  onClose,
  period,
  onRefresh,
}: DiscountPeriodDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [discountDetails, setDiscountDetails] = useState<ChiTietDotGiamGia[]>(
    []
  );
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ChiTietDotGiamGia | null>(null);
  const [calculatedStatus, setCalculatedStatus] = useState<string>("");

  // Transform period data to discount details when dialog opens or period changes
  useEffect(() => {
    if (isOpen && period) {
      // Calculate current status based on dates
      const currentStatus = calculateDiscountStatus(
        period.NgayBatDau,
        period.NgayKetThuc
      );
      setCalculatedStatus(currentStatus);

      if (period.CT_DotGiamGia) {
        const details: ChiTietDotGiamGia[] = period.CT_DotGiamGia.map(
          (item: any) => ({
            MaCTDGG: item.MaCTDGG,
            MaDot: item.MaDot,
            MaSP: item.MaSP,
            TenSP: item.SanPham?.TenSP || "",
            AnhSP:
              item.SanPham?.AnhSanPhams?.[0]?.DuongDan || "/default-image.jpg",
            GiaGoc: parseFloat(item.SanPham?.ThayDoiGia?.[0]?.Gia || "0"),
            PhanTramGiam: parseFloat(item.PhanTramGiam || "0"),
            GiaSauGiam:
              parseFloat(item.SanPham?.ThayDoiGia?.[0]?.Gia || "0") *
              (1 - parseFloat(item.PhanTramGiam || "0") / 100),
          })
        );
        setDiscountDetails(details);
      } else {
        setDiscountDetails([]);
      }
    }
  }, [isOpen, period]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Đang diễn ra": {
        label: "Đang hoạt động",
        variant: "default" as const,
        icon: CheckCircle,
      },
      "Chưa bắt đầu": {
        label: "Chưa bắt đầu",
        variant: "secondary" as const,
        icon: Clock,
      },
      "Đã kết thúc": {
        label: "Đã kết thúc",
        variant: "destructive" as const,
        icon: XCircle,
      },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;

    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Filter products based on search
  const filteredProducts = discountDetails.filter((detail) =>
    detail.TenSP?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalDiscount = () => {
    return discountDetails.reduce((total, detail) => {
      const originalPrice = detail.GiaGoc || 0;
      const discountedPrice = detail.GiaSauGiam || 0;
      return total + (originalPrice - discountedPrice);
    }, 0);
  };

  const calculateAverageDiscount = () => {
    if (discountDetails.length === 0) return 0;
    const totalPercent = discountDetails.reduce(
      (sum, detail) => sum + detail.PhanTramGiam,
      0
    );
    return totalPercent / discountDetails.length;
  };

  const handleAddProductSuccess = () => {
    setShowAddProductDialog(false);
    // Call refresh callback if provided to update parent component
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDeleteProduct = (product: ChiTietDotGiamGia) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeletingProductId(productToDelete.MaSP);
      const response = await removeProductFromPromotion(
        period.MaDot,
        productToDelete.MaSP
      );

      if (response.success) {
        // Remove the product from local state
        setDiscountDetails((prev) =>
          prev.filter((item) => item.MaSP !== productToDelete.MaSP)
        );
        toast.success("Đã xóa sản phẩm khỏi đợt giảm giá thành công");

        // Call refresh callback if provided to update parent component
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.message || "Không thể xóa sản phẩm");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Có lỗi xảy ra khi xóa sản phẩm");
    } finally {
      setDeletingProductId(null);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const cancelDeleteProduct = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Chi tiết đợt giảm giá #{period.MaDot.toString().padStart(3, "0")}
            </DialogTitle>
            <DialogDescription>
              Quản lý sản phẩm và mức giảm giá cho đợt khuyến mại
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Period Information */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-3">Thông tin đợt giảm giá</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã đợt:</span>
                      <span className="font-medium">
                        #{period.MaDot.toString().padStart(3, "0")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trạng thái:</span>
                      {getStatusBadge(calculatedStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span className="font-medium">
                        {formatDate(period.NgayBatDau)} -{" "}
                        {formatDate(period.NgayKetThuc)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Thống kê</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tổng sản phẩm:
                      </span>
                      <span className="font-medium">
                        {discountDetails.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Giảm giá trung bình:
                      </span>
                      <span className="font-medium">
                        {calculateAverageDiscount().toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tổng tiết kiệm:
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(calculateTotalDiscount())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {period.MoTa && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">Mô tả</h3>
                  <p className="text-sm text-muted-foreground">{period.MoTa}</p>
                </div>
              )}
            </div>

            {/* Actions and Search */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {calculatedStatus !== "Đã kết thúc" && (
                <Button onClick={() => setShowAddProductDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              )}
            </div>

            {/* Products Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Giá gốc</TableHead>
                    <TableHead>Giảm giá</TableHead>
                    <TableHead>Giá sau giảm</TableHead>
                    <TableHead>Tiết kiệm</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((detail) => (
                      <TableRow key={detail.MaCTDGG}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={detail.AnhSP}
                              alt={detail.TenSP}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium">{detail.TenSP}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {detail.MaSP}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(detail.GiaGoc || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-800"
                          >
                            <Percent className="h-3 w-3 mr-1" />
                            {detail.PhanTramGiam}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(detail.GiaSauGiam || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-red-600">
                            -
                            {formatCurrency(
                              (detail.GiaGoc || 0) - (detail.GiaSauGiam || 0)
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {calculatedStatus !== "Đã kết thúc" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteProduct(detail)}
                                disabled={deletingProductId === detail.MaSP}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-gray-400" />
                          <p className="text-muted-foreground">
                            {searchTerm
                              ? "Không tìm thấy sản phẩm phù hợp"
                              : "Chưa có sản phẩm nào trong đợt giảm giá này"}
                          </p>
                          {!searchTerm &&
                            calculatedStatus !== "Đã kết thúc" && (
                              <Button
                                variant="outline"
                                onClick={() => setShowAddProductDialog(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm sản phẩm đầu tiên
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
          </DialogHeader>
          {productToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Bạn có chắc chắn muốn xóa sản phẩm này khỏi đợt giảm giá không?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-sm">{productToDelete.TenSP}</p>
                <p className="text-xs text-gray-500">
                  Mã sản phẩm: {productToDelete.MaSP}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelDeleteProduct}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>{" "}
      {/* Add Product Dialog */}
      <AddProductToDiscountDialog
        isOpen={showAddProductDialog}
        onClose={() => setShowAddProductDialog(false)}
        period={period}
        onSuccess={handleAddProductSuccess}
      />
    </>
  );
}
