import { useState, useEffect } from "react";
import {
  Edit,
  FileSpreadsheet,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import {
  formatPrice,
  formatDate,
  getPurchaseOrderReceivedStatus,
} from "../../../services/api";
import ExcelImport from "./ExcelImport";
import clsx from "clsx";
import { formatVietnameseCurrency } from "../../../lib/utils";

// Normalize hex color to ensure a single leading '#'
function normalizeHexColor(input?: string): string {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  const withoutHashes = trimmed.replace(/^#+/, "");
  return withoutHashes ? `#${withoutHashes}` : "";
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
  colorName?: string;
}

interface GRForm {
  purchaseOrderId: string;
  receivedBy: string;
  notes: string;
  items: GoodsReceiptItem[];
}

interface CreateGoodsReceiptFormProps {
  grForm: GRForm;
  setGRForm: (form: GRForm) => void;
  availablePOs: any[];
  selectedPO: any | null;
  onPOSelect: (poId: string) => void;
  onCreateGR: (form: GRForm) => void; // Sửa lại prop này
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
  excelValidationErrors?: any[];
  setExcelValidationErrors?: (errors: any[]) => void;
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
  excelValidationErrors = [],
  setExcelValidationErrors = () => {},
}: CreateGoodsReceiptFormProps) {
  const [inputMethod, setInputMethod] = useState<"manual" | "excel">("manual");
  const [hasExcelData, setHasExcelData] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<GRForm | null>(null);
  // Xóa state isPreviewModalOpen

  // Validate form
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const isFieldInvalid = (field: string, value: any) => {
    if (!touched[field]) return false;
    if (typeof value === "string") return !value.trim();
    if (typeof value === "number") return value === 0;
    return !value;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", className: "bg-gray-300 text-gray-900" },
      sent: { label: "Đã gửi", className: "bg-blue-200 text-blue-900" },
      confirmed: {
        label: "Đã xác nhận",
        className: "bg-indigo-500 text-white",
      },
      partially_received: {
        // Sửa key và label
        label: "Đã gửi một phần",
        className: "bg-yellow-300 text-yellow-900",
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
    field: keyof GoodsReceiptItem,
    value: any
  ) => {
    const newItems = [...(grForm.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setGRForm({ ...grForm, items: newItems });
  };

  const calculateTotalReceived = () => {
    // Tính tổng từ TẤT CẢ items, không lọc bỏ lỗi validation
    return (grForm.items || []).reduce((sum, item) => {
      const quantity =
        typeof item.receivedQuantity === "number" ? item.receivedQuantity : 0;
      return sum + quantity * item.unitPrice;
    }, 0);
  };

  // Function to check if a row has validation errors
  const getRowErrors = (index: number) => {
    const errors = excelValidationErrors.filter(
      (error: any) => error.row === index + 2
    ); // +2 because Excel rows start from 2
    return errors;
  };

  const handleExcelDataProcessed = (items: GoodsReceiptItem[]) => {
    console.log("=== HANDLE EXCEL DATA PROCESSED ===");
    console.log("Received items:", items);
    console.log(
      "Items unitPrice values:",
      items.map((item) => ({
        productName: item.productName,
        unitPrice: item.unitPrice,
      }))
    );

    setGRForm({
      ...grForm,
      items: items,
    });
    setHasExcelData(true);

    console.log("Updated grForm.items:", grForm.items);
  };

  // Function để lọc bỏ các dòng có lỗi trước khi gửi lên backend
  const getFilteredItemsForSubmission = () => {
    if (inputMethod === "excel" && excelValidationErrors.length > 0) {
      // Lọc bỏ các dòng có lỗi khi import Excel
      return grForm.items.filter((_, index) => {
        const rowErrors = getRowErrors(index);
        return rowErrors.length === 0; // Chỉ giữ lại dòng không có lỗi
      });
    }
    // Nếu nhập tay, chỉ lấy các item có receivedQuantity > 0
    if (inputMethod === "manual") {
      return grForm.items.filter((item) => {
        const quantity =
          typeof item.receivedQuantity === "number" ? item.receivedQuantity : 0;
        return quantity > 0;
      });
    }
    // Nếu không có lỗi hoặc không xác định, trả về tất cả items
    return grForm.items;
  };

  // Function để xử lý khi nhấn nút "Xác nhận nhập kho"
  const handleCreateGRWithFilter = () => {
    const filteredItems = getFilteredItemsForSubmission();
    const filteredForm = {
      ...grForm,
      items: filteredItems,
    };

    // Kiểm tra nếu có lỗi validation Excel và có items bị lọc bỏ
    if (
      inputMethod === "excel" &&
      excelValidationErrors.length > 0 &&
      filteredItems.length < grForm.items.length
    ) {
      setPendingFormData(filteredForm);
      setShowConfirmDialog(true);
      return;
    }

    // Nếu không có lỗi hoặc nhập tay, gửi trực tiếp
    onCreateGR(filteredForm);
  };

  const handleConfirmCreateGR = () => {
    if (pendingFormData) {
      onCreateGR(pendingFormData);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    }
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
    setExcelValidationErrors([]);
    setInputMethod("manual");
    setHasExcelData(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // Thay thế onPOSelect để khởi tạo lại danh sách sản phẩm nhận khi chọn phiếu đặt hàng
  const handlePOSelect = (poId: string) => {
    const po = availablePOs.find((po) => po.MaPDH === poId || po.id === poId);
    if (po) {
      setGRForm({
        ...grForm,
        purchaseOrderId: poId,
        items: (po.CT_PhieuDatHangNCCs || []).map((ct: any) => ({
          purchaseOrderItemId: ct.MaCTSP,
          productId: ct.MaCTSP,
          productName: ct.ChiTietSanPham?.SanPham?.TenSP || ct.TenSP || "",
          selectedColor: normalizeHexColor(
            ct.ChiTietSanPham?.Mau?.MaHex || ct.Mau?.MaHex
          ),
          colorName: ct.ChiTietSanPham?.Mau?.TenMau || ct.Mau?.TenMau || "",
          selectedSize:
            ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc ||
            ct.KichThuoc?.TenKichThuoc ||
            "",
          orderedQuantity: ct.SoLuong,
          receivedQuantity: getRemainingQuantity(ct.MaCTSP), // đặt mặc định = số lượng tối đa còn lại
          unitPrice: parseFloat(ct.DonGia),
          condition: "good",
          notes: "",
        })),
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
  const [quantityErrors, setQuantityErrors] = useState<{
    [key: number]: string;
  }>({});

  // Debug: Theo dõi thay đổi của grForm.items
  useEffect(() => {
    console.log("=== GRFORM.ITEMS CHANGED ===");
    console.log("Current grForm.items:", grForm.items);
    if (grForm.items && grForm.items.length > 0) {
      console.log(
        "Items unitPrice values:",
        grForm.items.map((item) => ({
          productName: item.productName,
          unitPrice: item.unitPrice,
          receivedQuantity: item.receivedQuantity,
          total: item.receivedQuantity * item.unitPrice,
        }))
      );
    }
  }, [grForm.items]);

  // Debug: Theo dõi thay đổi của inputMethod
  useEffect(() => {
    console.log("=== INPUT METHOD CHANGED ===");
    console.log("Current inputMethod:", inputMethod);
    console.log("Current grForm.items:", grForm.items);
  }, [inputMethod]);

  // Khi chọn phiếu đặt hàng, load trạng thái nhập hàng thực tế
  useEffect(() => {
    const fetchReceivedStatus = async () => {
      if (grForm.purchaseOrderId) {
        try {
          const status = await getPurchaseOrderReceivedStatus(
            grForm.purchaseOrderId
          );

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
    const found = receivedStatus.find(
      (item: any) => String(item.MaCTSP) === String(maCTSP)
    );
    return found ? found.SoLuongConLai : 0;
  };

  // Số lượng đã nhập = SL đặt - SL còn lại (nếu có dữ liệu trạng thái), ngược lại trả 0
  const getAlreadyReceivedQuantity = (
    maCTSP: string | number,
    orderedQuantity?: number
  ) => {
    const found = receivedStatus.find(
      (item: any) => String(item.MaCTSP) === String(maCTSP)
    );
    if (!found) return 0;
    const remaining = found.SoLuongConLai ?? 0;
    if (typeof orderedQuantity === "number") {
      const val = orderedQuantity - remaining;
      return val < 0 ? 0 : val;
    }
    return 0;
  };

  // Tự động thiết lập giá trị ban đầu = số lượng tối đa có thể nhập (chỉ khi chưa được người dùng chỉnh sửa)
  useEffect(() => {
    if (!grForm.purchaseOrderId) return;
    if (inputMethod !== "manual") return; // chỉ áp dụng cho nhập tay
    if (!receivedStatus || receivedStatus.length === 0) return; // cần dữ liệu tồn còn lại

    // Cập nhật các item có receivedQuantity hiện tại = 0 hoặc chuỗi rỗng
    const updatedItems = grForm.items.map((it) => {
      const currentVal = it.receivedQuantity as any;
      if (
        currentVal === 0 ||
        currentVal === "" ||
        currentVal === undefined ||
        currentVal === null
      ) {
        const remaining = getRemainingQuantity(it.purchaseOrderItemId);
        return {
          ...it,
          receivedQuantity: remaining > 0 ? remaining : 0,
        };
      }
      return it;
    });

    // Chỉ set state nếu có thay đổi thực sự
    const hasChange = updatedItems.some(
      (it, idx) => it.receivedQuantity !== grForm.items[idx].receivedQuantity
    );
    if (hasChange) {
      setGRForm({ ...grForm, items: updatedItems });
    }
  }, [receivedStatus, grForm.purchaseOrderId, inputMethod]);

  // Validate số lượng thực tế khi nhập tay
  const handleReceivedQuantityChange = (index: number, value: number) => {
    const item = grForm.items[index];
    const remainingFromAPI = getRemainingQuantity(item.purchaseOrderItemId);

    // Tổng số đã nhập cho sản phẩm này trong form (trừ dòng hiện tại)
    const totalEnteredOtherRows = grForm.items.reduce((sum, it, idx) => {
      if (
        idx !== index &&
        String(it.purchaseOrderItemId) === String(item.purchaseOrderItemId)
      ) {
        const quantity =
          typeof it.receivedQuantity === "number" ? it.receivedQuantity : 0;
        return sum + quantity;
      }
      return sum;
    }, 0);

    // Số còn lại thực sự cho dòng này
    const realRemaining = (remainingFromAPI ?? 0) - totalEnteredOtherRows;

    let error = "";
    if (value <= 0) {
      error = "Số lượng phải lớn hơn 0";
    } else if (realRemaining >= 0 && value > realRemaining) {
      error = `Số lượng tối đa có thể nhập: ${realRemaining}`;
    }
    setQuantityErrors((prev) => ({ ...prev, [index]: error }));
    if (!error) {
      updateGRItem(index, "receivedQuantity", value);
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
              className={clsx(
                isFieldInvalid("purchaseOrderId", grForm.purchaseOrderId) &&
                  "border-red-500",
                "focus:outline-none"
              )}
              onBlur={() =>
                setTouched((t) => ({ ...t, purchaseOrderId: true }))
              }
            >
              <SelectValue placeholder="Chọn phiếu đặt hàng" />
            </SelectTrigger>
            <SelectContent>
              {availablePOs.length === 0 ? (
                <div className="px-4 py-2 text-muted-foreground">
                  Không có dữ liệu
                </div>
              ) : (
                availablePOs.map((po: any) => (
                  <SelectItem key={po.MaPDH || po.id} value={po.MaPDH || po.id}>
                    {po.MaPDH || po.id} -{" "}
                    {po.NhaCungCap?.TenNCC || po.supplierName} -{" "}
                    {formatDate(po.NgayDat)}
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
                <div className="font-medium">
                  {selectedPO?.NhaCungCap?.TenNCC || "N/A"}
                </div>
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
                      (sum: number, ct: any) =>
                        sum + parseFloat(ct.DonGia) * ct.SoLuong,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div>
                  {getStatusBadge(
                    getStatusFromTrangThai(selectedPO?.MaTrangThai) || "draft"
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Method Selection */}
      <div>
        <Label>Phương thức nhập dữ liệu *</Label>
        {!selectedPO ? (
          <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded text-center">
            Vui lòng chọn phiếu đặt hàng trước khi nhập kho.
          </div>
        ) : (
          <Tabs
            value={inputMethod}
            onValueChange={(value: string) => {
              console.log(`Tab changed from ${inputMethod} to ${value}`);
              console.log(
                "Current grForm.items before tab change:",
                grForm.items
              );
              setInputMethod(value as "manual" | "excel");
              if (value === "manual" && selectedPO) {
                console.log("Resetting to manual input mode");
                console.log("Selected PO:", selectedPO);
                // Sử dụng selectedPO trực tiếp thay vì tìm trong availablePOs
                if (selectedPO) {
                  const newItems = (selectedPO.CT_PhieuDatHangNCCs || []).map(
                    (ct: any) => ({
                      purchaseOrderItemId: ct.MaCTSP,
                      productId: ct.MaCTSP,
                      productName:
                        ct.ChiTietSanPham?.SanPham?.TenSP || ct.TenSP || "",
                      selectedColor: normalizeHexColor(
                        ct.ChiTietSanPham?.Mau?.MaHex || ct.Mau?.MaHex
                      ),
                      colorName:
                        ct.ChiTietSanPham?.Mau?.TenMau || ct.Mau?.TenMau || "",
                      selectedSize:
                        ct.ChiTietSanPham?.KichThuoc?.TenKichThuoc ||
                        ct.KichThuoc?.TenKichThuoc ||
                        "",
                      orderedQuantity: ct.SoLuong,
                      receivedQuantity: getRemainingQuantity(ct.MaCTSP), // đặt mặc định = số lượng tối đa còn lại
                      unitPrice: parseFloat(ct.DonGia),
                      condition: "good",
                      notes: "",
                    })
                  );
                  console.log("New items for manual mode:", newItems);
                  setGRForm({
                    ...grForm,
                    items: newItems,
                  });
                  console.log("grForm updated with new items");
                }
                setHasExcelData(false);
                setExcelData([]);
                setExcelError("");
                setExcelValidationErrors([]);
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
                          <TableHead>Đã nhập</TableHead>
                          <TableHead>Nhận thực tế</TableHead>
                          <TableHead>Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(grForm.items || [])
                          .filter((item) => {
                            const already = getAlreadyReceivedQuantity(
                              item.purchaseOrderItemId,
                              item.orderedQuantity
                            );
                            return already < item.orderedQuantity; // chỉ hiển thị nếu chưa nhập đủ
                          })
                          .map((item, index) => (
                            <TableRow key={item.purchaseOrderItemId}>
                              <TableCell className="font-medium">
                                {item.productName}
                              </TableCell>
                              <TableCell>
                                {item.selectedColor && (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor:
                                          item.selectedColor || undefined,
                                        borderColor: item.selectedColor
                                          ? "#e5e7eb"
                                          : "#d1d5db",
                                      }}
                                    />
                                    <span>{item.colorName}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{item.selectedSize}</TableCell>
                              <TableCell>{item.orderedQuantity}</TableCell>
                              <TableCell>
                                {getAlreadyReceivedQuantity(
                                  item.purchaseOrderItemId,
                                  item.orderedQuantity
                                )}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.receivedQuantity}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      updateGRItem(
                                        index,
                                        "receivedQuantity",
                                        ""
                                      );
                                    } else {
                                      const val = parseInt(value);
                                      // Không cho phép số âm hoặc 0
                                      if (!isNaN(val) && val >= 0) {
                                        handleReceivedQuantityChange(
                                          index,
                                          val
                                        );
                                      }
                                      // Nếu là số âm hoặc không hợp lệ, không làm gì (giữ nguyên giá trị cũ)
                                    }
                                  }}
                                  onBlur={() =>
                                    setTouched((t) => ({
                                      ...t,
                                      [`receivedQuantity_${index}`]: true,
                                    }))
                                  }
                                  min="0"
                                  max={
                                    getRemainingQuantity(
                                      item.purchaseOrderItemId
                                    ) || item.orderedQuantity
                                  }
                                  className={clsx(
                                    "w-20 focus:outline-none",
                                    (isFieldInvalid(
                                      `receivedQuantity_${index}`,
                                      item.receivedQuantity
                                    ) ||
                                      quantityErrors[index]) &&
                                      "border-red-500"
                                  )}
                                />
                                {quantityErrors[index] && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {quantityErrors[index]}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatVietnameseCurrency(
                                  (typeof item.receivedQuantity === "number"
                                    ? item.receivedQuantity
                                    : 0) * item.unitPrice
                                )}
                              </TableCell>
                              {/* <TableCell>
                              <Input
                                value={item.notes || ""}
                                onChange={(e) =>
                                  updateGRItem(index, "notes", e.target.value)
                                }
                                placeholder="Ghi chú..."
                                className="w-32 focus:outline-none"
                              />
                            </TableCell> */}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 text-right border-t">
                      <div className="text-lg font-bold">
                        Tổng tiền nhận:{" "}
                        {formatVietnameseCurrency(calculateTotalReceived())}
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
                  onValidationErrorsChange={setExcelValidationErrors}
                />

                {/* Excel Data Summary + Chi tiết luôn hiển thị */}
                {hasExcelData &&
                  excelData.length > 0 &&
                  (grForm.items || []).length > 0 && (
                    <div className="space-y-4">
                      {/* Bảng chi tiết luôn hiển thị */}
                      <Card>
                        <div className="p-4">
                          <div className="text-base font-semibold mb-2">
                            Xem trước dữ liệu nhập kho
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>STT</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>Màu</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>SL Đặt</TableHead>
                                <TableHead>Đã nhập</TableHead>
                                <TableHead>SL Nhận</TableHead>
                                <TableHead>Đơn giá</TableHead>
                                <TableHead>Thành tiền</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(grForm.items || []).map((item, index) => {
                                const rowErrors = getRowErrors(index);
                                const hasErrors = rowErrors.length > 0;

                                // Debug logging
                                console.log(`Display Row ${index + 1}:`, {
                                  productName: item.productName,
                                  unitPrice: item.unitPrice,
                                  receivedQuantity: item.receivedQuantity,
                                  total: item.receivedQuantity * item.unitPrice,
                                });

                                return (
                                  <TableRow
                                    key={index}
                                    className={
                                      hasErrors
                                        ? "bg-red-50 border-l-4 border-red-500"
                                        : ""
                                    }
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {index + 1}
                                        {hasErrors && (
                                          <div
                                            className="w-2 h-2 bg-red-500 rounded-full"
                                            title={`${rowErrors.length} lỗi`}
                                          />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">
                                          {item.productName}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          ID: {item.productId}
                                        </div>
                                        {hasErrors && (
                                          <div className="mt-1 text-xs text-red-600">
                                            {rowErrors.map(
                                              (
                                                error: any,
                                                errorIndex: number
                                              ) => (
                                                <div key={errorIndex}>
                                                  • {error.message}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {item.selectedColor && (
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-3 h-3 rounded border"
                                            style={{
                                              backgroundColor:
                                                item.selectedColor || undefined,
                                              borderColor: item.selectedColor
                                                ? "#e5e7eb"
                                                : "#d1d5db",
                                            }}
                                          />
                                          <span className="text-sm">
                                            {item.colorName ||
                                              item.selectedColor}
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-sm">
                                        {item.selectedSize}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {item.orderedQuantity}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {getAlreadyReceivedQuantity(
                                        item.purchaseOrderItemId,
                                        item.orderedQuantity
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {item.receivedQuantity}
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        // Hiển thị đơn giá với dấu chấm ngăn cách phần nghìn
                                        const formattedPrice =
                                          item.unitPrice.toLocaleString(
                                            "vi-VN"
                                          );
                                        console.log(
                                          `Displaying unitPrice for ${item.productName}:`,
                                          {
                                            rawValue: item.unitPrice,
                                            formattedValue: formattedPrice,
                                            type: typeof item.unitPrice,
                                          }
                                        );
                                        return formattedPrice;
                                      })()}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {(() => {
                                        const quantity =
                                          typeof item.receivedQuantity ===
                                          "number"
                                            ? item.receivedQuantity
                                            : 0;
                                        const total = quantity * item.unitPrice;
                                        const formattedTotal =
                                          formatVietnameseCurrency(total);
                                        console.log(
                                          `Displaying total for ${item.productName}:`,
                                          {
                                            receivedQuantity:
                                              item.receivedQuantity,
                                            unitPrice: item.unitPrice,
                                            total: total,
                                            formattedTotal: formattedTotal,
                                          }
                                        );
                                        return formattedTotal;
                                      })()}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                          <div className="text-right mt-2">
                            <div className="text-lg font-bold">
                              Tổng giá trị:{" "}
                              {formatVietnameseCurrency(
                                calculateTotalReceived()
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Error Summary */}
      {inputMethod === "excel" && excelValidationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 text-base mb-2">
                ⛔ KHÔNG THỂ NHẬP KHO - Phát hiện {excelValidationErrors.length}{" "}
                lỗi
              </h3>
              <p className="text-sm text-red-700 mb-3">
                File Excel có thông tin không khớp với phiếu đặt hàng. Vui lòng
                kiểm tra và sửa các lỗi sau:
              </p>
              <div className="bg-white p-3 rounded border border-red-200 max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {excelValidationErrors
                    .slice(0, 10)
                    .map((error: any, idx: number) => (
                      <li key={idx} className="text-red-700">
                        <span className="font-medium">Dòng {error.row}:</span>{" "}
                        {error.message}
                      </li>
                    ))}
                  {excelValidationErrors.length > 10 && (
                    <li className="text-red-600 font-medium">
                      ... và {excelValidationErrors.length - 10} lỗi khác
                    </li>
                  )}
                </ul>
              </div>
              <p className="text-xs text-red-600 mt-2 font-medium">
                💡 Lưu ý: Thông tin sản phẩm (tên, màu sắc, kích cỡ, số lượng
                đặt, đơn giá) phải khớp 100% với phiếu đặt hàng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading.creating}
        >
          Hủy
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleCreateGRWithFilter}
                disabled={
                  loading.creating ||
                  grForm.items.length === 0 ||
                  (inputMethod === "excel" && excelValidationErrors.length > 0)
                }
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
            </TooltipTrigger>
            {grForm.items.length === 0 ? (
              <TooltipContent>
                <p>Chưa có sản phẩm nào để nhập kho</p>
              </TooltipContent>
            ) : inputMethod === "excel" && excelValidationErrors.length > 0 ? (
              <TooltipContent>
                <p>Vui lòng sửa lỗi trong file Excel trước khi nhập kho</p>
              </TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Confirmation Dialog for Excel Validation Errors */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận nhập kho</AlertDialogTitle>
            <AlertDialogDescription>
              File Excel hiện tại có một số record không hợp lệ. Nếu bạn xác
              nhận, chỉ những record hợp lệ sẽ được nhập kho.
              <br />
              <br />
              <strong>Thống kê:</strong>
              <br />• Tổng số record: {grForm.items.length}
              <br />• Record hợp lệ: {pendingFormData?.items.length || 0}
              <br />• Record có lỗi: {excelValidationErrors.length}
              <br />
              <br />
              Bạn có muốn tiếp tục nhập kho với những record hợp lệ không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreateGR}>
              Xác nhận nhập kho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
