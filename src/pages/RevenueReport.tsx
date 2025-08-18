import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { getRevenueReport } from '../services/api';
import { useApp } from '@/contexts/AppContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface RevenueReportData {
  thang: number;
  nam: number;
  doanhThu: number;
}

interface ProcessedReportData {
  stt: number;
  period: number; // Tháng hoặc Quý
  nam: string;
  doanhThu: number;
}

export default function RevenueReport() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<'quarter' | 'month'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<RevenueReportData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedReportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [exportType, setExportType] = useState<'excel' | 'word' | ''>('');
  const [exporting, setExporting] = useState(false);
  
  // Add state to track if data needs to be refreshed
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    reportType: 'quarter' | 'month';
    startDate: string;
    endDate: string;
  } | null>(null);
  
  const { toast } = useToast();
  const handleExport = async () => {
    if (!exportType) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn loại file muốn xuất",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      if (exportType === 'excel') {
        await exportToExcel();
      } else if (exportType === 'word') {
        await exportToWord();
      }
      
      // Reset export type sau khi xuất thành công
      setExportType('');
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xuất file",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Check if current params match last generated params
  const isDataUpToDate = lastGeneratedParams && 
    lastGeneratedParams.reportType === reportType &&
    lastGeneratedParams.startDate === startDate &&
    lastGeneratedParams.endDate === endDate;

  const generateReport = async () => {
    setLoading(true);
    try {
      // Validate date inputs
      if (!startDate || !endDate) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ngày bắt đầu và ngày kết thúc",
          variant: "destructive",
        });
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        toast({
          title: "Lỗi",
          description: "Ngày bắt đầu không thể lớn hơn ngày kết thúc",
          variant: "destructive",
        });
        return;
      }

      // Call API
      const result = await getRevenueReport(startDate, endDate);
      console.log("Revenue Report Result:", result);

      // Check if API returned error
      if (result?.error) {
        throw new Error(result.message || 'Có lỗi xảy ra khi gọi API');
      }

      // Check if result is valid array
      if (!Array.isArray(result)) {
        throw new Error('Dữ liệu trả về không hợp lệ - dữ liệu phải là mảng');
      }

      // Check if array is empty
      if (result.length === 0) {
        toast({
          title: "Thông báo",
          description: "Không có dữ liệu báo cáo trong khoảng thời gian đã chọn",
        });
        setReportData([]);
        setProcessedData([]);
        setTotalRevenue(0);
        setLastGeneratedParams({ reportType, startDate, endDate });
        return;
      }

      // Validate data structure
      const isValidData = result.every(item => 
        item && 
        typeof item === 'object' &&
        item.hasOwnProperty('thang') &&
        item.hasOwnProperty('nam') &&
        item.hasOwnProperty('doanhThu')
      );

      if (!isValidData) {
        throw new Error('Cấu trúc dữ liệu không hợp lệ');
      }

      // Process and set data
      setReportData(result);
      processReportData(result);
      
      // Save the parameters used to generate this data
      setLastGeneratedParams({ reportType, startDate, endDate });
      
      toast({
        title: "Thành công",
        description: "Lấy báo cáo doanh thu thành công",
      });

    } catch (error) {
      console.error("Revenue Report Error:", error);
      
      // Reset data on error
      setReportData([]);
      setProcessedData([]);
      setTotalRevenue(0);
      setLastGeneratedParams(null);
      
      const errorMessage = error instanceof Error ? error.message : 'Không thể lấy báo cáo doanh thu';
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset data when params change
  const handleParamChange = (newReportType?: 'quarter' | 'month', newStartDate?: string, newEndDate?: string) => {
    const updatedReportType = newReportType ?? reportType;
    const updatedStartDate = newStartDate ?? startDate;
    const updatedEndDate = newEndDate ?? endDate;

    // Check if any parameter has changed from last generated data
    if (lastGeneratedParams && (
      lastGeneratedParams.reportType !== updatedReportType ||
      lastGeneratedParams.startDate !== updatedStartDate ||
      lastGeneratedParams.endDate !== updatedEndDate
    )) {
      // Reset data when parameters change
      setReportData([]);
      setProcessedData([]);
      setTotalRevenue(0);
      setLastGeneratedParams(null);
    }

    // Update the changed parameter
    if (newReportType !== undefined) setReportType(newReportType);
    if (newStartDate !== undefined) setStartDate(newStartDate);
    if (newEndDate !== undefined) setEndDate(newEndDate);
  };

  const getQuarterFromMonth = (month: number) => {
    return Math.ceil(month / 3);
  };

  const generateAllPeriods = (startDate: string, endDate: string, reportType: 'quarter' | 'month'): ProcessedReportData[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const periods: ProcessedReportData[] = [];
  
  if (reportType === 'month') {
    // Tạo tất cả các tháng từ startDate đến endDate
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endPeriod = new Date(end.getFullYear(), end.getMonth(), 1);
    
    let stt = 1;
    while (current <= endPeriod) {
      periods.push({
        stt: stt++,
        period: current.getMonth() + 1, // Tháng (1-12)
        nam: current.getFullYear().toString(),
        doanhThu: 0 // Mặc định là 0, sẽ được cập nhật nếu có dữ liệu
      });
      
      // Chuyển sang tháng tiếp theo
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Tạo tất cả các quý từ startDate đến endDate
    const startQuarter = Math.ceil((start.getMonth() + 1) / 3);
    const startYear = start.getFullYear();
    const endQuarter = Math.ceil((end.getMonth() + 1) / 3);
    const endYear = end.getFullYear();
    
    let stt = 1;
    for (let year = startYear; year <= endYear; year++) {
      const firstQuarter = year === startYear ? startQuarter : 1;
      const lastQuarter = year === endYear ? endQuarter : 4;
      
      for (let quarter = firstQuarter; quarter <= lastQuarter; quarter++) {
        periods.push({
          stt: stt++,
          period: quarter, // Quý (1-4)
          nam: year.toString(),
          doanhThu: 0 // Mặc định là 0, sẽ được cập nhật nếu có dữ liệu
        });
      }
    }
  }
  
  return periods;
};

// Helper function để merge dữ liệu API với periods đầy đủ
const mergeDataWithPeriods = (
  allPeriods: ProcessedReportData[], 
  apiData: RevenueReportData[], 
  reportType: 'quarter' | 'month'
): ProcessedReportData[] => {
  // Tạo map cho việc lookup nhanh
  const dataMap = new Map<string, number>();
  
  if (reportType === 'month') {
    // Map theo tháng-năm
    apiData.forEach(item => {
      const key = `${item.thang}-${item.nam}`;
      dataMap.set(key, item.doanhThu);
    });
    
    // Cập nhật doanh thu cho các periods
    return allPeriods.map(period => {
      const key = `${period.period}-${period.nam}`;
      return {
        ...period,
        doanhThu: dataMap.get(key) || 0
      };
    });
  } else {
    // Map theo quý-năm (cần group tháng thành quý)
    const quarterMap = new Map<string, number>();
    
    apiData.forEach(item => {
      const quarter = Math.ceil(item.thang / 3);
      const key = `${quarter}-${item.nam}`;
      
      if (quarterMap.has(key)) {
        quarterMap.set(key, quarterMap.get(key)! + item.doanhThu);
      } else {
        quarterMap.set(key, item.doanhThu);
      }
    });
    
    // Cập nhật doanh thu cho các periods
    return allPeriods.map(period => {
      const key = `${period.period}-${period.nam}`;
      return {
        ...period,
        doanhThu: quarterMap.get(key) || 0
      };
    });
  }
};
  const processReportData = (data: RevenueReportData[]) => {
  // Tạo tất cả các periods trong khoảng thời gian
  const allPeriods = generateAllPeriods(startDate, endDate, reportType);
  
  // Merge với dữ liệu từ API
  const mergedData = mergeDataWithPeriods(allPeriods, data, reportType);
  
  // Tính tổng doanh thu
  const total = mergedData.reduce((sum, item) => sum + item.doanhThu, 0);
  
  setProcessedData(mergedData);
  setTotalRevenue(total);
};

const formatPeriodDisplay = (period: number, reportType: 'quarter' | 'month') => {
  if (reportType === 'quarter') {
    return `Quý ${period}`;
  } else {
    return `Tháng ${period.toString().padStart(2, '0')}`;
  }
};

// Cập nhật formatPrice function để handle 0 values
const formatPrice = (price: number) => {
  if (price === 0) return '0';
  return new Intl.NumberFormat('vi-VN').format(price);
};

  const getDateRangeText = () => {
    if (!lastGeneratedParams) return '';
    
    const startDateObj = new Date(lastGeneratedParams.startDate);
    const endDateObj = new Date(lastGeneratedParams.endDate);
    const startFormatted = `${startDateObj.getDate().toString().padStart(2, '0')}/${(startDateObj.getMonth() + 1).toString().padStart(2, '0')}/${startDateObj.getFullYear()}`;
    const endFormatted = `${endDateObj.getDate().toString().padStart(2, '0')}/${(endDateObj.getMonth() + 1).toString().padStart(2, '0')}/${endDateObj.getFullYear()}`;
    return `${startFormatted} - ${endFormatted}`;
  };

  const getReportTitle = () => {
    if (!lastGeneratedParams) return '';
    
    if (lastGeneratedParams.reportType === 'quarter') {
      return `BÁO CÁO DOANH THU THEO QUÝ`;
    } else {
      return `BÁO CÁO DOANH THU THEO THÁNG`;
    }
  };

  const formatPeriodWithYear = (period: number, year: string, reportType: 'quarter' | 'month') => {
  if (reportType === 'quarter') {
    return `Quý ${period}/${year}`;
  } else {
    return `${period.toString().padStart(2, '0')}/${year}`;
  }
};

  const getPeriodColumnName = () => {
  if (!lastGeneratedParams) return 'Tháng/Năm';
  return lastGeneratedParams.reportType === 'quarter' ? 'Quý/Năm' : 'Tháng/Năm';
};

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RevenueReport');

  // Thêm margin: start từ column B và row 2
  const startCol = 2; // Column B (cách lề trái 1)
  const startRow = 2; // Row 2 (cách top 1 hàng)

  // Title - 3TSHOP (chiếm 6 cột thay vì 3)
  const titleEndCol = startCol + 5; // B đến G (6 cột)
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${startRow}:${String.fromCharCode(65 + titleEndCol - 1)}${startRow}`);
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${startRow}`).value = '3TSHOP';
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${startRow}`).font = { 
    size: 56, // Tăng từ 28 lên 56
    bold: true, 
    color: { argb: '815b31' }
  };
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(startRow).height = 100; // Tăng từ 50 lên 100

  // Empty row
  worksheet.addRow([]);

  // Report Title (chiếm 6 cột)
  const reportTitleRow = startRow + 2;
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${reportTitleRow}:${String.fromCharCode(65 + titleEndCol - 1)}${reportTitleRow}`);
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${reportTitleRow}`).value = getReportTitle();
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${reportTitleRow}`).font = { 
    size: 32, // Tăng từ 16 lên 32
    bold: true, 
    color: { argb: 'FF374151' }
  };
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${reportTitleRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(reportTitleRow).height = 70; // Tăng từ 35 lên 70

  // Time range (chiếm 6 cột)
  const timeRangeRow = reportTitleRow + 1;
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${timeRangeRow}:${String.fromCharCode(65 + titleEndCol - 1)}${timeRangeRow}`);
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${timeRangeRow}`).value = `Thời gian: từ ${getDateRangeText()}`;
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${timeRangeRow}`).font = { 
    size: 24, // Tăng từ 12 lên 24
    color: { argb: 'FF6B7280' }
  };
  worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${timeRangeRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(timeRangeRow).height = 50; // Tăng từ 25 lên 50

  // Empty rows
  worksheet.addRow([]);
  worksheet.addRow([]);

  // Info section title
  const infoTitleRow = timeRangeRow + 3;
  // worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${infoTitleRow}`).value = 'Thông tin người tạo báo cáo:';
  // worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${infoTitleRow}`).font = { 
  //   size: 14, // Tăng từ 14 lên 28
  //   bold: true, 
  //   color: { argb: 'FF374151' }
  // };
  // worksheet.getRow(infoTitleRow).height = 40; // Thêm height

  // Info details
  const infoData = [
    [`Họ và tên:`, `${state.user?.name || 'Admin'}`],
    [`Chức vụ:`, `${state.user?.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}`],
    [`Ngày lập báo cáo:`, `${new Date().toLocaleDateString('vi-VN')}`]
  ];

  infoData.forEach((info, index) => {
    const rowNum = infoTitleRow + 1 + index;
    worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${rowNum}`).value = info[0];
    worksheet.getCell(`${String.fromCharCode(65 + startCol - 1)}${rowNum}`).font = { 
      size: 14, // Tăng từ 11 lên 22
      bold: true,
      color: { argb: 'FF374151' }
    };
    
    worksheet.getCell(`${String.fromCharCode(65 + startCol)}${rowNum}`).value = info[1]; // Column C
    worksheet.getCell(`${String.fromCharCode(65 + startCol)}${rowNum}`).font = { 
      size: 14, // Tăng từ 11 lên 22
      color: { argb: 'FF374151' }
    };
    worksheet.getRow(rowNum).height = 35; // Thêm height
  });

  // Empty rows before table
  worksheet.addRow([]);
  worksheet.addRow([]);

  // Table Headers (bắt đầu từ column B, chiếm 6 cột)
  const headerRowNum = infoTitleRow + infoData.length + 3;
const headerRow = worksheet.addRow([
  '', // Column A (empty for margin)
  getPeriodColumnName(), // Column B (Tháng/Năm hoặc Quý/Năm chiếm B:D)
  '', // Column C (part of Tháng/Năm)
  '', // Column D (part of Tháng/Năm)
  'Doanh Thu (VNĐ)', // Column E (Doanh Thu chiếm E:G)
  '', // Column F (part of Doanh Thu)
  '' // Column G (part of Doanh Thu)
]);

// Merge cells cho headers (Period chiếm 3 cột, Doanh Thu chiếm 3 cột)
worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${headerRowNum}:${String.fromCharCode(65 + startCol + 1)}${headerRowNum}`); // B:D cho Tháng/Năm
worksheet.mergeCells(`${String.fromCharCode(65 + startCol + 2)}${headerRowNum}:${String.fromCharCode(65 + startCol + 4)}${headerRowNum}`); // E:G cho Doanh Thu

// Style header row (style tất cả 6 cột từ B đến G)
for (let col = startCol; col <= startCol + 5; col++) {
  const cell = headerRow.getCell(col);
  cell.font = { 
    bold: true, 
    size: 14,
    color: { argb: 'FF111827' }
  };
  cell.alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' }
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };
}
headerRow.height = 60;

