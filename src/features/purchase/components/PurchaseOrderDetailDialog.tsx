import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { formatPrice, formatDate } from "../../../services/api";
import { PurchaseOrder } from "../types";

interface PurchaseOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
}

export default function PurchaseOrderDetailDialog({
  open,
  onOpenChange,
  purchaseOrder,
}: PurchaseOrderDetailDialogProps) {
  if (!purchaseOrder) return null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", className: "bg-gray-300 text-gray-900" },
      sent: { label: "Đã gửi", className: "bg-blue-200 text-blue-900" },
      confirmed: { label: "Đã xác nhận", className: "bg-indigo-500 text-white" },
      partially_received: {
        label: "Nhập một phần",
        className: "bg-yellow-300 text-yellow-900"
      },
      completed: { label: "Hoàn thành", className: "bg-green-600 text-white" },
      cancelled: { label: "Đã hủy", className: "bg-red-500 text-white" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo?.className || "bg-gray-200 text-gray-800"}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết phiếu đặt hàng {purchaseOrder.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nhà cung cấp</Label>
              <div className="font-medium">{purchaseOrder.supplierName}</div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <div>{getStatusBadge(purchaseOrder.status)}</div>
            </div>
            <div>
              <Label>Ngày tạo</Label>
              <div>{formatDate(purchaseOrder.orderDate)}</div>
            </div>
            <div>
              <Label>Ngày giao dự kiến</Label>
              <div>
                {purchaseOrder.expectedDeliveryDate
                  ? formatDate(purchaseOrder.expectedDeliveryDate)
                  : "Chưa xác định"}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label>Danh sách sản phẩm</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Màu/Size</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đơn giá</TableHead>
                  <TableHead>Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>
                      {item.MaMau && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            
                          />
                          {item.MaKichThuoc}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right mt-4">
              <div className="text-lg font-bold">
                Tổng cộng: {formatPrice(purchaseOrder.totalAmount)}
              </div>
            </div>
          </div>

          {purchaseOrder.notes && (
            <div>
              <Label>Ghi chú</Label>
              <div className="bg-muted p-3 rounded">
                {purchaseOrder.notes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 