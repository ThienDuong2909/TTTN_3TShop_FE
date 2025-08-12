import { Eye, Download, Loader2 } from "lucide-react";
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
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { useNavigate } from "react-router-dom";

// Ensure background color is a valid CSS color (fix cases like '##FF0000' or 'FF0000')
function normalizeDisplayColor(input?: string): string {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  // If looks like hex (with or without #), coerce to single-# 6-hex format
  const hexMatch = trimmed.match(/^#?[0-9a-fA-F]{6}$/);
  if (hexMatch) {
    const withoutHashes = trimmed.replace(/^#+/, "");
    return `#${withoutHashes}`;
  }
  // Otherwise return original string (handles rgb(), hsl(), named css colors)
  return trimmed.replace(/^##+/, "#");
}

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
  colorName?: string; // thêm dòng này
}

interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  items: GoodsReceiptItem[];
  status: "draft" | "completed";
  totalReceivedValue: number;
  receiptDate: string;
  receivedBy: string;
  notes?: string;
}

interface GoodsReceiptTableProps {
  goodsReceipts: GoodsReceipt[];
  loading: boolean;
  onViewDetails: (gr: GoodsReceipt) => void;
}

export default function GoodsReceiptTable({ 
  goodsReceipts, 
  loading, 
  onViewDetails 
}: GoodsReceiptTableProps) {
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  const navigate = useNavigate();

  const handleViewDetails = (gr: GoodsReceipt) => {
    setSelectedGR(gr);
    setOpenDetail(true);
  };

  const handleViewPODetails = (purchaseOrderId: string) => {
    // Chuyển sang trang Purchase Orders với tham số để mở dialog chi tiết
    navigate(`/admin/purchase-orders?view=${purchaseOrderId}`);
  };

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
          Danh sách phiếu nhập hàng ({goodsReceipts.length})
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
                <TableHead>Đơn đặt hàng</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Số lượng SP</TableHead>
                <TableHead>Giá trị nhận</TableHead>
                <TableHead>Ngày nhập</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goodsReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không có phiếu nhập hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                goodsReceipts
                  .sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime())
                  .map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-medium">{gr.id}</TableCell>
                    <TableCell>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto"
                        onClick={() => handleViewPODetails(gr.purchaseOrderId)}
                      >
                        {gr.purchaseOrderId}
                      </Button>
                    </TableCell>
                    <TableCell>{gr.supplierName}</TableCell>
                    <TableCell>
                      {gr.items.reduce((acc, item) => acc + item.receivedQuantity, 0)} sản phẩm
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(gr.totalReceivedValue)}
                    </TableCell>
                    <TableCell>{formatDate(gr.receiptDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(gr)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Dialog chi tiết phiếu nhập */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết phiếu nhập</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết phiếu nhập hàng và các sản phẩm đã nhận.
            </DialogDescription>
          </DialogHeader>
          {selectedGR && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><b>Mã phiếu:</b> {selectedGR.id}</div>
                <div><b>Đơn đặt hàng:</b> {selectedGR.purchaseOrderId}</div>
                <div><b>Nhà cung cấp:</b> {selectedGR.supplierName}</div>
                <div><b>Người nhận:</b> {selectedGR.receivedBy}</div>
                <div><b>Ngày nhập:</b> {formatDate(selectedGR.receiptDate)}</div>
                <div><b>Tổng giá trị nhận:</b> {formatPrice(selectedGR.totalReceivedValue)}</div>
                {selectedGR.notes && <div className="col-span-2"><b>Ghi chú:</b> {selectedGR.notes}</div>}
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Màu</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGR.items.map((item, idx) => (
                      <TableRow key={item.purchaseOrderItemId || idx}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          {item.selectedColor && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ 
                                  backgroundColor: normalizeDisplayColor(item.selectedColor) || undefined,
                                  borderColor: item.selectedColor ? '#e5e7eb' : '#d1d5db'
                                }}
                              />
                              <span>{item.colorName}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.selectedSize}</TableCell>
                        <TableCell>{item.receivedQuantity}</TableCell>
                        <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell>{formatPrice(item.unitPrice * item.receivedQuantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 