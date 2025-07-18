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
                goodsReceipts.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-medium">{gr.id}</TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto">
                        {gr.purchaseOrderId}
                      </Button>
                    </TableCell>
                    <TableCell>{gr.supplierName}</TableCell>
                    <TableCell>{(gr.items || []).length} sản phẩm</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(gr.totalReceivedValue)}
                    </TableCell>
                    <TableCell>{formatDate(gr.receiptDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(gr)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
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
    </Card>
  );
} 