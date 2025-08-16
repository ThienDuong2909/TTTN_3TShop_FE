import { Edit, Eye, Send, CheckCircle, Package, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { formatPrice, formatDate } from "../../../services/api";
import { usePermission } from "../../../components/PermissionGuard";
import { PurchaseOrder } from "../types";

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  onViewDetails: (po: PurchaseOrder) => void;
  onEdit: (po: PurchaseOrder) => void;
  onSend: (poId: string) => void;
  onConfirm: (poId: string) => void;
  onCreateReceipt: (poId: string) => void;
  loadingStates?: {
    sending?: string[];
    confirming?: string[];
    editing?: string[];
  };
}

export default function PurchaseOrderTable({
  purchaseOrders,
  loading,
  onViewDetails,
  onEdit,
  onSend,
  onConfirm,
  onCreateReceipt,
  loadingStates = {},
}: PurchaseOrderTableProps) {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("dathang.sua") || hasPermission("toanquyen");
  const canSend = hasPermission("dathang.gui") || hasPermission("toanquyen");
  const canConfirm = hasPermission("dathang.xacnhan") || hasPermission("toanquyen");
  const canCreateReceipt = hasPermission("nhaphang.tao") || hasPermission("toanquyen");
  // Sắp xếp theo ngày tạo mới nhất lên đầu
  const sortedPurchaseOrders = [...purchaseOrders].sort((a, b) => {
    const dateA = new Date(a.orderDate).getTime();
    const dateB = new Date(b.orderDate).getTime();
    return dateB - dateA; // Mới nhất lên đầu
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", className: "bg-gray-300 text-gray-900" },
      sent: { label: "Đã gửi", className: "bg-blue-200 text-blue-900" },
      confirmed: { label: "Đã xác nhận", className: "bg-indigo-500 text-white" },
      partially_received: {
        label: "Nhập một phần",
        className: "bg-yellow-200 text-yellow-900"
      },
      completed: { label: "Hoàn thành", className: "bg-green-500 text-white" },
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
    <Card>
      <CardHeader>
        <CardTitle>
          Danh sách phiếu đặt hàng ({sortedPurchaseOrders.length})
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
                  <TableHead className="whitespace-nowrap">Ngày kiến nghị giao</TableHead>
                  <TableHead className="whitespace-nowrap">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Không có phiếu đặt hàng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPurchaseOrders.map((po) => (
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
                      <TableCell className="whitespace-nowrap">
                        {po.items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatPrice(po.totalAmount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(po.orderDate)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {po.NgayKienNghiGiao
                          ? formatDate(po.NgayKienNghiGiao)
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
                                disabled={loadingStates.editing?.includes(po.id) || !canEdit}
                              >
                                {loadingStates.editing?.includes(po.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Edit className="h-3 w-3" />
                                )}
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onSend(po.id)}
                                      disabled={loadingStates.sending?.includes(po.id) || !canSend}
                                    >
                                      {loadingStates.sending?.includes(po.id) ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Send className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Gửi phiếu đặt hàng và tải file Excel</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          {po.status === "sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onConfirm(po.id)}
                              disabled={loadingStates.confirming?.includes(po.id) || !canConfirm}
                            >
                              {loadingStates.confirming?.includes(po.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                          {(po.status === "confirmed" ||
                            po.status === "partially_received") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCreateReceipt(po.id)}
                              disabled={!canCreateReceipt}
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