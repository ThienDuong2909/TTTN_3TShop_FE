import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Package,
  CheckCircle,
  AlertTriangle,
  Eye,
  Save,
  Upload,
  Download,
  FileSpreadsheet,
  Edit,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import * as XLSX from "xlsx";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useApp } from "../contexts/AppContext";
import { goodsReceipts, purchaseOrders, mockStaff } from "../libs/data";
import type {
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseOrder,
} from "../libs/data";

export default function GoodsReceipt() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateGROpen, setIsCreateGROpen] = useState(false);
  const [selectedGR, setSelectedGR] = useState<GoodsReceipt | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [inputMethod, setInputMethod] = useState<"manual" | "excel">("manual");
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelError, setExcelError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open create dialog if PO is specified in URL
  useEffect(() => {
    const poId = searchParams.get("po");
    if (poId) {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (
        po &&
        (po.status === "confirmed" || po.status === "partially_received")
      ) {
        setSelectedPO(po);
        setIsCreateGROpen(true);
        initializeGRForm(po);
      }
    }
  }, [searchParams]);

  // Form state for new goods receipt
  const [grForm, setGRForm] = useState({
    purchaseOrderId: "",
    receivedBy: state.user?.id || "",
    notes: "",
    items: [] as Omit<GoodsReceiptItem, "totalReceivedValue">[],
  });

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" &&
      !state.user.permissions?.includes("manage_inventory"))
  ) {
    navigate("/admin");
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", variant: "secondary" as const },
      completed: { label: "Hoàn thành", variant: "default" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

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

  const filteredGRs = goodsReceipts.filter((gr) => {
    const matchesSearch =
      gr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gr.purchaseOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gr.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || gr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availablePOs = purchaseOrders.filter(
    (po) => po.status === "confirmed" || po.status === "partially_received",
  );

  const initializeGRForm = (po: PurchaseOrder) => {
    setGRForm({
      purchaseOrderId: po.id,
      receivedBy: state.user?.id || "",
      notes: "",
      items: po.items.map((item, index) => ({
        purchaseOrderItemId: `${po.id}-${index + 1}`,
        productId: item.productId,
        productName: item.productName,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Default to ordered quantity
        unitPrice: item.unitPrice,
        condition: "good" as const,
        notes: "",
      })),
    });
  };

  const updateGRItem = (
    index: number,
    field: keyof Omit<GoodsReceiptItem, "totalReceivedValue">,
    value: any,
  ) => {
    const newItems = [...grForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setGRForm({ ...grForm, items: newItems });
  };

  const calculateTotalReceived = () => {
    return grForm.items.reduce(
      (sum, item) => sum + item.receivedQuantity * item.unitPrice,
      0,
    );
  };

  const handleCreateGR = () => {
    if (!grForm.purchaseOrderId || grForm.items.length === 0) {
      alert("Vui lòng chọn phiếu đặt hàng và kiểm tra số lượng nhận");
      return;
    }

    const po = purchaseOrders.find((p) => p.id === grForm.purchaseOrderId);
    if (!po) return;

    const newGR: GoodsReceipt = {
      id: `GR${String(goodsReceipts.length + 1).padStart(3, "0")}`,
      purchaseOrderId: grForm.purchaseOrderId,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      items: grForm.items,
      status: "completed",
      totalReceivedValue: calculateTotalReceived(),
      receiptDate: new Date().toISOString(),
      receivedBy: grForm.receivedBy,
      notes: grForm.notes,
    };

    console.log("Creating Goods Receipt:", newGR);
    setIsCreateGROpen(false);
    setSelectedPO(null);
    resetForm();
  };

  const resetForm = () => {
    setGRForm({
      purchaseOrderId: "",
      receivedBy: state.user?.id || "",
      notes: "",
      items: [],
    });
    setExcelData([]);
    setExcelError("");
    setInputMethod("manual");
  };

  // Excel handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate Excel structure
        if (!validateExcelStructure(jsonData)) {
          setExcelError(
            "Cấu trúc file Excel không đúng. Vui lòng kiểm tra lại template.",
          );
          return;
        }

        setExcelData(jsonData);
        processExcelData(jsonData);
      } catch (error) {
        setExcelError("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.");
        console.error("Excel processing error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateExcelStructure = (data: any[]): boolean => {
    if (!data || data.length === 0) return false;

    const requiredColumns = [
      "product_id",
      "product_name",
      "ordered_quantity",
      "received_quantity",
    ];
    const firstRow = data[0];

    return requiredColumns.every(
      (col) =>
        firstRow.hasOwnProperty(col) ||
        firstRow.hasOwnProperty(col.replace("_", " ")) ||
        firstRow.hasOwnProperty(col.replace("_", "")),
    );
  };

  const processExcelData = (data: any[]) => {
    if (!selectedPO) {
      setExcelError("Vui lòng chọn phiếu đặt hàng trước khi import Excel.");
      return;
    }

    const processedItems: Omit<GoodsReceiptItem, "totalReceivedValue">[] =
      data.map((row, index) => {
        // Normalize column names (handle different possible column names)
        const normalizeKey = (obj: any, possibleKeys: string[]) => {
          for (const key of possibleKeys) {
            if (obj[key] !== undefined) return obj[key];
          }
          return "";
        };

        const productId = normalizeKey(row, [
          "product_id",
          "Product ID",
          "Mã SP",
          "productid",
        ]);
        const productName = normalizeKey(row, [
          "product_name",
          "Product Name",
          "Tên SP",
          "productname",
        ]);
        const orderedQty =
          parseInt(
            normalizeKey(row, [
              "ordered_quantity",
              "Ordered Qty",
              "SL Đặt",
              "orderedquantity",
            ]),
          ) || 0;
        const receivedQty =
          parseInt(
            normalizeKey(row, [
              "received_quantity",
              "Received Qty",
              "SL Nhận",
              "receivedquantity",
            ]),
          ) || 0;
        const condition =
          normalizeKey(row, [
            "condition",
            "Condition",
            "Tình trạng",
            "tinhtrang",
          ]) || "good";
        const notes =
          normalizeKey(row, ["notes", "Notes", "Ghi chú", "ghichu"]) || "";
        const color = normalizeKey(row, ["color", "Color", "Màu", "mau"]) || "";
        const size =
          normalizeKey(row, ["size", "Size", "Kích thước", "kichthuoc"]) || "";

        // Find matching item from PO
        const poItem = selectedPO.items.find(
          (item) =>
            item.productId === productId.toString() ||
            item.productName === productName,
        );

        return {
          purchaseOrderItemId: `${selectedPO.id}-${index + 1}`,
          productId: productId.toString(),
          productName: productName || poItem?.productName || "",
          selectedColor: color || poItem?.selectedColor || "",
          selectedSize: size || poItem?.selectedSize || "",
          orderedQuantity: orderedQty || poItem?.quantity || 0,
          receivedQuantity: receivedQty,
          unitPrice: poItem?.unitPrice || 0,
          condition: ["good", "damaged", "defective"].includes(
            condition.toLowerCase(),
          )
            ? (condition.toLowerCase() as "good" | "damaged" | "defective")
            : "good",
          notes: notes,
        };
      });

    setGRForm((prev) => ({
      ...prev,
      items: processedItems,
    }));
  };

  const downloadExcelTemplate = () => {
    if (!selectedPO) {
      alert("Vui lòng chọn phiếu đặt hàng trước khi tải template.");
      return;
    }

    const templateData = selectedPO.items.map((item, index) => ({
      STT: index + 1,
      product_id: item.productId,
      product_name: item.productName,
      color: item.selectedColor || "",
      size: item.selectedSize || "",
      ordered_quantity: item.quantity,
      received_quantity: item.quantity, // Default to ordered quantity
      condition: "good",
      notes: "",
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Goods_Receipt");

    // Add some styling and validation
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
      };
    }

    XLSX.writeFile(wb, `goods_receipt_template_${selectedPO.id}.xlsx`);
  };

  const CreateGRForm = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseOrder">Phiếu đặt hàng *</Label>
          <Select
            value={grForm.purchaseOrderId}
            onValueChange={(value: string) => {
              const po = purchaseOrders.find((p) => p.id === value);
              if (po) {
                setSelectedPO(po);
                if (inputMethod === "manual") {
                  initializeGRForm(po);
                } else {
                  // For Excel mode, just set the PO without initializing items
                  setGRForm((prev) => ({
                    ...prev,
                    purchaseOrderId: value,
                  }));
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn phiếu đặt hàng" />
            </SelectTrigger>
            <SelectContent>
              {availablePOs.map((po) => (
                <SelectItem key={po.id} value={po.id}>
                  {po.id} - {po.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="receivedBy">Người nhận hàng</Label>
          <Input id="receivedBy" value={state.user?.name || ""} disabled />
        </div>
      </div>

      {/* Purchase Order Info */}
      {selectedPO && (
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label>Nhà cung cấp</Label>
                <div className="font-medium">{selectedPO.supplierName}</div>
              </div>
              <div>
                <Label>Ngày đặt</Label>
                <div>{formatDate(selectedPO.orderDate)}</div>
              </div>
              <div>
                <Label>Tổng tiền đặt</Label>
                <div className="font-medium">
                  {formatPrice(selectedPO.totalAmount)}
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <div>{getStatusBadge(selectedPO.status)}</div>
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
            {selectedPO && grForm.items.length > 0 && (
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
                      {grForm.items.map((item, index) => (
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
                                  parseInt(e.target.value) || 0,
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
                            {formatPrice(
                              item.receivedQuantity * item.unitPrice,
                            )}
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
            {selectedPO && grForm.items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Chọn phiếu đặt hàng để hiển thị danh sách sản phẩm
              </div>
            )}
          </TabsContent>

          <TabsContent value="excel" className="mt-4">
            <div className="space-y-4">
              {/* Excel Upload Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">
                        Import dữ liệu từ Excel
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tải file template Excel và điền thông tin nhập hàng
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      <Button
                        variant="outline"
                        onClick={downloadExcelTemplate}
                        disabled={!selectedPO}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Tải Template Excel
                      </Button>

                      <div className="text-muted-foreground">hoặc</div>

                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload File Excel
                        </Button>
                      </div>
                    </div>

                    {excelError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                        {excelError}
                      </div>
                    )}

                    {excelData.length > 0 && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded border">
                        ✓ Đã import thành công {excelData.length} dòng dữ liệu
                        từ Excel
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Excel Data */}
              {grForm.items.length > 0 && (
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
                        {grForm.items.map((item, index) => (
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
                              {formatPrice(
                                item.receivedQuantity * item.unitPrice,
                              )}
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
          onClick={() => {
            setIsCreateGROpen(false);
            setSelectedPO(null);
            resetForm();
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleCreateGR}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Xác nhận nhập kho
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <AdminHeader title="Quản lý phiếu nhập hàng" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Dialog open={isCreateGROpen} onOpenChange={setIsCreateGROpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu nhập hàng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo phiếu nhập hàng</DialogTitle>
                <DialogDescription>
                  Xác nhận số lượng và tình trạng hàng nhận từ nhà cung cấp. Có
                  thể nhập tay hoặc import từ Excel.
                </DialogDescription>
              </DialogHeader>
              <CreateGRForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phiếu chờ nhập
                  </p>
                  <p className="text-2xl font-bold">{availablePOs.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Đã nhập tháng này
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      goodsReceipts.filter(
                        (gr) =>
                          new Date(gr.receiptDate).getMonth() ===
                          new Date().getMonth(),
                      ).length
                    }
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Giá trị nhập kho
                  </p>
                  <p className="text-2xl font-bold">
                    {formatPrice(
                      goodsReceipts.reduce(
                        (sum, gr) => sum + gr.totalReceivedValue,
                        0,
                      ),
                    )}
                  </p>
                </div>
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rest of the component - table and other sections remain the same as original */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách phiếu nhập hàng ({filteredGRs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Đơn đặt hàng</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Số lượng SP</TableHead>
                  <TableHead>Giá trị nhận</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGRs.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-medium">{gr.id}</TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto">
                        {gr.purchaseOrderId}
                      </Button>
                    </TableCell>
                    <TableCell>{gr.supplierName}</TableCell>
                    <TableCell>{gr.items.length} sản phẩm</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(gr.totalReceivedValue)}
                    </TableCell>
                    <TableCell>{getStatusBadge(gr.status)}</TableCell>
                    <TableCell>{formatDate(gr.receiptDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGR(gr)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
