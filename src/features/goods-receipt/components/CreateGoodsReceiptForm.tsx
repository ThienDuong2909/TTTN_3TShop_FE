import { useState } from "react";
import { CheckCircle, AlertTriangle, Edit, FileSpreadsheet, Save, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { formatPrice, formatDate } from "../../../services/api";
import ExcelImport from "./ExcelImport";

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

interface PurchaseOrder {
  id?: string;
  MaPDH?: string;
  supplierId?: string;
  MaNCC?: number;
  supplierName?: string;
  NhaCungCap?: {
    MaNCC: number;
    TenNCC: string;
    DiaChi?: string;
    SDT?: string;
    Email?: string;
  };
  orderDate?: string;
  NgayDat?: string;
  status?: string;
  TrangThaiDatHangNCC?: {
    MaTrangThai: number;
    TenTrangThai: string;
  };
  totalAmount?: number;
  items?: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
  }>;
  CT_PhieuDatHangNCCs?: Array<{
    MaCTSP: string;
    TenSP: string;
    SoLuong: number;
    DonGia: number;
    [key: string]: any;
  }>;
}

interface GRForm {
  purchaseOrderId: string;
  receivedBy: string;
  notes: string;
  items: Omit<GoodsReceiptItem, "totalReceivedValue">[];
}

interface CreateGoodsReceiptFormProps {
  grForm: GRForm;
  setGRForm: (form: GRForm) => void;
  availablePOs: any[];
  selectedPO: any | null;
  onPOSelect: (poId: string) => void;
  onCreateGR: () => void;
  onCancel: () => void;
  loading: {
    purchaseOrders: boolean;
    creating: boolean;
  };
  currentUserName: string;
  currentUserId: string;
}