// Data rows - cập nhật để có 2 cột thay vì 3
processedData.forEach(item => {
  const dataRow = worksheet.addRow([
    '', // Column A (empty for margin)
    formatPeriodWithYear(item.period, item.nam, reportType), // Column B (Period/Year chiếm B:D)
    '', // Column C (part of period/year - empty)
    '', // Column D (part of period/year - empty)
    item.doanhThu, // Column E (Doanh Thu chiếm E:G)
    '', // Column F (part of Doanh Thu - empty)
    '' // Column G (part of Doanh Thu - empty)
  ]);

  // Merge cells cho data (Period chiếm 3 cột, Doanh Thu chiếm 3 cột)
  const currentRowNum = dataRow.number;
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${currentRowNum}:${String.fromCharCode(65 + startCol + 1)}${currentRowNum}`); // B:D
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol + 2)}${currentRowNum}:${String.fromCharCode(65 + startCol + 4)}${currentRowNum}`); // E:G

  // Style data cells (style tất cả 6 cột từ B đến G)
  for (let col = startCol; col <= startCol + 5; col++) {
    const cell = dataRow.getCell(col);
    cell.font = {
      size: 14,
      color: item.doanhThu === 0 ? { argb: 'FF9CA3AF' } : { argb: 'FF000000' }
    };
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Format currency column (Columns E:G)
    if (col >= startCol + 2) {
      cell.numFmt = '#,##0';
    }
  }
  dataRow.height = 40;
});

