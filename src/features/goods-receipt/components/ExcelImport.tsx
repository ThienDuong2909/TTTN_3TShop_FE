import { useRef } from "react";
import { Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useToast } from "../../../components/ui/use-toast";

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
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onExcelErrorChange("");

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
          onExcelErrorChange(
            "Cấu trúc file Excel không đúng. Vui lòng kiểm tra lại template."
          );
          return;
        }

        onExcelDataChange(jsonData);
        processExcelData(jsonData);
      } catch (error) {
        onExcelErrorChange("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.");
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
        firstRow.hasOwnProperty(col.replace("_", ""))
    );
  };

  const processExcelData = (data: any[]) => {
    if (!selectedPO) {
      onExcelErrorChange("Vui lòng chọn phiếu đặt hàng trước khi import Excel.");
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
            ])
          ) || 0;
        const receivedQty =
          parseInt(
            normalizeKey(row, [
              "received_quantity",
              "Received Qty",
              "SL Nhận",
              "receivedquantity",
            ])
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
        const poItem = (selectedPO?.items || []).find(
          (item) =>
            item.productId === productId.toString() ||
            item.productName === productName
        );

        return {
          purchaseOrderItemId: `${selectedPO?.id || "unknown"}-${index + 1}`,
          productId: productId.toString(),
          productName: productName || poItem?.productName || "",
          selectedColor: color || poItem?.selectedColor || "",
          selectedSize: size || poItem?.selectedSize || "",
          orderedQuantity: orderedQty || poItem?.quantity || 0,
          receivedQuantity: receivedQty,
          unitPrice: poItem?.unitPrice || 0,
          condition: ["good", "damaged", "defective"].includes(
            condition.toLowerCase()
          )
            ? (condition.toLowerCase() as "good" | "damaged" | "defective")
            : "good",
          notes: notes,
        };
      });

    onDataProcessed(processedItems);
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

    const templateData = (selectedPO?.items || []).map((item, index) => ({
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

    XLSX.writeFile(wb, `goods_receipt_template_${selectedPO?.id || "unknown"}.xlsx`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Import dữ liệu từ Excel</h3>
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
              ✓ Đã import thành công {excelData.length} dòng dữ liệu từ Excel
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 