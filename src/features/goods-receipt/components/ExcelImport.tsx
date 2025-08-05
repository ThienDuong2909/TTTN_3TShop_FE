import { useRef, useState, useEffect } from "react";
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
  DialogDescription,
} from "../../../components/ui/dialog";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { getPurchaseOrderReceivedStatus } from "../../../services/api";
import { parseVietnameseCurrency, comparePricesFlexibly } from "../../../lib/utils";

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
  onValidationErrorsChange?: (errors: ValidationError[]) => void;
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
  onValidationErrorsChange = () => {},
}: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [processedItems, setProcessedItems] = useState<Omit<GoodsReceiptItem, "totalReceivedValue">[]>([]);
  const [receivedStatus, setReceivedStatus] = useState<any[]>([]);
  
  // Lấy thông tin số lượng đã nhập khi selectedPO thay đổi
  useEffect(() => {
    const fetchReceivedStatus = async () => {
      const poId = selectedPO?.MaPDH || selectedPO?.id;
      if (poId) {
        try {
          const status = await getPurchaseOrderReceivedStatus(poId);
          setReceivedStatus(Array.isArray(status?.data) ? status.data : []);
        } catch (e) {
          setReceivedStatus([]);
        }
      } else {
        setReceivedStatus([]);
      }
    };
    fetchReceivedStatus();
  }, [selectedPO]);
  
  // New states for sheet selection and data detection
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [dataStartRow, setDataStartRow] = useState<number>(0);
  const [isSheetDialogOpen, setIsSheetDialogOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    onExcelErrorChange("");
    setValidationErrors([]);
    setProcessedItems([]);
    setWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheet("");
    setRawExcelData([]);
    setDataStartRow(0);
    
    // Reset file input để có thể upload lại cùng file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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
        
        // Store workbook and available sheets
        setWorkbook(workbook);
        setAvailableSheets(workbook.SheetNames);
        
        // Open sheet selection dialog
        setIsSheetDialogOpen(true);
        
      } catch (error) {
        onExcelErrorChange("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file.");
        console.error("Excel processing error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to detect data start row
  const detectDataStartRow = (worksheet: XLSX.WorkSheet): number => {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const maxRow = range.e.r;
    
    // Look for header row with product table columns - specifically for PHIẾU NHẬP HÀNG format
    const requiredTableHeaders = [
      'stt', 'no', 'số thứ tự',
      'tên sản phẩm', 'product', 'sản phẩm', 
      'màu sắc', 'color', 'mau sac',
      'size', 'kich thuoc', 'kích thước',
      'đơn vị tính', 'unit', 'don vi tinh',
      'số lượng đặt', 'ordered quantity', 'so luong dat',
      'số lượng nhận', 'received quantity', 'so luong nhan',
      'đơn giá', 'unit price', 'don gia',
      'thành tiền', 'total', 'thanh tien'
    ];
    
    // First, look for the document title "PHIẾU NHẬP HÀNG"
    let documentTitleFound = false;
    let titleRow = -1;
    
    for (let row = 0; row <= Math.min(maxRow, 10); row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v?.toString().toLowerCase().includes('phiếu nhập hàng')) {
          documentTitleFound = true;
          titleRow = row;
          break;
        }
      }
      if (documentTitleFound) break;
    }
    
    // If document title found, look for table headers after it
    const startSearchRow = documentTitleFound ? titleRow + 1 : 0;
    
    for (let row = startSearchRow; row <= Math.min(maxRow, 30); row++) {
      const rowData: any = {};
      const rowValues: string[] = [];
      
      // Get all cells in this row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          const cellValue = cell.v?.toString().toLowerCase() || '';
          rowData[cellValue] = true;
          rowValues.push(cellValue);
        }
      }
      
      // Check if this row contains table header keywords
      const matchedKeywords = requiredTableHeaders.filter(keyword => 
        rowValues.some(cellValue => cellValue.includes(keyword))
      );
      
      // Need at least 4 matches to be considered a valid table header
      if (matchedKeywords.length >= 4) {
        // Additional check: make sure this looks like a proper table header row
        const hasSTT = rowValues.some(v => v.includes('stt') || v.includes('no') || v.includes('số thứ tự'));
        const hasProductName = rowValues.some(v => v.includes('tên sản phẩm') || v.includes('product') || v.includes('sản phẩm'));
        const hasQuantity = rowValues.some(v => v.includes('số lượng') || v.includes('quantity'));
        
        if (hasSTT && hasProductName && hasQuantity) {
          return row + 1; // Data starts from next row
        }
      }
    }
    
    return 1; // Default to first row if no header detected
  };

  // Function to load sheet data
  const loadSheetData = (sheetName: string) => {
    if (!workbook) return;
    
    const worksheet = workbook.Sheets[sheetName];
    const detectedStartRow = detectDataStartRow(worksheet);
    setDataStartRow(detectedStartRow);
    
    // Convert sheet to JSON starting from detected data row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      range: detectedStartRow - 1, // XLSX uses 0-based indexing
      header: 1 // Get raw data as arrays
    });
    
    // Convert to objects with headers
    if (jsonData.length > 0) {
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];
      
      const processedData = dataRows
        .map((row, index) => {
          const obj: any = {};
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              obj[header] = row[colIndex];
            }
          });
          return obj;
        })
        .filter(row => {
          // Remove empty rows and rows that don't contain product data
          const hasProductData = Object.values(row).some(value => 
            value !== null && 
            value !== undefined && 
            value !== '' && 
            value.toString().trim() !== ''
          );
          
          // Check if row contains product-related data (not just headers or empty)
          const hasProductName = Object.keys(row).some(key => 
            key.toLowerCase().includes('tên sản phẩm') || 
            key.toLowerCase().includes('product')
          );
          
          return hasProductData && hasProductName;
        })
        .filter(row => {
          // Additional filter: remove rows that are likely headers or footers
          const firstValue = Object.values(row)[0];
          if (typeof firstValue === 'string') {
            const lowerValue = firstValue.toLowerCase();
            // Skip rows that are likely headers, footers, or summary rows
            if (lowerValue.includes('tổng') || 
                lowerValue.includes('total') || 
                lowerValue.includes('cộng') ||
                lowerValue.includes('sum') ||
                lowerValue.includes('stt') ||
                lowerValue.includes('no') ||
                lowerValue === '' ||
                lowerValue === ' ') {
              return false;
            }
          }
          return true;
        });
      
      // Debug logging cho dữ liệu thô từ Excel
      console.log('Raw Excel Data:', processedData);
      
      setRawExcelData(processedData);
      setSelectedSheet(sheetName);
    } else {
      setRawExcelData([]);
    }
  };

  // Function to process selected sheet data
  const processSelectedSheet = () => {
    if (!rawExcelData.length) {
      onExcelErrorChange("Không có dữ liệu trong sheet được chọn");
      setIsSheetDialogOpen(false);
      return;
    }

    console.log("=== PROCESS SELECTED SHEET START ===");
    console.log("Raw Excel Data:", rawExcelData);

    // Validate Excel structure FIRST
    const structureValidation = validateExcelStructure(rawExcelData);
    if (!structureValidation.isValid) {
      onExcelErrorChange(structureValidation.error || "Cấu trúc file Excel không hợp lệ");
      setIsSheetDialogOpen(false);
      return;
    }

    // LUÔN xử lý và gửi dữ liệu về form để người dùng thấy
    onExcelDataChange(rawExcelData);
    const items = processExcelData(rawExcelData);
    console.log("Processed Items:", items);
    setProcessedItems(items);
    
    // Gửi dữ liệu vào form nhập kho (có thể có lỗi)
    console.log("Calling onDataProcessed with items:", items);
    onDataProcessed(items);

    // Validate data và hiển thị lỗi
    const validation = validateExcelData(rawExcelData);
    console.log("Validation errors:", validation.errors);
    setValidationErrors(validation.errors);
    onValidationErrorsChange(validation.errors);

    if (validation.errors.length === 0) {
      toast({
        title: "Import thành công",
        description: `Đã import ${rawExcelData.length} dòng dữ liệu từ sheet "${selectedSheet}"`,
      });
    } else {
      onExcelErrorChange(`Phát hiện ${validation.errors.length} lỗi trong dữ liệu Excel. Vui lòng sửa lỗi trước khi nhập kho.`);
    }
    
    console.log("=== PROCESS SELECTED SHEET END ===");
    
    // Đóng dialog sau khi xử lý
    setIsSheetDialogOpen(false);
  };

  const validateExcelStructure = (data: any[]): { isValid: boolean; error?: string } => {
    if (!data || data.length === 0) {
      return { isValid: false, error: "File Excel không có dữ liệu" };
    }

    // Các cột bắt buộc theo format PHIẾU NHẬP HÀNG
    const requiredColumns = [
      "stt", "no", "số thứ tự",
      "tên sản phẩm", "product", "sản phẩm",
      "số lượng đặt", "ordered quantity", "so luong dat",
      "số lượng nhận", "received quantity", "so luong nhan",
      "đơn giá", "unit price", "don gia"
    ];

    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow).map(col => col.toLowerCase());
    
    // Kiểm tra các cột bắt buộc
    const missingRequiredColumns = [];
    
    // Kiểm tra STT
    const hasSTT = availableColumns.some(col => 
      col.includes('stt') || col.includes('no') || col.includes('số thứ tự')
    );
    if (!hasSTT) missingRequiredColumns.push('STT/Số thứ tự');
    
    // Kiểm tra Tên sản phẩm
    const hasProductName = availableColumns.some(col => 
      col.includes('tên sản phẩm') || col.includes('product') || col.includes('sản phẩm')
    );
    if (!hasProductName) missingRequiredColumns.push('Tên sản phẩm');
    
    // Kiểm tra Số lượng đặt
    const hasOrderedQty = availableColumns.some(col => 
      col.includes('số lượng đặt') || col.includes('ordered quantity') || col.includes('so luong dat')
    );
    if (!hasOrderedQty) missingRequiredColumns.push('Số lượng đặt');
    
    // Kiểm tra Số lượng nhận
    const hasReceivedQty = availableColumns.some(col => 
      col.includes('số lượng nhận') || col.includes('received quantity') || col.includes('so luong nhan')
    );
    if (!hasReceivedQty) missingRequiredColumns.push('Số lượng nhận');
    
    // Kiểm tra Đơn giá
    const hasUnitPrice = availableColumns.some(col => 
      col.includes('đơn giá') || col.includes('unit price') || col.includes('don gia')
    );
    if (!hasUnitPrice) missingRequiredColumns.push('Đơn giá');

    if (missingRequiredColumns.length > 0) {
      return {
        isValid: false,
        error: `Format file không đúng. Thiếu các cột bắt buộc: ${missingRequiredColumns.join(", ")}`
      };
    }

    // Kiểm tra xem có phải là format PHIẾU NHẬP HÀNG không
    const hasValidFormat = hasSTT && hasProductName && hasOrderedQty && hasReceivedQty && hasUnitPrice;
    
    if (!hasValidFormat) {
      return {
        isValid: false,
        error: "File không đúng format PHIẾU NHẬP HÀNG. Vui lòng sử dụng template mẫu."
      };
    }

    return { isValid: true };
  };

  const validateExcelData = (data: any[]): { errors: ValidationError[] } => {
    const errors: ValidationError[] = [];

    // Kiểm tra xem có selectedPO không
    if (!selectedPO) {
      errors.push({
        row: 1,
        field: "general",
        message: "Vui lòng chọn phiếu đặt hàng trước khi import Excel"
      });
      return { errors };
    }

    // Lấy danh sách sản phẩm từ phiếu đặt hàng để cross-reference
    const poItems = selectedPO.CT_PhieuDatHangNCCs || [];
    
    // Debug logging cho receivedStatus
    console.log("Received Status Data:", receivedStatus);
    
    // Tạo map để tìm kiếm sản phẩm theo tên + màu + size
    const poItemsMap = new Map();
    
    poItems.forEach((item: any) => {
      const productName = item.TenSP || item.ChiTietSanPham?.SanPham?.TenSP || '';
      const color = item.ChiTietSanPham?.Mau?.TenMau || item.Mau?.TenMau || '';
      const size = item.ChiTietSanPham?.KichThuoc?.TenKichThuoc || item.KichThuoc?.TenKichThuoc || '';
      const orderedQty = item.SoLuong || 0;
      const unitPrice = item.DonGia || 0;
      const maCTSP = item.MaCTSP;
      
      // Debug logging cho PO items
      console.log(`PO Item: ${productName}`, {
        color,
        size,
        orderedQty,
        rawDonGia: item.DonGia,
        unitPrice,
        maCTSP
      });
      
      // Tạo key từ tên + màu + size
      const key = `${productName.toLowerCase().trim()}|${color.toLowerCase().trim()}|${size.toLowerCase().trim()}`;
      
      poItemsMap.set(key, {
        productName,
        color,
        size,
        orderedQty,
        unitPrice,
        maCTSP
      });
    });

    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      const rowNumber = index + 2; // Excel rows start from 2 (1 is header)

      // Normalize column names
      const normalizeKey = (obj: any, possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          if (obj[key] !== undefined) return obj[key];
        }
        return "";
      };

      // Lấy dữ liệu từ Excel
      const productName = normalizeKey(row, [
        "tên sản phẩm",
        "product_name", 
        "productName",
        "Tên sản phẩm"
      ]);
      
      const color = normalizeKey(row, [
        "màu sắc",
        "color",
        "mau_sac",
        "Màu sắc"
      ]);
      
      const size = normalizeKey(row, [
        "size",
        "kich_thuoc",
        "kichThuoc",
        "Size",
        "kích thước"
      ]);
      
      const orderedQty = parseInt(
        normalizeKey(row, [
          "số lượng đặt",
          "ordered_quantity",
          "orderedQuantity", 
          "Số lượng đặt"
        ])
      );
      
      const receivedQty = parseInt(
        normalizeKey(row, [
          "số lượng nhận",
          "received_quantity",
          "receivedQuantity", 
          "Số lượng nhận"
        ])
      );
      
      // Sử dụng utility function từ lib/utils

      const unitPrice = parseVietnameseCurrency(
        normalizeKey(row, [
          "đơn giá",
          "unit_price",
          "unitPrice",
          "Đơn giá",
          "đơn giá (vnđ)",
          "unit price (vnđ)",
          "Đơn giá (VNĐ)",
          "đơn giá (VNĐ)",
          "Unit Price",
          "Unit price",
          "Don gia",
          "Don gia (VND)",
          "Đơn giá (VND)"
        ])
      );

      // Debug logging cho validation
      console.log(`Validation Row ${rowNumber}:`, {
        productName,
        allRowKeys: Object.keys(row), // Log tất cả keys để tìm tên cột đúng
        rawUnitPrice: normalizeKey(row, [
          "đơn giá",
          "unit_price",
          "unitPrice",
          "Đơn giá",
          "đơn giá (vnđ)",
          "unit price (vnđ)",
          "Đơn giá (VNĐ)",
          "đơn giá (VNĐ)",
          "Unit Price",
          "Unit price",
          "Don gia",
          "Don gia (VND)",
          "Đơn giá (VND)"
        ]),
        parsedUnitPrice: unitPrice,
        receivedQty,
        orderedQty,
        unitPriceIsValid: unitPrice > 0
      });

      // Validate product name (required)
      if (!productName || productName.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field: "tên sản phẩm",
          message: "Tên sản phẩm không được để trống"
        });
        continue; // Skip other validations if product name is empty
      }

      // Validate ordered quantity (required)
      if (isNaN(orderedQty) || orderedQty <= 0) {
        errors.push({
          row: rowNumber,
          field: "số lượng đặt",
          message: "Số lượng đặt phải là số dương"
        });
      }

      // Validate received quantity (required)
      if (isNaN(receivedQty) || receivedQty <= 0) {
        errors.push({
          row: rowNumber,
          field: "số lượng nhận",
          message: "Số lượng nhận phải là số dương"
        });
      }

      // Validate unit price (required)
      if (unitPrice <= 0) {
        errors.push({
          row: rowNumber,
          field: "đơn giá",
          message: "Đơn giá phải là số dương"
        });
      }

      // CROSS-REFERENCE VALIDATION với phiếu đặt hàng
      const normalizedProductName = productName.toString().toLowerCase().trim();
      const normalizedColor = color.toString().toLowerCase().trim();
      const normalizedSize = size.toString().toLowerCase().trim();
      
      // Tìm sản phẩm khớp trong PO (tên + màu + size)
      const searchKey = `${normalizedProductName}|${normalizedColor}|${normalizedSize}`;
      let poItem = poItemsMap.get(searchKey);
      
      // Nếu không tìm thấy, thử tìm chỉ theo tên sản phẩm
      if (!poItem) {
        for (const [key, item] of poItemsMap.entries()) {
          if (key.startsWith(normalizedProductName + '|')) {
            poItem = item;
            break;
          }
        }
      }
      
      if (!poItem) {
        let errorMessage = `Sản phẩm "${productName}"`;
        if (color) errorMessage += ` màu "${color}"`;
        if (size) errorMessage += ` size "${size}"`;
        errorMessage += ` không có trong phiếu đặt hàng`;
        
        errors.push({
          row: rowNumber,
          field: "tên sản phẩm",
          message: errorMessage
        });
      } else {
        // Kiểm tra số lượng đặt có khớp với phiếu đặt hàng không
        if (orderedQty !== poItem.orderedQty) {
          errors.push({
            row: rowNumber,
            field: "số lượng đặt",
            message: `Số lượng đặt (${orderedQty}) không khớp với phiếu đặt hàng (${poItem.orderedQty})`
          });
        }
        
        // Kiểm tra đơn giá có khớp với phiếu đặt hàng không
        console.log(`Unit Price Comparison for ${productName}:`, {
          excelUnitPrice: unitPrice,
          excelUnitPriceType: typeof unitPrice,
          poUnitPrice: poItem.unitPrice,
          poUnitPriceType: typeof poItem.unitPrice,
          difference: Math.abs(unitPrice - poItem.unitPrice),
          isMatch: comparePricesFlexibly(unitPrice, poItem.unitPrice),
          // Debug chi tiết hơn
          test1: Math.abs(unitPrice - poItem.unitPrice) <= 0.01,
          test2: Math.abs(unitPrice * 1000 - poItem.unitPrice) <= 0.01,
          test3: Math.abs(unitPrice - poItem.unitPrice * 1000) <= 0.01,
          test4: Math.abs(unitPrice * 100 - poItem.unitPrice) <= 0.01,
          test5: Math.abs(unitPrice - poItem.unitPrice * 100) <= 0.01
        });
        
        if (!comparePricesFlexibly(unitPrice, poItem.unitPrice)) {
          errors.push({
            row: rowNumber,
            field: "đơn giá",
            message: `Đơn giá (${unitPrice}) không khớp với phiếu đặt hàng (${poItem.unitPrice})`
          });
        }
        
        // Kiểm tra số lượng nhận không được vượt quá số lượng đặt
        console.log(`Quantity validation for ${productName}:`, {
          receivedQty,
          orderedQty,
          receivedQtyFromPO: poItem.orderedQty,
          isReceivedQtyValid: receivedQty <= orderedQty
        });
        
        if (receivedQty > orderedQty) {
          errors.push({
            row: rowNumber,
            field: "số lượng nhận",
            message: `Số lượng nhận (${receivedQty}) không được vượt quá số lượng đặt (${orderedQty})`
          });
        }
        
        // Kiểm tra số lượng nhận không được vượt quá số lượng còn cần nhập
        // Sử dụng cùng logic như nhập tay
        const getRemainingQuantity = (maCTSP: string | number) => {
          const found = receivedStatus.find((item: any) => String(item.MaCTSP) === String(maCTSP));
          return found ? found.SoLuongConLai : 0;
        };
        
        const remainingFromAPI = getRemainingQuantity(poItem.maCTSP);
        
        // Tổng số đã nhập cho sản phẩm này trong Excel (trừ dòng hiện tại)
        const totalEnteredOtherRows = data.reduce((sum, row, idx) => {
          if (idx !== index) {
            const otherProductName = normalizeKey(row, ["tên sản phẩm", "product_name", "productName", "Tên sản phẩm"]) || "";
            const otherColor = normalizeKey(row, ["màu sắc", "color", "mau_sac", "Màu sắc"]) || "";
            const otherSize = normalizeKey(row, ["size", "kich_thuoc", "kichThuoc", "Size"]) || "";
            
            // Kiểm tra xem có phải cùng sản phẩm không
            if (otherProductName.toLowerCase().trim() === productName.toLowerCase().trim() &&
                otherColor.toLowerCase().trim() === color.toLowerCase().trim() &&
                otherSize.toLowerCase().trim() === size.toLowerCase().trim()) {
              const otherReceivedQty = parseInt(normalizeKey(row, ["số lượng nhận", "received_quantity", "receivedQuantity", "Số lượng nhận"])) || 0;
              return sum + otherReceivedQty;
            }
          }
          return sum;
        }, 0);
        
        // Số còn lại thực sự cho dòng này
        const realRemaining = (remainingFromAPI ?? 0) - totalEnteredOtherRows;
        
        console.log(`Remaining quantity validation for ${productName}:`, {
          receivedQty,
          orderedQty,
          remainingFromAPI,
          totalEnteredOtherRows,
          realRemaining,
          isRemainingQtyValid: receivedQty <= realRemaining
        });
        
        if (realRemaining >= 0 && receivedQty > realRemaining) {
          errors.push({
            row: rowNumber,
            field: "số lượng nhận",
            message: `Số lượng nhận (${receivedQty}) vượt quá số lượng còn cần nhập (${realRemaining}).`
          });
        }
      }
    }

    return { errors };
  };

  const processExcelData = (data: any[]): Omit<GoodsReceiptItem, "totalReceivedValue">[] => {
    const normalizeKey = (obj: any, possibleKeys: string[]) => {
      for (const key of possibleKeys) {
        if (obj[key] !== undefined) {
          console.log(`normalizeKey found: "${key}" = ${obj[key]} (type: ${typeof obj[key]})`);
          return obj[key];
        }
      }
      console.log(`normalizeKey not found for keys: ${possibleKeys.join(', ')}`);
      console.log(`Available keys in obj: ${Object.keys(obj).join(', ')}`);
      return "";
    };

    const processedItems: Omit<GoodsReceiptItem, "totalReceivedValue">[] = data.map((row, index) => {
      // Debug: Log toàn bộ row data trước khi xử lý
      console.log(`=== PROCESSING ROW ${index + 1} ===`);
      console.log("Raw row data:", row);
      console.log("Row keys:", Object.keys(row));
      
      // Lấy dữ liệu TRỰC TIẾP từ Excel - không phụ thuộc vào PO
      const productName = normalizeKey(row, ["tên sản phẩm", "product_name", "productName", "Tên sản phẩm"]) || "";
      const color = normalizeKey(row, ["màu sắc", "color", "mau_sac", "Màu sắc"]) || "";
      const size = normalizeKey(row, ["size", "kich_thuoc", "kichThuoc", "Size"]) || "";
      const orderedQty = parseInt(normalizeKey(row, ["số lượng đặt", "ordered_quantity", "orderedQuantity", "Số lượng đặt"])) || 0;
      const receivedQty = parseInt(normalizeKey(row, ["số lượng nhận", "received_quantity", "receivedQuantity", "Số lượng nhận"])) || 0;
      
      const rawUnitPrice = normalizeKey(row, [
        "đơn giá", 
        "unit_price", 
        "unitPrice", 
        "Đơn giá", 
        "đơn giá (vnđ)", 
        "unit price (vnđ)",
        "Đơn giá (VNĐ)",
        "đơn giá (VNĐ)",
        "Unit Price",
        "Unit price",
        "Don gia",
        "Don gia (VND)",
        "Đơn giá (VND)"
      ]);
      
      // Cải thiện việc parse đơn giá
      let unitPrice = 0;
      if (rawUnitPrice !== undefined && rawUnitPrice !== null && rawUnitPrice !== "") {
        // Nếu là số, sử dụng trực tiếp
        if (typeof rawUnitPrice === 'number') {
          unitPrice = rawUnitPrice;
        } else {
          // Nếu là string, parse bằng hàm parseVietnameseCurrency
          unitPrice = parseVietnameseCurrency(rawUnitPrice);
        }
      }
      
      const notes = normalizeKey(row, ["ghi chú", "notes", "note", "Ghi chú"]) || "";

      // Debug logging chi tiết hơn
      console.log(`Row ${index + 1} - Unit Price Processing:`, {
        productName,
        rawUnitPrice,
        rawUnitPriceType: typeof rawUnitPrice,
        parsedUnitPrice: unitPrice,
        receivedQty,
        orderedQty,
        rowData: row // Log toàn bộ row data để xem có gì khác không
      });

      // Tạo item đơn giản - lấy dữ liệu TRỰC TIẾP từ Excel
      const processedItem = {
        purchaseOrderItemId: `excel_${index}`,
        productId: `excel_${index}`,
        productName: productName,
        selectedColor: color,
        colorName: color,
        selectedSize: size,
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        unitPrice: unitPrice, // Lấy TRỰC TIẾP từ Excel
        condition: "good" as const,
        notes: notes,
      };
      
      return processedItem;
    });

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
      "Tên sản phẩm": item.TenSP || item.productName || "",
      "Màu sắc": item.ChiTietSanPham?.Mau?.TenMau || item.Mau?.TenMau || "",
      "Size": item.ChiTietSanPham?.KichThuoc?.TenKichThuoc || item.KichThuoc?.TenKichThuoc || "",
      "Đơn vị tính": "Cái",
      "Số lượng đặt": item.SoLuong || item.quantity || 0,
      "Số lượng nhận": "", // Để trống để người dùng điền
      "Đơn giá (VNĐ)": item.DonGia || item.unitPrice || 0,
      "Thành tiền (VNĐ)": (item.SoLuong || item.quantity || 0) * (item.DonGia || item.unitPrice || 0),
      "Ghi chú": "", // Để trống để người dùng điền
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
      { width: 5 },   // STT
      { width: 40 },  // Tên sản phẩm
      { width: 15 },  // Màu sắc
      { width: 10 },  // Size
      { width: 15 },  // Đơn vị tính
      { width: 15 },  // Số lượng đặt
      { width: 15 },  // Số lượng nhận
      { width: 15 },  // Đơn giá (VNĐ)
      { width: 15 },  // Thành tiền (VNĐ)
      { width: 30 },  // Ghi chú
    ];

    XLSX.writeFile(wb, `goods_receipt_template_${selectedPO?.MaPDH || selectedPO?.id || "unknown"}.xlsx`);
    
    toast({
      title: "Tải template thành công",
      description: "File template Excel đã được tải về. Chỉ cần điền số lượng nhận và ghi chú (nếu cần).",
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
    setWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheet("");
    setRawExcelData([]);
    setDataStartRow(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    // Reset file input trước khi mở file picker
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Trigger file input click
    fileInputRef.current?.click();
  };

  // Function to check if a row has errors
  const getRowErrors = (rowIndex: number): ValidationError[] => {
    return validationErrors.filter(error => error.row === rowIndex + 2); // +2 because Excel rows start from 2
  };

  // Function to get row styling based on errors
  const getRowStyle = (rowIndex: number) => {
    const errors = getRowErrors(rowIndex);
    if (errors.length > 0) {
      return "bg-red-50 border-l-4 border-red-500";
    }
    return "";
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
                onClick={handleUploadClick}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File Excel
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {/* Ẩn thông báo lỗi - chỉ hiển thị lỗi trong bảng */}

          {/* Data Display - Always show when there's data */}
          {excelData.length > 0 && (
            <div className="space-y-4">
              <Alert variant={validationErrors.length === 0 ? "default" : "destructive"}>
                {validationErrors.length === 0 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      {validationErrors.length === 0 
                        ? `Đã import thành công ${excelData.length} dòng dữ liệu từ Excel`
                        : `Đã import ${excelData.length} dòng dữ liệu từ Excel (có ${validationErrors.length} lỗi)`
                      }
                    </span>
                    <div className="flex gap-2">
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
            </div>
          )}
        </div>

        {/* Đã xóa Preview Dialog */}

        {/* Sheet Selection Dialog */}
        <Dialog open={isSheetDialogOpen} onOpenChange={setIsSheetDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chọn Sheet và Preview dữ liệu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Sheet Selection */}
              <div>
                <h3 className="text-sm font-medium mb-2">Chọn Sheet:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableSheets.map((sheetName) => (
                    <Button
                      key={sheetName}
                      variant={selectedSheet === sheetName ? "default" : "outline"}
                      onClick={() => loadSheetData(sheetName)}
                      className="justify-start"
                    >
                      {sheetName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              {selectedSheet && rawExcelData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">
                      Preview dữ liệu từ sheet "{selectedSheet}"
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      Dữ liệu bắt đầu từ dòng {dataStartRow + 1} • {rawExcelData.length} dòng
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(rawExcelData[0] || {}).map((header, index) => (
                            <TableHead key={index} className="text-xs">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rawExcelData.slice(0, 5).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <TableCell key={colIndex} className="text-xs">
                                {value?.toString() || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {rawExcelData.length > 5 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        ... và {rawExcelData.length - 5} dòng khác
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsSheetDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={processSelectedSheet}
                  disabled={!selectedSheet || rawExcelData.length === 0}
                >
                  Import dữ liệu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 