// Total row - cập nhật layout
const totalRow = worksheet.addRow([
  '', // Column A (empty)
  'Tổng doanh thu:', // Column B (Label chiếm B:D)
  '', // Column C (part of label)
  '', // Column D (part of label)
  totalRevenue, // Column E (Amount chiếm E:G)
  '', // Column F (part of amount)
  '' // Column G (part of amount)
]);

// Merge cells cho total row
const totalRowNum = totalRow.number;
worksheet.mergeCells(`${String.fromCharCode(65 + startCol - 1)}${totalRowNum}:${String.fromCharCode(65 + startCol + 1)}${totalRowNum}`); // B:D cho label
worksheet.mergeCells(`${String.fromCharCode(65 + startCol + 2)}${totalRowNum}:${String.fromCharCode(65 + startCol + 4)}${totalRowNum}`); // E:G cho amount

// Style total row
for (let col = startCol; col <= startCol + 5; col++) {
  const cell = totalRow.getCell(col);
  cell.alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  if (col >= startCol - 1 && col <= startCol + 1) {
    // "Tổng doanh thu:" label (Columns B:D)
    cell.font = { 
      bold: true, 
      size: 14,
      color: { argb: 'FF374151' }
    };
    cell.alignment = { 
      horizontal: 'right', 
      vertical: 'middle' 
    };
  } else if (col >= startCol + 2) {
    // Amount in red (Columns E:G)
    cell.font = { 
      bold: true, 
      size: 14,
      color: { argb: 'FFDC2626' }
    };
    cell.numFmt = '#,##0';
  }
}
totalRow.height = 50;

