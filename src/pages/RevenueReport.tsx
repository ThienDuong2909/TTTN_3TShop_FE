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
  
  // Add state to track if data needs to be refreshed
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    reportType: 'quarter' | 'month';
    startDate: string;
    endDate: string;
  } | null>(null);
  
  const { toast } = useToast();

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

  const processReportData = (data: RevenueReportData[]) => {
    let processed: ProcessedReportData[] = [];
    let total = 0;

    if (reportType === 'quarter') {
      // Group by quarter and year
      const quarterMap = new Map<string, { period: number; nam: number; doanhThu: number }>();
      
      data.forEach(item => {
        const quarter = getQuarterFromMonth(item.thang);
        const key = `${quarter}-${item.nam}`;
        
        if (quarterMap.has(key)) {
          quarterMap.get(key)!.doanhThu += item.doanhThu;
        } else {
          quarterMap.set(key, {
            period: quarter,
            nam: item.nam,
            doanhThu: item.doanhThu
          });
        }
      });

      // Convert map to array and sort
      const quarterArray = Array.from(quarterMap.values()).sort((a, b) => {
        if (a.nam !== b.nam) return a.nam - b.nam;
        return a.period - b.period;
      });

      processed = quarterArray.map((item, index) => ({
        stt: index + 1,
        period: item.period,
        nam: item.nam.toString(),
        doanhThu: item.doanhThu
      }));

      total = quarterArray.reduce((sum, item) => sum + item.doanhThu, 0);
    } else {
      // Process by month
      data.forEach((item, index) => {
        total += item.doanhThu;
        
        processed.push({
          stt: index + 1,
          period: item.thang,
          nam: item.nam.toString(),
          doanhThu: item.doanhThu
        });
      });
    }

    setProcessedData(processed);
    setTotalRevenue(total);
  };

  const formatPrice = (price: number) => {
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

  const getPeriodColumnName = () => {
    if (!lastGeneratedParams) return 'Tháng';
    return lastGeneratedParams.reportType === 'quarter' ? 'Quý' : 'Tháng';
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RevenueReport');

    // Title - 3TSHOP
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = '3TSHOP';
    worksheet.getCell('A1').font = { 
      size: 28, 
      bold: true, 
      color: { argb: '815b31' }
    };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 50;

    // Empty row
    worksheet.addRow([]);

    // Report Title
    worksheet.mergeCells('A3:D3');
    worksheet.getCell('A3').value = getReportTitle();
    worksheet.getCell('A3').font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FF374151' }
    };
    worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 35;

    // Time range
    worksheet.mergeCells('A4:D4');
    worksheet.getCell('A4').value = `Thời gian: từ ${getDateRangeText()}`;
    worksheet.getCell('A4').font = { 
      size: 12, 
      color: { argb: 'FF6B7280' }
    };
    worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(4).height = 25;

    // Empty rows
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Info section title
    worksheet.getCell('A7').value = 'Thông tin người tạo báo cáo:';
    worksheet.getCell('A7').font = { 
      size: 14, 
      bold: true, 
      color: { argb: 'FF374151' }
    };

    // Info details
    const infoData = [
      [`Họ và tên:`, `${state.user?.name || 'Admin'}`],
      [`Chức vụ:`, `${state.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}`],
      [`Thời gian lập báo cáo:`, `${new Date().toLocaleDateString('vi-VN')}`]
    ];

    infoData.forEach((info, index) => {
      const rowNum = 8 + index;
      worksheet.getCell(`A${rowNum}`).value = info[0];
      worksheet.getCell(`A${rowNum}`).font = { 
        size: 11, 
        bold: true,
        color: { argb: 'FF374151' }
      };
      
      worksheet.getCell(`C${rowNum}`).value = info[1];
      worksheet.getCell(`C${rowNum}`).font = { 
        size: 11,
        color: { argb: 'FF374151' }
      };
    });

    // Empty rows before table
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Table Headers
    const headerRow = worksheet.addRow([
      'STT', 
      getPeriodColumnName(), 
      'Năm', 
      'Doanh Thu (VNĐ)'
    ]);

    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { 
        bold: true, 
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
    });
    headerRow.height = 30;

    // Data rows
    processedData.forEach(item => {
      const dataRow = worksheet.addRow([
        item.stt,
        item.period,
        item.nam,
        item.doanhThu,
      ]);

      // Style data cells
      dataRow.eachCell((cell, colNumber) => {
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

        // Format currency column
        if (colNumber === 4) {
          cell.numFmt = '#,##0';
        }
      });
    });

    // Total row
    const totalRow = worksheet.addRow([
      '', '', 'Tổng doanh thu:', totalRevenue
    ]);

    totalRow.eachCell((cell, colNumber) => {
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

      if (colNumber === 3) {
        // "Tổng doanh thu:" label
        cell.font = { 
          bold: true, 
          color: { argb: 'FF374151' }
        };
        cell.alignment = { 
          horizontal: 'right', 
          vertical: 'middle' 
        };
      } else if (colNumber === 4) {
        // Amount in red
        cell.font = { 
          bold: true, 
          color: { argb: 'FFDC2626' }
        };
        cell.numFmt = '#,##0';
      } else {
        cell.font = { 
          bold: true, 
          color: { argb: 'FF374151' }
        };
      }
    });

    // Empty rows for signatures
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Signature section
    const signatureRowNum = worksheet.lastRow.number + 1;
    
    // Signature titles
    worksheet.getCell(`A${signatureRowNum}`).value = 'Người làm báo cáo';
    worksheet.getCell(`A${signatureRowNum}`).font = { 
      size: 14, 
      bold: true, 
      color: { argb: 'FF374151' }
    };
    worksheet.getCell(`A${signatureRowNum}`).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };

    worksheet.getCell(`D${signatureRowNum}`).value = 'Người phê duyệt';
    worksheet.getCell(`D${signatureRowNum}`).font = { 
      size: 14, 
      bold: true, 
      color: { argb: 'FF374151' }
    };
    worksheet.getCell(`D${signatureRowNum}`).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };

    // Signature notes
    const noteRowNum = signatureRowNum + 1;
    worksheet.getCell(`A${noteRowNum}`).value = '(Ký và ghi rõ họ & tên)';
    worksheet.getCell(`A${noteRowNum}`).font = { 
      size: 10, 
      italic: true, 
      color: { argb: 'FF6B7280' }
    };
    worksheet.getCell(`A${noteRowNum}`).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };

    worksheet.getCell(`D${noteRowNum}`).value = '(Ký và ghi rõ họ & tên)';
    worksheet.getCell(`D${noteRowNum}`).font = { 
      size: 10, 
      italic: true, 
      color: { argb: 'FF6B7280' }
    };
    worksheet.getCell(`D${noteRowNum}`).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };

    // Add space for signatures
    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Column widths
    worksheet.columns = [
      { width: 10 },  // STT
      { width: 15 },  // Tháng/Quý
      { width: 15 },  // Năm
      { width: 25 },  // Doanh Thu
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

            /* Ngăn chặn việc lặp lại header khi qua trang mới */
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

            /* Sử dụng table layout cho signature */
            .signature-table {
              width: 100%;
              margin-top: 60px;
              border-collapse: collapse;
            }

            .signature-table td {
              width: 50%;
              text-align: center;
              vertical-align: top;
              padding: 20px 40px;
              border: none;
            }

            .signature-title {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 3px;
            }

            .signature-note {
              font-size: 12px;
              font-style: italic;
              color: #6B7280;
              margin-bottom: 50px;
            }

            .signature-line {
              border-bottom: 1px solid #D1D5DB;
              height: 50px;
              margin: 0 auto;
              width: 200px;
            }

            /* CSS cho page break và print */
            @media print {
              .signature-table {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
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
            <div class="info-title">Thông tin người tạo báo cáo:</div>
            <div class="info-item">
              <span class="info-label">Họ và tên:</span>
              <span class="info-value">${state.user?.name || 'Admin'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Chức vụ:</span>
              <span class="info-value">${state.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Thời gian lập báo cáo:</span>
              <span class="info-value">${new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>${getPeriodColumnName()}</th>
                <th>Năm</th>
                <th>Doanh Thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${processedData.map(item => `
                <tr>
                  <td>${item.stt}</td>
                  <td>${item.period}</td>
                  <td>${item.nam}</td>
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

          <table class="signature-table">
            <tr>
              <td>
                <div class="signature-title">Người làm báo cáo</div>
                <div class="signature-note">(Ký và ghi rõ họ & tên)</div>
                <div class="signature-line"></div>
              </td>
              <td>
                <div class="signature-title">Người phê duyệt</div>
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
        <Button className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
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
                    <Select onValueChange={(value) => {
                      if (value === 'excel') exportToExcel();
                      if (value === 'word') exportToWord();
                    }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Xuất File" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Xuất Excel</SelectItem>
                        <SelectItem value="word">Xuất Word</SelectItem>
                      </SelectContent>
                    </Select>
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
                          <TableHead className="w-16">STT</TableHead>
                          <TableHead className="w-20">{getPeriodColumnName()}</TableHead>
                          <TableHead className="w-20">Năm</TableHead>
                          <TableHead className="w-32">Doanh Thu (VNĐ)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center">{item.stt}</TableCell>
                            <TableCell className="text-center">{item.period}</TableCell>
                            <TableCell className="text-center">{item.nam}</TableCell>
                            <TableCell className="text-right">{formatPrice(item.doanhThu)} VNĐ</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        Tổng Doanh Thu: {formatPrice(totalRevenue)} VNĐ
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
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
                  <h3 className="font-semibold text-lg text-gray-800 mb-4">Thông tin người tạo báo cáo:</h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="font-medium w-48">Họ và tên:</span>
                      <span className="flex-1">{state.user?.name || 'Admin'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-48">Chức vụ:</span>
                      <span className="flex-1">{state.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
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
                        <TableHead className="font-bold text-center border text-gray-900">STT</TableHead>
                        <TableHead className="font-bold text-center border text-gray-900">{getPeriodColumnName()}</TableHead>
                        <TableHead className="font-bold text-center border text-gray-900">Năm</TableHead>
                        <TableHead className="font-bold text-center border text-gray-900">Doanh Thu (VNĐ)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center border">{item.stt}</TableCell>
                          <TableCell className="text-center border">{item.period}</TableCell>
                          <TableCell className="text-center border">{item.nam}</TableCell>
                          <TableCell className="text-center border">{formatPrice(item.doanhThu)}</TableCell>
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
                <div className="flex justify-between mt-12 pt-8">
                  <div className="text-center space-y-8">
                    <div>
                      <p className="text-lg font-bold text-gray-800">Người làm báo cáo</p>
                      <p className="text-sm italic text-gray-600 mt-1">(Ký và ghi rõ họ & tên)</p>
                    </div>
                    <div className="h-16 border-b border-gray-300 w-48 mx-auto"></div>
                  </div>
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
                  <Button onClick={() => window.print()} variant="outline">
                    In Báo Cáo
                  </Button>
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