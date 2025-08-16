import { useState, useEffect } from "react";
import {
  RotateCcw,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Minus,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { createReturnSlip } from "../services/api";

interface Product {
  MaCTDDH: number;
  SanPham: {
    MaSP: number;
    TenSP: string;
    AnhSP: string;
    KichThuoc: string;
    MauSac: string;
  };
  SoLuong: number;
  DonGia: number;
  ThanhTien: number;
}

interface Order {
  MaDDH: number;
  NgayTao: string;
  TrangThai: { Ma: number; Ten: string };
  TongTien: number;
  DiaChiGiao: string;
  SDTNguoiNhan: string;
  TenNguoiNhan: string;
  items: Product[];
}

interface ReturnRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onReturnRequested: () => void;
}

interface ReturnItem {
  MaCTDDH: number;
  selected: boolean;
  returnQuantity: number;
}

export function ReturnRequestDialog({
  isOpen,
  onClose,
  order,
  onReturnRequested,
}: ReturnRequestDialogProps) {
  const { toast } = useToast();
  const [returnReason, setReturnReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>(() =>
    (order?.items || []).map((item) => ({
      MaCTDDH: item.MaCTDDH,
      selected: true, // Select all items by default
      returnQuantity: item.SoLuong, // Default to full quantity
    }))
  );

  // Initialize return items when order changes
  useEffect(() => {
    if (order?.items && Array.isArray(order.items)) {
      setReturnItems(
        order.items.map((item) => ({
          MaCTDDH: item.MaCTDDH,
          selected: true,
          returnQuantity: item.SoLuong,
        }))
      );
    }
  }, [order?.items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions for return item management
  const toggleItemSelection = (MaCTDDH: number) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.MaCTDDH === MaCTDDH ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateReturnQuantity = (MaCTDDH: number, quantity: number) => {
    if (!order) return;

    const originalItem = order.items.find((item) => item.MaCTDDH === MaCTDDH);
    if (!originalItem) return;

    const validQuantity = Math.max(1, Math.min(quantity, originalItem.SoLuong));

    setReturnItems((prev) =>
      prev.map((item) =>
        item.MaCTDDH === MaCTDDH
          ? { ...item, returnQuantity: validQuantity }
          : item
      )
    );
  };

  // Calculate total refund amount for selected items
  const calculateTotalRefund = () => {
    if (!order) return 0;

    return returnItems.reduce((total, returnItem) => {
      if (!returnItem.selected) return total;

      const originalItem = order.items.find(
        (item) => item.MaCTDDH === returnItem.MaCTDDH
      );
      if (!originalItem) return total;

      const refundAmount = originalItem.DonGia * returnItem.returnQuantity;
      return total + refundAmount;
    }, 0);
  };

  // Select/Deselect all items
  const toggleSelectAll = () => {
    const allSelected = returnItems.every((item) => item.selected);
    setReturnItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: !allSelected,
      }))
    );
  };

  const handleSubmit = async () => {
    if (!order) return;

    // Validation
    const selectedItems = returnItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một sản phẩm để trả hàng",
        variant: "destructive",
      });
      return;
    }

    if (!returnReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do trả hàng",
        variant: "destructive",
      });
      return;
    }

    if (returnReason.trim().length < 10) {
      toast({
        title: "Lỗi",
        description: "Lý do trả hàng phải có ít nhất 10 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare return request data for API
      const returnRequestData = {
        maDDH: order.MaDDH,
        danhSachSanPham: selectedItems.map((returnItem) => ({
          maCTDDH: returnItem.MaCTDDH,
          soLuongTra: returnItem.returnQuantity,
        })),
        lyDo: returnReason.trim(),
        trangThaiPhieu: 1,
      };

      console.log("Creating return request:", returnRequestData);
      console.log("Selected items:", selectedItems);
      console.log("Return reason:", returnReason.trim());

      // Call API to create return request
      const result = await createReturnSlip(returnRequestData);

      console.log("API Response:", result);

      if (result && result.success) {
        toast({
          title: "Thành công",
          description: `Yêu cầu trả hàng đã được gửi thành công cho ${selectedItems.length} sản phẩm. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.`,
        });

        onReturnRequested();
        handleClose();
      } else {
        throw new Error(
          result?.message || "Có lỗi xảy ra khi gửi yêu cầu trả hàng"
        );
      }
    } catch (error) {
      console.error("Error creating return request:", error);

      // Enhanced error handling with proper type checking
      let errorMessage =
        "Có lỗi xảy ra khi gửi yêu cầu trả hàng. Vui lòng thử lại.";

      if (error && typeof error === "object" && "response" in error) {
        // Axios error with response
        const axiosError = error as any;
        errorMessage =
          axiosError.response?.data?.message ||
          `Lỗi ${axiosError.response?.status}: ${axiosError.response?.statusText}`;
      } else if (error && typeof error === "object" && "request" in error) {
        // Request was made but no response received
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
      } else if (error instanceof Error) {
        // Other error
        errorMessage = error.message;
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReturnReason("");
      if (order) {
        setReturnItems(
          order.items.map((item) => ({
            MaCTDDH: item.MaCTDDH,
            selected: true,
            returnQuantity: item.SoLuong,
          }))
        );
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen && !!order} onOpenChange={handleClose}>
      {order && (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Yêu cầu trả hàng - Đơn hàng #{order.MaDDH}
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do trả hàng chi tiết để chúng tôi có thể xử
              lý yêu cầu của bạn một cách nhanh chóng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Information */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Thông tin đơn hàng
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mã đơn hàng:</span>
                  <div className="font-medium">#{order.MaDDH}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày đặt:</span>
                  <div className="font-medium">{formatDate(order.NgayTao)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <div className="font-medium text-green-600">
                    {formatCurrency(order.TongTien)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <Badge variant="default" className="ml-2">
                    {order.TrangThai.Ten}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Products to Return */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Chọn sản phẩm cần trả (
                  {returnItems.filter((item) => item.selected).length}/
                  {order?.items?.length || 0})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {returnItems.every((item) => item.selected)
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              </div>
              <div className="space-y-3">
                {(order?.items || []).map((item) => {
                  const returnItem = returnItems.find(
                    (ri) => ri.MaCTDDH === item.MaCTDDH
                  ) || {
                    MaCTDDH: item.MaCTDDH,
                    selected: true,
                    returnQuantity: item.SoLuong,
                  };
                  return (
                    <div
                      key={item.MaCTDDH}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        returnItem.selected
                          ? "border-blue-300 bg-blue-50/50"
                          : "border-gray-200"
                      }`}
                    >
                      <Checkbox
                        checked={returnItem.selected}
                        onCheckedChange={() =>
                          toggleItemSelection(item.MaCTDDH)
                        }
                        className="mt-2"
                      />

                      <img
                        src={item.SanPham.AnhSP}
                        alt={item.SanPham.TenSP}
                        className="w-16 h-16 object-cover rounded"
                      />

                      <div className="flex-1">
                        <div className="font-medium">{item.SanPham.TenSP}</div>
                        <div className="text-sm text-muted-foreground">
                          Màu: {item.SanPham.MauSac} • Size:{" "}
                          {item.SanPham.KichThuoc}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Đã mua: {item.SoLuong} × {formatCurrency(item.DonGia)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium">
                          {formatCurrency(
                            item.DonGia * returnItem.returnQuantity
                          )}
                        </div>

                        {returnItem.selected && (
                          <div className="flex items-center gap-1">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Số lượng trả:
                            </Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={returnItem.returnQuantity <= 1}
                                onClick={() =>
                                  updateReturnQuantity(
                                    item.MaCTDDH,
                                    returnItem.returnQuantity - 1
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <Input
                                type="number"
                                min="1"
                                max={item.SoLuong}
                                value={returnItem.returnQuantity}
                                onChange={(e) =>
                                  updateReturnQuantity(
                                    item.MaCTDDH,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="h-6 w-12 text-center text-xs px-1"
                              />

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={
                                  returnItem.returnQuantity >= item.SoLuong
                                }
                                onClick={() =>
                                  updateReturnQuantity(
                                    item.MaCTDDH,
                                    returnItem.returnQuantity + 1
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Return Summary */}
              <div className="flex items-center justify-between pt-3 border-t font-medium">
                <span>Tổng tiền hoàn trả:</span>
                <span className="text-lg text-green-600">
                  {formatCurrency(calculateTotalRefund())}
                </span>
              </div>

              {returnItems.filter((item) => item.selected).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Vui lòng chọn ít nhất một sản phẩm để trả hàng
                </div>
              )}
            </div>

            <Separator />

            {/* Return Reason */}
            <div className="space-y-3">
              <Label htmlFor="returnReason" className="text-base font-medium">
                Lý do trả hàng *
              </Label>
              <Textarea
                id="returnReason"
                placeholder="Vui lòng mô tả chi tiết lý do bạn muốn trả hàng (ví dụ: không vừa size, chất lượng không đúng mô tả, giao sai sản phẩm, v.v.)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                Tối thiểu 10 ký tự ({returnReason.length}/10)
              </div>
            </div>

            {/* Important Notes */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Lưu ý quan trọng:
                  </div>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Sản phẩm phải còn nguyên vẹn, chưa sử dụng</li>
                    <li>• Còn đầy đủ thẻ, nhãn mác gốc</li>
                    <li>
                      • Thời gian trả hàng trong vòng 7 ngày kể từ ngày nhận
                    </li>
                    <li>• Chúng tôi sẽ xem xét và phản hồi trong 24-48 giờ</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !order}>
              {isSubmitting ? (
                <>
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Gửi yêu cầu trả hàng
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