// Cập nhật signature section layout
const signatureRowNum = worksheet.lastRow.number + 2; // Thêm 1 row spacing

  // Signature title cho người phê duyệt (căn giữa - columns E:G)
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${signatureRowNum}`).value = 'Người phê duyệt'; // Column E

  // Merge cells cho signature title (chiếm 3 cột E:G thay vì D:F)
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol + 2)}${signatureRowNum}:${String.fromCharCode(65 + startCol + 4)}${signatureRowNum}`); // E:G cho "Người phê duyệt"

  // Style signature title
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${signatureRowNum}`).font = { 
    size: 14,
    bold: true, 
    color: { argb: 'FF374151' }
  };
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${signatureRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  worksheet.getRow(signatureRowNum).height = 30;

  // Signature note
  const noteRowNum = signatureRowNum + 1;
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${noteRowNum}`).value = '(Ký và ghi rõ họ & tên)'; // Column E

  // Merge cells cho signature note (chiếm 3 cột E:G thay vì D:F)
  worksheet.mergeCells(`${String.fromCharCode(65 + startCol + 2)}${noteRowNum}:${String.fromCharCode(65 + startCol + 4)}${noteRowNum}`); // E:G cho note

  // Style signature note
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${noteRowNum}`).font = { 
    size: 12,
    italic: true, 
    color: { argb: 'FF6B7280' }
  };
  worksheet.getCell(`${String.fromCharCode(65 + startCol + 2)}${noteRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };
  worksheet.getRow(noteRowNum).height = 20;

  // Cập nhật column widths cho layout 2 cột
  worksheet.columns = [
    { width: 5 },   // Column A (margin)
    { width: 25 },  // Column B - Period/Year part 1
    { width: 25 },  // Column C - Period/Year part 2
    { width: 25 },  // Column D - Period/Year part 3
    { width: 25 },  // Column E - Doanh Thu part 1
    { width: 25 },  // Column F - Doanh Thu part 2
    { width: 25 },  // Column G - Doanh Thu part 3
  ];

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const dateStr = getDateRangeText().replace(/[\/\s\(\)\-]/g, '_');
  saveAs(blob, `BaoCaoDoanhThu_${dateStr}.xlsx`);

  toast({
    title: "Thành công",
    description: "Xuất file Excel thành công",
  });
};

