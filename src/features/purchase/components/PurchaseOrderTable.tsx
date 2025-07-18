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
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Mã phiếu</TableHead>
                  <TableHead className="whitespace-nowrap">Nhà cung cấp</TableHead>
                  <TableHead className="whitespace-nowrap">Số lượng SP</TableHead>
                  <TableHead className="whitespace-nowrap">Tổng tiền</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
                  <TableHead className="whitespace-nowrap">Ngày giao dự kiến</TableHead>
                  <TableHead className="whitespace-nowrap">Thao tác</TableHead>
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
                      <TableCell className="font-medium whitespace-nowrap">{po.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">{po.supplierName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {po.supplierId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{po.items.length} sản phẩm</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatPrice(po.totalAmount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(po.orderDate)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {po.expectedDeliveryDate
                          ? formatDate(po.expectedDeliveryDate)
                          : "Chưa xác định"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
} 