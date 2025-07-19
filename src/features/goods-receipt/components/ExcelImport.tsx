import { useRef, useState } from "react";
import { Upload, Download, Eye, AlertCircle, CheckCircle, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useToast } from "../../../components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { formatPrice } from "../../../services/api";

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

interface ExcelImportProps {
  selectedPO: PurchaseOrder | null;
  onDataProcessed: (items: Omit<GoodsReceiptItem, "totalReceivedValue">[]) => void;
  excelData: any[];
  excelError: string;
  onExcelDataChange: (data: any[]) => void;
  onExcelErrorChange: (error: string) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ExcelImport({
  selectedPO,
  onDataProcessed,
  excelData,
  excelError,
  onExcelDataChange,
  onExcelErrorChange,
}: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [processedItems, setProcessedItems] = useState<Omit<GoodsReceiptItem, "totalReceivedValue">[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    onExcelErrorChange("");
    setValidationErrors([]);
    setProcessedItems([]);

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      onExcelErrorChange("Chỉ chấp nhận file Excel (.xlsx, .xls)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onExcelErrorChange("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          onExcelErrorChange("File Excel không có dữ liệu");
          return;
        }

        // Validate Excel structure
        const structureValidation = validateExcelStructure(jsonData);
        if (!structureValidation.isValid) {
          onExcelErrorChange(structureValidation.error || "Cấu trúc file Excel không hợp lệ");
          return;
        }

        // Validate data
        const validation = validateExcelData(jsonData);
        setValidationErrors(validation.errors);

        if (validation.errors.length > 0) {
          onExcelErrorChange(`Phát hiện ${validation.errors.length} lỗi trong dữ liệu Excel`);
          return;
        }

        onExcelDataChange(jsonData);
        const items = processExcelData(jsonData);
        setProcessedItems(items);
        
        toast({
          title: "Import thành công",
          description: `Đã import ${jsonData.length} dòng dữ liệu từ Excel`,
        });
      } catch (error) {
        onExcelErrorChange("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.");
        console.error("Excel processing error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateExcelStructure = (data: any[]): { isValid: boolean; error?: string } => {
    if (!data || data.length === 0) {
      return { isValid: false, error: "File Excel không có dữ liệu" };
    }

    const requiredColumns = [
      "product_id",
      "received_quantity",
    ];

    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => {
      return !(
        firstRow.hasOwnProperty(col) ||
        firstRow.hasOwnProperty(col.replace("_", " ")) ||
        firstRow.hasOwnProperty(col.replace("_", ""))
      );
    });

    if (missingColumns.length > 0) {
      return {
        isValid: false,
        error: `Thiếu các cột bắt buộc: ${missingColumns.join(", ")}`
      };
    }

    return { isValid: true };
  };

  const validateExcelData = (data: any[]): { errors: ValidationError[] } => {
    const errors: ValidationError[] = [];

    if (!selectedPO) {
      errors.push({
        row: 0,
        field: "purchase_order",
        message: "Vui lòng chọn phiếu đặt hàng trước khi import Excel"
      });
      return { errors };
    }

    const poItems = selectedPO?.CT_PhieuDatHangNCCs || selectedPO?.items || [];
    const poProductIds = poItems.map((item: any) => 
      (item.MaCTSP || item.productId || "").toString()
    );

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel rows start from 2 (1 is header)

      // Normalize column names
      const normalizeKey = (obj: any, possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          if (obj[key] !== undefined) return obj[key];
        }
        return "";
      };

      // Validate product_id
      const productId = normalizeKey(row, [
        "product_id",
        "Product ID",
        "Mã SP",
        "productid",
      ]);
      
      if (!productId) {
        errors.push({
          row: rowNumber,
          field: "product_id",
          message: "Mã sản phẩm không được để trống"
        });
      } else if (!poProductIds.includes(productId.toString())) {
        errors.push({
          row: rowNumber,
          field: "product_id",
          message: `Sản phẩm có mã ${productId} không có trong phiếu đặt hàng`
        });
      }

      // Validate received_quantity
      const receivedQty = parseInt(
        normalizeKey(row, [
          "received_quantity",
          "Received Qty",
          "SL Nhận", 
          "receivedquantity",
        ])
      );
      
      if (isNaN(receivedQty) || receivedQty < 0) {
        errors.push({
          row: rowNumber,
          field: "received_quantity",
          message: "Số lượng nhận phải là số dương"
        });
      }

      // Validate condition (optional) - removed since it's not used in manual input
      // const condition = normalizeKey(row, [
      //   "condition",
      //   "Condition",
      //   "Tình trạng",
      //   "tinhtrang",
      // ]) || "good";
      
      // if (!["good", "damaged", "defective"].includes(condition.toLowerCase())) {
      //   errors.push({
      //     row: rowNumber,
      //     field: "condition",
      //     message: "Tình trạng phải là: good, damaged, hoặc defective"
      //   });
      // }
    });

    return { errors };
  };

  const processExcelData = (data: any[]): Omit<GoodsReceiptItem, "totalReceivedValue">[] => {
    if (!selectedPO) {
      throw new Error("Vui lòng chọn phiếu đặt hàng trước khi import Excel.");
    }

    const poItems = selectedPO?.CT_PhieuDatHangNCCs || selectedPO?.items || [];
    
    // Create a map of PO items by product ID for quick lookup
    const poItemsMap = new Map();
    poItems.forEach((item: any, index: number) => {
      const productId = (item.MaCTSP || item.productId || "").toString();
      poItemsMap.set(productId, { ...item, index });
    });

    const processedItems: Omit<GoodsReceiptItem, "totalReceivedValue">[] = data.map((row, index) => {
      // Normalize column names
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
      const receivedQty = parseInt(
        normalizeKey(row, [
          "received_quantity",
          "Received Qty",
          "SL Nhận", 
          "receivedquantity",
        ])
      ) || 0;
      // const condition = normalizeKey(row, [
      //   "condition",
      //   "Condition",
      //   "Tình trạng",
      //   "tinhtrang",
      // ]) || "good";
      const notes = normalizeKey(row, ["notes", "Notes", "Ghi chú", "ghichu"]) || "";

      // Find matching item from PO
      const poItem = poItemsMap.get(productId.toString());

      if (!poItem) {
        throw new Error(`Không tìm thấy sản phẩm có mã ${productId} trong phiếu đặt hàng`);
      }

      return {
        purchaseOrderItemId: `${selectedPO?.MaPDH || selectedPO?.id || "unknown"}-${poItem.index + 1}`,
        productId: productId.toString(),
        productName: poItem.ChiTietSanPham?.SanPham?.TenSP || poItem.TenSP || poItem.productName || "",
        selectedColor: poItem.ChiTietSanPham?.Mau?.MaHex ? `#${poItem.ChiTietSanPham.Mau.MaHex}` : (poItem.Mau?.MaHex ? `#${poItem.Mau.MaHex}` : "") || poItem.selectedColor || "",
        colorName: poItem.ChiTietSanPham?.Mau?.TenMau || poItem.Mau?.TenMau || "",
        selectedSize: poItem.ChiTietSanPham?.KichThuoc?.TenKichThuoc || poItem.KichThuoc?.TenKichThuoc || poItem.selectedSize || "",
        orderedQuantity: poItem.SoLuong || poItem.quantity || 0,
        receivedQuantity: receivedQty,
        unitPrice: poItem.DonGia || poItem.unitPrice || 0,
        condition: "good", // Mặc định là tốt, không cần import từ Excel
        notes: notes,
      };
    });

    onDataProcessed(processedItems);
    return processedItems;
  };

  const downloadExcelTemplate = () => {
    if (!selectedPO) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phiếu đặt hàng trước khi tải template.",
        variant: "destructive",
      });
      return;
    }

    const poItems = selectedPO?.CT_PhieuDatHangNCCs || selectedPO?.items || [];
    const templateData = poItems.map((item: any, index: number) => ({
      STT: index + 1,
      product_id: item.MaCTSP || item.productId || "",
      product_name: item.TenSP || item.productName || "",
      ordered_quantity: item.SoLuong || item.quantity || 0,
      received_quantity: "", // Để trống để người dùng điền
      notes: "", // Để trống để người dùng điền
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Goods_Receipt");

    // Add styling to header
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" },
      };
    }

    // Set column widths
    ws["!cols"] = [
      { width: 5 },  // STT
      { width: 15 }, // product_id
      { width: 40 }, // product_name
      { width: 15 }, // ordered_quantity
      { width: 15 }, // received_quantity
      { width: 30 }, // notes
    ];

    XLSX.writeFile(wb, `goods_receipt_template_${selectedPO?.MaPDH || selectedPO?.id || "unknown"}.xlsx`);
    
    toast({
      title: "Tải template thành công",
      description: "File template Excel đã được tải về. Chỉ cần điền số lượng nhận và ghi chú.",
    });
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      good: { label: "Tốt", className: "bg-green-100 text-green-800" },
      damaged: { label: "Hỏng", className: "bg-red-100 text-red-800" },
      defective: { label: "Lỗi", className: "bg-yellow-100 text-yellow-800" },
    };
    
    const conditionInfo = conditionMap[condition as keyof typeof conditionMap];
    return (
      <Badge className={conditionInfo?.className || "bg-gray-100 text-gray-800"}>
        {conditionInfo?.label || condition}
      </Badge>
    );
  };

  const clearExcelData = () => {
    onExcelDataChange([]);
    onExcelErrorChange("");
    setValidationErrors([]);
    setProcessedItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import số lượng nhập từ Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Tải file template Excel và chỉ điền số lượng nhận về. Thông tin sản phẩm sẽ lấy từ phiếu đặt hàng.
          </p>

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

          {/* Error Display */}
          {excelError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{excelError}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>Phát hiện {validationErrors.length} lỗi trong dữ liệu:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm">
                        Dòng {error.row}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... và {validationErrors.length - 5} lỗi khác
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {excelData.length > 0 && !excelError && validationErrors.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Đã import thành công {excelData.length} dòng dữ liệu từ Excel</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Xem trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearExcelData}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Xem trước dữ liệu nhập kho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Tổng cộng: {processedItems.length} sản phẩm
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Màu/Size</TableHead>
                    <TableHead>SL Đặt</TableHead>
                    <TableHead>SL Nhận</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Thành tiền</TableHead>
                    <TableHead>Tình trạng</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {item.productId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.selectedColor && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded border" 
                                style={{ backgroundColor: item.selectedColor }}
                              />
                              <span className="text-xs">{item.colorName || item.selectedColor}</span>
                            </div>
                          )}
                          {item.selectedSize && (
                            <div className="text-xs">{item.selectedSize}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.orderedQuantity}</TableCell>
                      <TableCell className="font-medium">{item.receivedQuantity}</TableCell>
                      <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(item.unitPrice * item.receivedQuantity)}
                      </TableCell>
                      <TableCell>{getConditionBadge(item.condition)}</TableCell>
                      <TableCell className="max-w-32 truncate" title={item.notes}>
                        {item.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right">
                <div className="text-lg font-bold">
                  Tổng giá trị: {formatPrice(
                    processedItems.reduce((sum, item) => sum + (item.unitPrice * item.receivedQuantity), 0)
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 