export default function CreateGoodsReceiptForm({
  grForm,
  setGRForm,
  availablePOs,
  selectedPO,
  onPOSelect,
  onCreateGR,
  onCancel,
  loading,
  currentUserName,
  currentUserId,
}: CreateGoodsReceiptFormProps) {
  const [inputMethod, setInputMethod] = useState<"manual" | "excel">("manual");
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelError, setExcelError] = useState<string>("");

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      good: { label: "Tốt", variant: "default" as const, icon: CheckCircle },
      damaged: {
        label: "Hư hỏng",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
      defective: {
        label: "Lỗi",
        variant: "destructive" as const,
        icon: AlertTriangle,
      },
    };

    const conditionInfo = conditionMap[condition as keyof typeof conditionMap];
    const Icon = conditionInfo?.icon || CheckCircle;

    return (
      <Badge variant={conditionInfo?.variant || "secondary"}>
        <Icon className="w-3 h-3 mr-1" />
        {conditionInfo?.label || condition}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "default" as const },
      pending: { label: "Chờ xử lý", variant: "secondary" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const updateGRItem = (
    index: number,
    field: keyof Omit<GoodsReceiptItem, "totalReceivedValue">,
    value: any
  ) => {
    const newItems = [...(grForm.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setGRForm({ ...grForm, items: newItems });
  };

  const calculateTotalReceived = () => {
    return (grForm.items || []).reduce(
      (sum, item) => sum + item.receivedQuantity * item.unitPrice,
      0
    );
  };

  const handleExcelDataProcessed = (items: Omit<GoodsReceiptItem, "totalReceivedValue">[]) => {
    setGRForm({
      ...grForm,
      items: items,
    });
  };

  const resetForm = () => {
    setGRForm({
      purchaseOrderId: "",
      receivedBy: currentUserId,
      notes: "",
      items: [],
    });
    setExcelData([]);
    setExcelError("");
    setInputMethod("manual");
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseOrder">Phiếu đặt hàng *</Label>
          <Select
            value={grForm.purchaseOrderId}
            onValueChange={onPOSelect}
            disabled={loading.purchaseOrders}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn phiếu đặt hàng" />
            </SelectTrigger>
            <SelectContent>
              {availablePOs.map((po: any) => (
                <SelectItem key={po.MaPDH || po.id} value={po.MaPDH || po.id}>
                  {po.MaPDH || po.id} - {po.NhaCungCap?.TenNCC || po.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="receivedBy">Người nhận hàng</Label>
          <Input id="receivedBy" value={currentUserName} disabled />
        </div>
      </div>

      {/* Purchase Order Info */}
      {selectedPO && (
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label>Nhà cung cấp</Label>
                <div className="font-medium">{selectedPO?.supplierName || "N/A"}</div>
              </div>
              <div>
                <Label>Ngày đặt</Label>
                <div>{formatDate(selectedPO?.orderDate || new Date())}</div>
              </div>
              <div>
                <Label>Tổng tiền đặt</Label>
                <div className="font-medium">
                  {formatPrice(selectedPO?.totalAmount || 0)}
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div>{getStatusBadge(selectedPO?.status || "unknown")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Method Selection */}
      <div>
        <Label>Phương thức nhập dữ liệu *</Label>
        <Tabs
          value={inputMethod}
          onValueChange={(value: string) =>
            setInputMethod(value as "manual" | "excel")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Nhập tay
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            {selectedPO && (grForm.items || []).length > 0 && (
              <div>
                <Label>Kiểm tra số lượng nhận hàng *</Label>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Màu/Size</TableHead>
                        <TableHead>Đặt hàng</TableHead>
                        <TableHead>Nhận thực tế</TableHead>
                        <TableHead>Tình trạng</TableHead>
                        <TableHead>Thành tiền</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(grForm.items || []).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell>
                            {item.selectedColor && (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{
                                    backgroundColor: item.selectedColor,
                                  }}
                                />
                                {item.selectedSize}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.orderedQuantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.receivedQuantity}
                              onChange={(e) =>
                                updateGRItem(
                                  index,
                                  "receivedQuantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              min="0"
                              max={item.orderedQuantity}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.condition}
                              onValueChange={(value: string) =>
                                updateGRItem(index, "condition", value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">Tốt</SelectItem>
                                <SelectItem value="damaged">Hư hỏng</SelectItem>
                                <SelectItem value="defective">Lỗi</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(item.receivedQuantity * item.unitPrice)}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.notes || ""}
                              onChange={(e) =>
                                updateGRItem(index, "notes", e.target.value)
                              }
                              placeholder="Ghi chú..."
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 text-right border-t">
                    <div className="text-lg font-bold">
                      Tổng tiền nhận: {formatPrice(calculateTotalReceived())}
                    </div>
                  </div>
                </Card>
              </div>
            )}
            {selectedPO && (grForm.items || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Chọn phiếu đặt hàng để hiển thị danh sách sản phẩm
              </div>
            )}
          </TabsContent>

          <TabsContent value="excel" className="mt-4">
            <div className="space-y-4">
              <ExcelImport
                selectedPO={selectedPO}
                onDataProcessed={handleExcelDataProcessed}
                excelData={excelData}
                excelError={excelError}
                onExcelDataChange={setExcelData}
                onExcelErrorChange={setExcelError}
              />

              {/* Preview Excel Data */}
              {(grForm.items || []).length > 0 && (
                <div>
                  <Label>Xem trước dữ liệu từ Excel</Label>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Màu/Size</TableHead>
                          <TableHead>Đặt hàng</TableHead>
                          <TableHead>Nhận thực tế</TableHead>
                          <TableHead>Tình trạng</TableHead>
                          <TableHead>Thành tiền</TableHead>
                          <TableHead>Ghi chú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(grForm.items || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.productName}
                            </TableCell>
                            <TableCell>
                              {item.selectedColor && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded border"
                                    style={{
                                      backgroundColor: item.selectedColor,
                                    }}
                                  />
                                  {item.selectedSize}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.orderedQuantity}</TableCell>
                            <TableCell className="font-medium">
                              {item.receivedQuantity}
                            </TableCell>
                            <TableCell>
                              {getConditionBadge(item.condition)}
                            </TableCell>
                            <TableCell>
                              {formatPrice(item.receivedQuantity * item.unitPrice)}
                            </TableCell>
                            <TableCell>{item.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 text-right border-t">
                      <div className="text-lg font-bold">
                        Tổng tiền nhận: {formatPrice(calculateTotalReceived())}
                      </div>
                    </div>
                  </Card>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>Lưu ý:</strong> Dữ liệu Excel đã được import
                      thành công. Vui lòng kiểm tra kỹ thông tin trước khi xác
                      nhận nhập kho.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="grNotes">Ghi chú nhập kho</Label>
        <Textarea
          id="grNotes"
          value={grForm.notes}
          onChange={(e) => setGRForm({ ...grForm, notes: e.target.value })}
          placeholder="Ghi chú về tình trạng hàng nhận, vấn đề phát sinh..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading.creating}
        >
          Hủy
        </Button>
        <Button
          onClick={onCreateGR}
          disabled={loading.creating}
          className="bg-brand-600 hover:bg-brand-700"
        >
          {loading.creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Xác nhận nhập kho
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 