const exportToWord = () => {
  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.5;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
          }

          .company-name {
            font-size: 48px;
            font-weight: bold;
            color: #815b31;
            margin-bottom: 10px;
          }

          .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
          }

          .time-range {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 20px;
          }

          .info-section {
            margin-bottom: 30px;
          }

          .info-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
          }

          .info-item {
            margin-bottom: 8px;
            display: flex;
          }

          .info-label {
            font-weight: 500;
            width: 200px;
            display: inline-block;
          }

          .info-value {
            flex: 1;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }

          .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }

          .data-table th {
            background-color: #F9FAFB;
            font-weight: bold;
            color: #111827;
          }

          .data-table thead {
            display: table-header-group;
          }
          .data-table tbody {
            display: table-row-group;
          }
          .data-table tr {
            page-break-inside: avoid;
          }

          .total-section {
            text-align: right;
            margin: 20px 0;
          }

          .total-text {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
          }

          .total-amount {
            color: #DC2626;
          }

          /* Table layout cho signature section với 2 rows riêng biệt */
          .signature-table {
            width: 100%;
            margin: 60px 0 0 0;
            border-collapse: collapse;
            border: none;
            border-spacing: 0; /* Loại bỏ spacing giữa cells */
          }

          .signature-table td {
            border: none;
            padding: 0;
            margin: 0;
            vertical-align: top;
            line-height: 1; /* Giảm line-height xuống minimum */
          }

          .signature-table .left-cell {
            width: 50%;
            text-align: left;
          }

          .signature-table .right-cell {
            width: 50%;
            text-align: center;
          }

          .signature-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin: 0;
            padding: 0;
            line-height: 1; /* Giảm line-height */
          }

          .signature-note {
            font-size: 12px;
            font-style: italic;
            color: #6B7280;
            margin: 0;
            padding: 0;
            line-height: 1; /* Giảm line-height */
          }

          .signature-line {
            border-bottom: 1px solid #D1D5DB;
            height: 50px;
            margin: 20px auto 0 auto;
            width: 200px;
          }

          /* Loại bỏ spacing giữa rows */
          .signature-table tr {
            margin: 0;
            padding: 0;
            height: auto;
          }

          @media print {
            .signature-table {
              position: relative;
              margin-top: 40px;
            }
            
            .data-table thead {
              display: table-header-group;
            }
            
            .data-table tr {
              page-break-inside: avoid;
            }
            
            .data-table {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">3TSHOP</div>
          <div class="report-title">${getReportTitle()}</div>
          <div class="time-range">Thời gian: từ ${getDateRangeText()}</div>
        </div>
        
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">Họ và tên:</span>
            <span class="info-value">${state.user?.name || 'Admin'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Chức vụ:</span>
            <span class="info-value">${state.user?.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Thời gian lập báo cáo:</span>
            <span class="info-value">${new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>${getPeriodColumnName()}</th>
              <th>Doanh Thu (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${processedData.map(item => `
              <tr style="${item.doanhThu === 0 ? 'color: #9CA3AF;' : ''}">
                <td>${formatPeriodWithYear(item.period, item.nam, reportType)}</td>
                <td>${formatPrice(item.doanhThu)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <span class="total-text">
            Tổng doanh thu: <span class="total-amount">${formatPrice(totalRevenue)} VNĐ</span>
          </span>
        </div>

        <!-- Table layout với 2 rows riêng biệt cho signature section -->
        <table class="signature-table">
          <!-- Row 1: Người phê duyệt -->
          <tr>
            <td class="left-cell">
              <!-- Cột trái để trống -->
            </td>
            <td class="right-cell">
              <div class="signature-title">Người phê duyệt</div>
            </td>
          </tr>
          <!-- Row 2: (Ký và ghi rõ họ & tên) - ngay sát dưới -->
          <tr>
            <td class="left-cell">
              <!-- Cột trái để trống -->
            </td>
            <td class="right-cell">
              <div class="signature-note">(Ký và ghi rõ họ & tên)</div>
              <div class="signature-line"></div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCaoDoanhThu_${getDateRangeText().replace(/[\/\s]/g, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);

  toast({
    title: "Thành công",
    description: "Xuất file Word thành công",
  });
};
  const resetForm = () => {
    setReportData([]);
    setProcessedData([]);
    setShowPreview(false);
    setTotalRevenue(0);
    setLastGeneratedParams(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full flex items-center gap-1 text-xs h-8">
          <TrendingUp className="h-3 w-3" />
          Báo Cáo Doanh Thu
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Báo Cáo Doanh Thu
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Phần 1: Chọn Thời Gian Báo Cáo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Chọn Thời Gian Báo Cáo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-4 flex-wrap">
                {/* Combobox chọn loại báo cáo */}
                <div className="w-36">
                  <Label htmlFor="reportType">Loại Báo Cáo</Label>
                  <Select 
                    value={reportType} 
                    onValueChange={(value) => handleParamChange(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarter">Theo Quý</SelectItem>
                      <SelectItem value="month">Theo Tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ngày bắt đầu và kết thúc */}
                <div className="w-40">
                  <Label htmlFor="startDate">Ngày Bắt Đầu</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleParamChange(undefined, e.target.value, undefined)}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="endDate">Ngày Kết Thúc</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => handleParamChange(undefined, undefined, e.target.value)}
                  />
                </div>

                {/* Nút lấy dữ liệu */}
                <div className="ml-auto">
                  <Button onClick={generateReport} disabled={loading} className="h-10">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang Lấy...
                      </>
                    ) : (
                      'Lấy dữ liệu báo cáo'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Warning message when data is outdated */}
              {processedData.length > 0 && !isDataUpToDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Bạn đã thay đổi thông tin báo cáo. Vui lòng nhấn "Lấy dữ liệu báo cáo" để cập nhật dữ liệu mới.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phần 2: Dữ Liệu Báo Cáo */}
          <Card className="min-h-[400px]">
  <CardHeader>
    <div className="flex justify-between items-center">
      <CardTitle>Dữ Liệu Báo Cáo</CardTitle>
      {processedData.length > 0 && isDataUpToDate && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {/* Select cho loại file */}
                    <Select value={exportType} onValueChange={(value) => setExportType(value as 'excel' | 'word')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Chọn file" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="word">Word (.doc)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Nút Xuất file */}
                    <Button 
                      onClick={handleExport}
                      disabled={!exportType || exporting}
                      className="flex items-center gap-2"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xuất...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Xuất file
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
    {processedData.length > 0 && isDataUpToDate && (
      <p className="text-sm text-muted-foreground">
        Thời gian: {getDateRangeText()}
      </p>
    )}
  </CardHeader>

    <CardContent>
    {processedData.length > 0 && isDataUpToDate ? (
      <>
        <div className="max-h-80 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[50%] text-center border-r">{getPeriodColumnName()}</TableHead>
                <TableHead className="w-[50%] text-center">Doanh Thu (VNĐ)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((item, index) => (
                <TableRow key={`${item.period}-${item.nam}`} className={item.doanhThu === 0 ? 'text-gray-400' : ''}>
                  <TableCell className="w-[50%] text-center border-r font-medium">
                    {formatPeriodWithYear(item.period, item.nam, reportType)}
                  </TableCell>
                  <TableCell className="w-[50%] text-right font-mono">
                    {item.doanhThu === 0 ? (
                      <span className="text-gray-400">0 VNĐ</span>
                    ) : (
                      `${formatPrice(item.doanhThu)} VNĐ`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-end">
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
              Tổng Doanh Thu: {formatPrice(totalRevenue)} VNĐ
            </Badge>
          </div>
        </div>
      </>
    ) : lastGeneratedParams ? (
      // Trường hợp đã generate nhưng không có dữ liệu
      <div className="flex items-center justify-center h-80">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30 text-orange-400" />
          <p className="text-lg font-medium mb-2 text-orange-600">Không có dữ liệu doanh thu</p>
          <p className="text-sm text-gray-600 mb-1">
            Trong khoảng thời gian từ <span className="font-medium">{getDateRangeText()}</span>
          </p>
          <p className="text-sm text-gray-500">
            chưa có dữ liệu doanh thu nào được ghi nhận
          </p>
        </div>
      </div>
    ) : (
      // Trường hợp chưa generate báo cáo
      <div className="flex items-center justify-center h-80">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Chưa có dữ liệu báo cáo</p>
          <p className="text-sm">Vui lòng chọn thời gian và nhấn "Lấy dữ liệu báo cáo" để xem dữ liệu</p>
        </div>
      </div>
    )}
  </CardContent>
</Card>
        </div>

      {/* Preview Modal - only show when data is up to date */}
      {showPreview && isDataUpToDate && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Báo Cáo Doanh Thu</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-4">
              {/* Header Section */}
              <div className="text-center space-y-4">
                <h1 className="text-7xl font-bold" style={{ color: '#815b31' }}>3TSHOP</h1>
                <h2 className="text-2xl font-bold text-gray-800">{getReportTitle()}</h2>
                <p className="text-lg text-gray-600">
                  Thời gian: từ {getDateRangeText()}
                </p>
              </div>
              
              {/* Information Section */}
              <div className="py-4">
                <div className="space-y-2">
                  <div className="flex">
                    <span className="font-medium w-48">Họ và tên:</span>
                    <span className="flex-1">{state.user?.name || 'Admin'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-48">Chức vụ:</span>
                    <span className="flex-1">{state.user?.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium w-48">Thời gian lập báo cáo:</span>
                    <span className="flex-1">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-bold text-center border text-gray-900">{getPeriodColumnName()}</TableHead>
                      <TableHead className="font-bold text-center border text-gray-900">Doanh Thu (VNĐ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.map((item, index) => (
                      <TableRow key={`preview-${item.period}-${item.nam}`} className={item.doanhThu === 0 ? 'text-gray-400' : ''}>
                        <TableCell className="text-center border">
                          {formatPeriodWithYear(item.period, item.nam, reportType)}
                        </TableCell>
                        <TableCell className="text-center border">
                          {item.doanhThu === 0 ? (
                            <span className="text-gray-400">0</span>
                          ) : (
                            formatPrice(item.doanhThu)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total Section */}
              <div className="flex justify-end py-4">
                <div className="text-right space-y-2">
                  <p className="text-xl font-bold text-gray-800">
                    Tổng doanh thu: <span className="text-red-600">{formatPrice(totalRevenue)} VNĐ</span>
                  </p>
                </div>
              </div>

              {/* Signature Section */}
              <div className="flex justify-end mt-12 pt-8 mr-4">
                <div className="text-center space-y-8">
                  <div>
                    <p className="text-lg font-bold text-gray-800">Người phê duyệt</p>
                    <p className="text-sm italic text-gray-600 mt-1">(Ký và ghi rõ họ & tên)</p>
                  </div>
                  <div className="h-16 border-b border-gray-300 w-48 mx-auto"></div>
                </div>
              </div>

              {/* Print/Export buttons for preview */}
              <div className="flex justify-center gap-4 pt-6 border-t">
                
                <Button onClick={exportToExcel} variant="outline">
                  Xuất Excel
                </Button>
                <Button onClick={exportToWord} variant="outline">
                  Xuất Word
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      </DialogContent>
    </Dialog>
  );
}