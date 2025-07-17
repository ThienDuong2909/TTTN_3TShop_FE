import { Edit, Eye, Send, CheckCircle, Package, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { formatPrice, formatDate } from "../../../services/api";
import { PurchaseOrder } from "../types";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  onViewDetails: (po: PurchaseOrder) => void;
  onEdit: (po: PurchaseOrder) => void;
  onSend: (poId: string) => void;
  onConfirm: (poId: string) => void;
  onCreateReceipt: (poId: string) => void;
}

export default function PurchaseOrderTable({
  purchaseOrders,
  loading,
  onViewDetails,
  onEdit,
  onSend,
  onConfirm,
  onCreateReceipt,
}: PurchaseOrderTableProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", variant: "secondary" as const },
      sent: { label: "Đã gửi", variant: "outline" as const },
      confirmed: { label: "Đã xác nhận", variant: "default" as const },
      partially_received: {
        label: "Nhập một phần",
        variant: "outline" as const,
      },
      completed: { label: "Hoàn thành", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Danh sách phiếu đặt hàng ({purchaseOrders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Số lượng SP</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Ngày giao dự kiến</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không có phiếu đặt hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{po.supplierName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {po.supplierId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{po.items.length} sản phẩm</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(po.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>{formatDate(po.orderDate)}</TableCell>
                    <TableCell>
                      {po.expectedDeliveryDate
                        ? formatDate(po.expectedDeliveryDate)
                        : "Chưa xác định"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(po)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {po.status === "draft" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(po)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSend(po.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {po.status === "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConfirm(po.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {(po.status === "confirmed" ||
                          po.status === "partially_received") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCreateReceipt(po.id)}
                          >
                            <Package className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 