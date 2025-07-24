import { useState, useEffect } from "react";
import { Edit, FileSpreadsheet, Save, Loader2 } from "lucide-react";
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
import { formatPrice, formatDate, getPurchaseOrderReceivedStatus } from "../../../services/api";
import ExcelImport from "./ExcelImport";
import clsx from "clsx";

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
  excelData: any[];
  setExcelData: (data: any[]) => void;
  excelError: string;
  setExcelError: (error: string) => void;
}

import { getStatusFromTrangThai } from "../hooks/useGoodsReceiptData";

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
  excelData,
  setExcelData,
  excelError,
  setExcelError,
}: CreateGoodsReceiptFormProps) {
  const [inputMethod, setInputMethod] = useState<"manual" | "excel">("manual");
  const [hasExcelData, setHasExcelData] = useState(false);

  // Validate form
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const isFieldInvalid = (field: string, value: any) => {
    if (!touched[field]) return false;
    if (typeof value === 'string') return !value.trim();
    if (typeof value === 'number') return value === 0;
    return !value;
  };

  // const getConditionBadge = (condition: string) => {
  //   const conditionMap = {
  //     good: { label: "Tốt", variant: "default" as const, icon: CheckCircle },
  //     damaged: {
  //       label: "Hư hỏng",
  //       variant: "destructive" as const,
  //       icon: AlertTriangle,
  //     },
  //     defective: {
  //       label: "Lỗi",
  //       variant: "destructive" as const,
  //       icon: AlertTriangle,
  //     },
  //   };

  //   const conditionInfo = conditionMap[condition as keyof typeof conditionMap];
  //   const Icon = conditionInfo?.icon || CheckCircle;

  //   return (
  //     <Badge variant={conditionInfo?.variant || "secondary"}>
  //       <Icon className="w-3 h-3 mr-1" />
  //       {conditionInfo?.label || condition}
  //     </Badge>
  //   );
  // };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", className: "bg-gray-300 text-gray-900" },
      sent: { label: "Đã gửi", className: "bg-blue-200 text-blue-900" },
      confirmed: { label: "Đã xác nhận", className: "bg-indigo-500 text-white" },
      partially_received: { // Sửa key và label
        label: "Đã gửi một phần",
        className: "bg-yellow-300 text-yellow-900"
      },
      completed: { label: "Hoàn thành", className: "bg-green-600 text-white" },
      cancelled: { label: "Đã hủy", className: "bg-red-500 text-white" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge className={statusInfo?.className || "bg-gray-300 text-gray-900"}>
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
    setHasExcelData(true);
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
    setHasExcelData(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // Thay thế onPOSelect để khởi tạo lại danh sách sản phẩm nhận khi chọn phiếu đặt hàng
  const handlePOSelect = (poId: string) => {
    const po = availablePOs.find(po => po.MaPDH === poId || po.id === poId);
    if (po) {
      console.log(po);
      setGRForm({
        ...grForm,
        purchaseOrderId: poId,
        items: (po.CT_PhieuDatHangNCCs || []).map((ct: any) => ({
          purchaseOrderItemId: ct.MaCTSP,
          productId: ct.MaCTSP,
          productName: ct.ChiTietSanPham?.SanPham?.TenSP || ct.TenSP || "",
          selectedColor: ct.ChiTietSanPham?.Mau?.MaHex ? `#${ct.ChiTietSanPham.Mau.MaHex}` : (ct.Mau?.MaHex ? `#${ct.Mau.MaHex}` : ""),
          colorName: ct.ChiTietSanPham?.Mau?.TenMau || ct.Mau?.TenMau || "",
          selectedSize: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || ct.KichThuoc?.TenKichThuoc || "",
          orderedQuantity: ct.SoLuong,
          receivedQuantity: 0, // Để trống để người dùng nhập
          unitPrice: parseFloat(ct.DonGia),
          condition: "good",
          notes: "",
        }))
      });
      // Reset Excel data khi chọn PO mới
      setExcelData([]);
      setExcelError("");
      setHasExcelData(false);
    }
    onPOSelect(poId);
  };

  // State để lưu trạng thái nhập hàng thực tế của từng sản phẩm
  const [receivedStatus, setReceivedStatus] = useState<any[]>([]);
  const [quantityErrors, setQuantityErrors] = useState<{[key: number]: string}>({});

  // Khi chọn phiếu đặt hàng, load trạng thái nhập hàng thực tế
  useEffect(() => {
    const fetchReceivedStatus = async () => {
      if (grForm.purchaseOrderId) {
        try {
          const status = await getPurchaseOrderReceivedStatus(grForm.purchaseOrderId);
          console.log('API /purchase-orders/:id/received-status response:', status);
          setReceivedStatus(Array.isArray(status?.data) ? status.data : []);
        } catch (e) {
          setReceivedStatus([]);
        }
      } else {
        setReceivedStatus([]);
      }
    };
    fetchReceivedStatus();
  }, [grForm.purchaseOrderId]);

  // Hàm lấy số còn lại phải nhập cho 1 sản phẩm (theo MaCTSP)
  const getRemainingQuantity = (maCTSP: string | number) => {
    const found = receivedStatus.find((item: any) => String(item.MaCTSP) === String(maCTSP));
    return found ? found.SoLuongConLai : 0;
  };

  // Validate số lượng thực tế khi nhập tay
  const handleReceivedQuantityChange = (index: number, value: number) => {
    const item = grForm.items[index];
    const remainingFromAPI = getRemainingQuantity(item.purchaseOrderItemId);

    // Tổng số đã nhập cho sản phẩm này trong form (trừ dòng hiện tại)
    const totalEnteredOtherRows = grForm.items.reduce((sum, it, idx) => {
      if (idx !== index && String(it.purchaseOrderItemId) === String(item.purchaseOrderItemId)) {
        return sum + (it.receivedQuantity || 0);
      }
      return sum;
    }, 0);

    // Số còn lại thực sự cho dòng này
    const realRemaining = (remainingFromAPI ?? 0) - totalEnteredOtherRows;

    let error = '';
    if (value <= 0) {
      error = 'Số lượng phải lớn hơn 0';
    } else if (realRemaining >= 0 && value > realRemaining) {
      error = `Số lượng tối đa có thể nhập: ${realRemaining}`;
    }
    setQuantityErrors(prev => ({ ...prev, [index]: error }));
    if (!error) {
      updateGRItem(index, 'receivedQuantity', value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseOrder">Phiếu đặt hàng *</Label>
          <Select
            value={grForm.purchaseOrderId}
            onValueChange={handlePOSelect}
            disabled={loading.purchaseOrders}
          >
            <SelectTrigger
              className={clsx(isFieldInvalid('purchaseOrderId', grForm.purchaseOrderId) && 'border-red-500', 'focus:outline-none')}
              onBlur={() => setTouched(t => ({...t, purchaseOrderId: true}))}
            >
              <SelectValue placeholder="Chọn phiếu đặt hàng" />
            </SelectTrigger>
            <SelectContent>
              {availablePOs.length === 0 ? (
                <div className="px-4 py-2 text-muted-foreground">Không có dữ liệu</div>
              ) : (
                availablePOs.map((po: any) => (
                  <SelectItem key={po.MaPDH || po.id} value={po.MaPDH || po.id}>
                    {po.MaPDH || po.id} - {po.NhaCungCap?.TenNCC || po.supplierName}
                  </SelectItem>
                ))
              )}
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
                <div className="font-medium">{selectedPO?.NhaCungCap?.TenNCC || "N/A"}</div>
              </div>
              <div>
                <Label>Ngày đặt</Label>
                <div>{formatDate(selectedPO?.NgayDat || new Date())}</div>
              </div>
              <div>
                <Label>Tổng tiền đặt</Label>
                <div className="font-medium">
                  {formatPrice(
                    (selectedPO?.CT_PhieuDatHangNCCs || []).reduce(
                      (sum: number, ct: any) => sum + (parseFloat(ct.DonGia) * ct.SoLuong),
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div>{getStatusBadge(getStatusFromTrangThai(selectedPO?.MaTrangThai) || "draft")}</div>
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
          onValueChange={(value: string) => {
            setInputMethod(value as "manual" | "excel");
            // Nếu chuyển từ Excel sang Manual và chưa có dữ liệu Excel, reset items
            if (value === "manual" && !hasExcelData && selectedPO) {
              const po = availablePOs.find(po => po.MaPDH === selectedPO.MaPDH || po.id === selectedPO.id);
              if (po) {
                setGRForm({
                  ...grForm,
                  items: (po.CT_PhieuDatHangNCCs || []).map((ct: any) => ({
                    purchaseOrderItemId: ct.MaCTSP,
                    productId: ct.MaCTSP,
                    productName: ct.ChiTietSanPham?.SanPham?.TenSP || ct.TenSP || "",
                    selectedColor: ct.ChiTietSanPham?.Mau?.MaHex ? `#${ct.ChiTietSanPham.Mau.MaHex}` : (ct.Mau?.MaHex ? `#${ct.Mau.MaHex}` : ""),
                    colorName: ct.ChiTietSanPham?.Mau?.TenMau || ct.Mau?.TenMau || "",
                    selectedSize: ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc || ct.KichThuoc?.TenKichThuoc || "",
                    orderedQuantity: ct.SoLuong,
                    receivedQuantity: 0,
                    unitPrice: parseFloat(ct.DonGia),
                    condition: "good",
                    notes: "",
                  }))
                });
              }
            }
          }}
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
                        <TableHead>Màu</TableHead>
                        <TableHead>Kích thước</TableHead>
                        <TableHead>Đặt hàng</TableHead>
                        <TableHead>Nhận thực tế</TableHead>
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
                                  style={{ backgroundColor: item.selectedColor }}
                                />
                                <span>{item.colorName}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.selectedSize}
                          </TableCell>
                          <TableCell>{item.orderedQuantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.receivedQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                handleReceivedQuantityChange(index, val);
                              }}
                              onBlur={() => setTouched(t => ({...t, [`receivedQuantity_${index}`]: true}))}
                              min="1"
                              max={getRemainingQuantity(item.purchaseOrderItemId) || item.orderedQuantity}
                              className={clsx("w-20 focus:outline-none", (isFieldInvalid(`receivedQuantity_${index}`, item.receivedQuantity) || quantityErrors[index]) && 'border-red-500')}
                            />
                            {quantityErrors[index] && (
                              <div className="text-xs text-red-500 mt-1">{quantityErrors[index]}</div>
                            )}
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
                              className="w-32 focus:outline-none"
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
              {hasExcelData && excelData.length > 0 && !excelError && (grForm.items || []).length > 0 && (
                <div>
                  <Label>Xem trước dữ liệu từ Excel</Label>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Màu</TableHead>
                          <TableHead>Kích thước</TableHead>
                          <TableHead>Đặt hàng</TableHead>
                          <TableHead>Nhận thực tế</TableHead>
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
                                    style={{ backgroundColor: item.selectedColor }}
                                  />
                                  <span>{item.colorName || item.selectedColor}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.selectedSize}
                            </TableCell>
                            <TableCell>{item.orderedQuantity}</TableCell>
                            <TableCell className="font-medium">
                              {item.receivedQuantity}
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