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
  MaLoaiSP: number;
  TenLoai: string;
  SanPhams: {
    MaSP: number;
    TenSP: string;
    DonGiaList: {
      DonGia: number;
      SoLuong: number;
    }[];
  }[];
}

interface ProcessedReportData {
  stt: number;
  maLoai: string;
  tenLoai: string;
  maSanPham: string;
  tenSanPham: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
}

export default function RevenueReport() {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<'quarter' | 'month' | 'custom'>('quarter');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState('1');
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<RevenueReportData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedReportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      let startDateParam = '';
      let endDateParam = '';

      // Calculate date range based on report type
      if (reportType === 'quarter') {
        const quarterStartMonth = (parseInt(selectedQuarter) - 1) * 3 + 1;
        const quarterEndMonth = quarterStartMonth + 2;
        startDateParam = `${selectedYear}-${quarterStartMonth.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(selectedYear), quarterEndMonth, 0).getDate();
        endDateParam = `${selectedYear}-${quarterEndMonth.toString().padStart(2, '0')}-${lastDay}`;
      } else if (reportType === 'month') {
        const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
        startDateParam = `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`;
        endDateParam = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${lastDay}`;
      } else {
        startDateParam = startDate;
        endDateParam = endDate;
      }

      // Validate date inputs for custom range
      if (reportType === 'custom') {
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
      }

      // Call API - result sẽ là mảng trực tiếp hoặc object lỗi
      const result = await getRevenueReport(startDateParam, endDateParam);
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
        return;
      }

      // Validate data structure
      const isValidData = result.every(category => 
        category && 
        typeof category === 'object' &&
        category.hasOwnProperty('MaLoaiSP') &&
        category.hasOwnProperty('TenLoai') &&
        category.hasOwnProperty('SanPhams') &&
        Array.isArray(category.SanPhams)
      );

      if (!isValidData) {
        throw new Error('Cấu trúc dữ liệu không hợp lệ');
      }

      // Process and set data - result đã là mảng data luôn
      setReportData(result);
      processReportData(result);
      
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

  const processReportData = (data: RevenueReportData[]) => {
    const processed: ProcessedReportData[] = [];
    let stt = 1;
    let total = 0;

    data.forEach(category => {
      category.SanPhams.forEach(product => {
        product.DonGiaList.forEach(price => {
          const thanhTien = price.DonGia * price.SoLuong;
          total += thanhTien;
          
          processed.push({
            stt: stt++,
            maLoai: `${category.MaLoaiSP.toString().padStart(2, '0')}`,
            tenLoai: category.TenLoai,
            maSanPham: `${product.MaSP.toString().padStart(2, '0')}`,
            tenSanPham: product.TenSP,
            soLuong: price.SoLuong,
            donGia: price.DonGia,
            thanhTien
          });
        });
      });
    });

    setProcessedData(processed);
    setTotalRevenue(total);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getDateRangeText = () => {
    if (reportType === 'quarter') {
      const quarterStartMonth = (parseInt(selectedQuarter) - 1) * 3 + 1;
      const quarterEndMonth = quarterStartMonth + 2;
      return `Quý ${selectedQuarter}/${selectedYear} (Tháng ${quarterStartMonth} - ${quarterEndMonth})`;
    } else if (reportType === 'month') {
      return `Tháng ${selectedMonth}/${selectedYear}`;
    } else {
      return `${startDate} - ${endDate}`;
    }
  };

  const getReportTitle = () => {
  if (reportType === 'quarter') {
    return `BÁO CÁO DOANH THU CỦA QUÝ ${selectedQuarter} NĂM ${selectedYear}`;
  } else if (reportType === 'month') {
    return `BÁO CÁO DOANH THU CỦA THÁNG ${selectedMonth} NĂM ${selectedYear}`;
  } else {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const startFormatted = `${startDateObj.getDate().toString().padStart(2, '0')}/${(startDateObj.getMonth() + 1).toString().padStart(2, '0')}/${startDateObj.getFullYear()}`;
    const endFormatted = `${endDateObj.getDate().toString().padStart(2, '0')}/${(endDateObj.getMonth() + 1).toString().padStart(2, '0')}/${endDateObj.getFullYear()}`;
    return `BÁO CÁO DOANH THU TỪ ${startFormatted} ĐẾN ${endFormatted}`;
  }
};
  const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RevenueReport');

  // Title - 3TSHOP (giống Preview: text-7xl font-bold text-primary)
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = '3TSHOP';
  worksheet.getCell('A1').font = { 
    size: 28, 
    bold: true, 
    color: { argb: '815b31' } // Primary blue color
  };
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 50; // Tăng chiều cao cho title

  // Empty row
  worksheet.addRow([]);

  // Report Title (giống Preview: text-2xl font-bold text-gray-800)
  worksheet.mergeCells('A3:H3');
  worksheet.getCell('A3').value = getReportTitle();
  worksheet.getCell('A3').font = { 
    size: 16, 
    bold: true, 
    color: { argb: 'FF374151' } // Gray-800
  };
  worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(3).height = 35;

  // Empty rows for spacing
  worksheet.addRow([]);
  worksheet.addRow([]);

  // Info section title (giống Preview: font-semibold text-lg text-gray-800)
  worksheet.getCell('A6').value = 'Thông tin người tạo báo cáo:';
  worksheet.getCell('A6').font = { 
    size: 14, 
    bold: true, 
    color: { argb: 'FF374151' }
  };

  // Info details với layout giống Preview (w-48 cho label, flex-1 cho content)
  const infoData = [
    [`Họ và tên:`, `${state.user?.name || 'Admin'}`],
    [`Chức vụ:`, `${state.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}`],
    [`Thời gian lập báo cáo:`, `${new Date().toLocaleDateString('vi-VN')}`]
  ];

  infoData.forEach((info, index) => {
    const rowNum = 7 + index;
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

  // Table Headers (giống Preview: font-bold text-center border text-gray-900, bg-gray-50)
  const headerRow = worksheet.addRow([
    'STT', 
    'Mã loại', 
    'Tên loại', 
    'Mã sản phẩm', 
    'Tên sản phẩm', 
    'Số lượng bán ra', 
    'Đơn giá bán ra (VNĐ)', 
    'Thành tiền (VND)'
  ]);

  // Style header row (giống Preview table header)
  headerRow.eachCell((cell) => {
    cell.font = { 
      bold: true, 
      color: { argb: 'FF111827' } // Gray-900
    };
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' } // Gray-50 background
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  headerRow.height = 30;

  // Data rows (giống Preview: text-center border)
  processedData.forEach(item => {
    const dataRow = worksheet.addRow([
      item.stt,
      item.maLoai,
      item.tenLoai,
      item.maSanPham,
      item.tenSanPham,
      item.soLuong,
      item.donGia,
      item.thanhTien,
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

      // Format currency columns
      if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
        cell.numFmt = '#,##0';
      }
    });
  });

  // Total row (giống Preview: font-bold, màu đỏ cho số tiền)
  const totalRow = worksheet.addRow([
    '', '', '', '', '', '', 'Tổng doanh thu:', totalRevenue
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

    if (colNumber === 7) {
      // "Tổng doanh thu:" label
      cell.font = { 
        bold: true, 
        color: { argb: 'FF374151' }
      };
      cell.alignment = { 
        horizontal: 'right', 
        vertical: 'middle' 
      };
    } else if (colNumber === 8) {
      // Amount in red (giống Preview: text-red-600)
      cell.font = { 
        bold: true, 
        color: { argb: 'FFDC2626' } // Red-600
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

  // Signature section (giống Preview: text-lg font-bold text-gray-800)
  const signatureRowNum = worksheet.lastRow.number + 1;
  
  // Signature titles
  worksheet.getCell(`B${signatureRowNum}`).value = 'Người làm báo cáo';
  worksheet.getCell(`B${signatureRowNum}`).font = { 
    size: 14, 
    bold: true, 
    color: { argb: 'FF374151' }
  };
  worksheet.getCell(`B${signatureRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };

  worksheet.getCell(`G${signatureRowNum}`).value = 'Người phê duyệt';
  worksheet.getCell(`G${signatureRowNum}`).font = { 
    size: 14, 
    bold: true, 
    color: { argb: 'FF374151' }
  };
  worksheet.getCell(`G${signatureRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };

  // Signature notes (giống Preview: text-sm italic text-gray-600)
  const noteRowNum = signatureRowNum + 1;
  worksheet.getCell(`B${noteRowNum}`).value = '(Ký và ghi rõ họ & tên)';
  worksheet.getCell(`B${noteRowNum}`).font = { 
    size: 10, 
    italic: true, 
    color: { argb: 'FF6B7280' } // Gray-600
  };
  worksheet.getCell(`B${noteRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };

  worksheet.getCell(`G${noteRowNum}`).value = '(Ký và ghi rõ họ & tên)';
  worksheet.getCell(`G${noteRowNum}`).font = { 
    size: 10, 
    italic: true, 
    color: { argb: 'FF6B7280' }
  };
  worksheet.getCell(`G${noteRowNum}`).alignment = { 
    horizontal: 'center', 
    vertical: 'middle' 
  };

  // Add space for signatures
  worksheet.addRow([]);
  worksheet.addRow([]);
  worksheet.addRow([]);

  // Column widths (giống Preview layout)
  worksheet.columns = [
    { width: 8 },   // STT
    { width: 12 },  // Mã loại  
    { width: 20 },  // Tên loại
    { width: 15 },  // Mã sản phẩm
    { width: 40 },  // Tên sản phẩm
    { width: 18 },  // Số lượng
    { width: 22 },  // Đơn giá
    { width: 22 },  // Thành tiền
  ];

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const dateStr = getDateRangeText().replace(/[\/\s\(\)\-]/g, '_');
  saveAs(blob, `RevenueReport_${dateStr}.xlsx`);

  toast({
    title: "Thành công",
    description: "Xuất file Excel thành công",
  });
};
  

//   const exportToWord = () => {
//   // Create HTML content for Word export
//   const htmlContent = `
//     <html>
//       <head>
//         <meta charset="utf-8">
//         <style>
//           body { 
//             font-family: Arial, sans-serif; 
//             margin: 20px;
//             line-height: 1.5;
//           }
//           .header { 
//             text-align: center; 
//             margin-bottom: 30px;
//           }
//           .company-name {
//             font-size: 48px;
//             font-weight: bold;
//             color: #815b31;
//             margin-bottom: 10px;
//           }
//           .report-title {
//             font-size: 18px;
//             font-weight: bold;
//             color: #374151;
//             margin-bottom: 20px;
//           }
//           .info-section { 
//             margin-bottom: 30px;
//           }
//           .info-title {
//             font-size: 16px;
//             font-weight: bold;
//             color: #374151;
//             margin-bottom: 15px;
//           }
//           .info-item {
//             margin-bottom: 8px;
//             display: flex;
//           }
//           .info-label {
//             font-weight: 500;
//             width: 200px;
//             display: inline-block;
//           }
//           .info-value {
//             flex: 1;
//           }
//           table { 
//             width: 100%; 
//             border-collapse: collapse; 
//             margin-bottom: 20px;
//           }
//           th, td { 
//             border: 1px solid #000; 
//             padding: 8px; 
//             text-align: center;
//             vertical-align: middle;
//           }
//           th { 
//             background-color: #F9FAFB; 
//             font-weight: bold;
//             color: #111827;
//           }
//           .total-section {
//             text-align: right;
//             margin: 20px 0;
//           }
//           .total-text {
//             font-size: 18px;
//             font-weight: bold;
//             color: #374151;
//           }
//           .total-amount {
//             color: #DC2626;
//           }
//           .signature { 
//             margin-top: 60px; 
//             display: flex; 
//             justify-content: space-between; 
//           }
//           .signature-block {
//             text-align: center;
//             width: 45%;
//           }
//           .signature-title {
//             font-size: 16px;
//             font-weight: bold;
//             color: #374151;
//             margin-bottom: 5px;
//           }
//           .signature-note {
//             font-size: 12px;
//             font-style: italic;
//             color: #6B7280;
//             margin-bottom: 50px;
//           }
//           .signature-line {
//             border-bottom: 1px solid #D1D5DB;
//             height: 50px;
//             margin: 0 auto;
//             width: 200px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <div class="company-name">3TSHOP</div>
//           <div class="report-title">${getReportTitle()}</div>
//         </div>
        
//         <div class="info-section">
//           <div class="info-title">Thông tin người tạo báo cáo:</div>
//           <div class="info-item">
//             <span class="info-label">Họ và tên:</span>
//             <span class="info-value">${state.user?.name || 'Admin'}</span>
//           </div>
//           <div class="info-item">
//             <span class="info-label">Chức vụ:</span>
//             <span class="info-value">${state.user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</span>
//           </div>
//           <div class="info-item">
//             <span class="info-label">Thời gian lập báo cáo:</span>
//             <span class="info-value">${new Date().toLocaleDateString('vi-VN')}</span>
//           </div>
//         </div>

//         <table>
//           <thead>
//             <tr>
//               <th>STT</th>
//               <th>Mã loại</th>
//               <th>Tên loại</th>
//               <th>Mã sản phẩm</th>
//               <th>Tên sản phẩm</th>
//               <th>Số lượng bán ra</th>
//               <th>Đơn giá bán ra (VNĐ)</th>
//               <th>Thành tiền (VND)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${processedData.map(item => `
//               <tr>
//                 <td>${item.stt}</td>
//                 <td>${item.maLoai}</td>
//                 <td>${item.tenLoai}</td>
//                 <td>${item.maSanPham}</td>
//                 <td>${item.tenSanPham}</td>
//                 <td>${formatPrice(item.soLuong)}</td>
//                 <td>${formatPrice(item.donGia)}</td>
//                 <td>${formatPrice(item.thanhTien)}</td>
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>

//         <div class="total-section">
//           <span class="total-text">
//             Tổng doanh thu: <span class="total-amount">${formatPrice(totalRevenue)} VNĐ</span>
//           </span>
//         </div>

//         <div class="signature">
//           <div class="signature-block">
//             <div class="signature-title">Người làm báo cáo</div>
//             <div class="signature-note">(Ký và ghi rõ họ & tên)</div>
//             <div class="signature-line"></div>
//           </div>
//           <div class="signature-block">
//             <div class="signature-title">Người phê duyệt</div>
//             <div class="signature-note">(Ký và ghi rõ họ & tên)</div>
//             <div class="signature-line"></div>
//           </div>
//         </div>
//       </body>
//     </html>
//   `;

//   const blob = new Blob([htmlContent], { type: 'application/msword' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = `BaoCaoDoanhThu_${getDateRangeText().replace(/[\/\s]/g, '_')}.doc`;
//   a.click();
//   URL.revokeObjectURL(url);

//   toast({
//     title: "Thành công",
//     description: "Xuất file Word thành công",
//   });
// };

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

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            page-break-inside: auto;
          }

          td, th {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
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
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">3TSHOP</div>
          <div class="report-title">${getReportTitle()}</div>
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

        <table>
          <tbody>
            <tr>
              <td><b>STT</b></td>
              <td><b>Mã loại</b></td>
              <td><b>Tên loại</b></td>
              <td><b>Mã sản phẩm</b></td>
              <td><b>Tên sản phẩm</b></td>
              <td><b>Số lượng bán ra</b></td>
              <td><b>Đơn giá bán ra (VNĐ)</b></td>
              <td><b>Thành tiền (VND)</b></td>
            </tr>
            ${processedData.map(item => `
              <tr>
                <td>${item.stt}</td>
                <td>${item.maLoai}</td>
                <td>${item.tenLoai}</td>
                <td>${item.maSanPham}</td>
                <td>${item.tenSanPham}</td>
                <td>${formatPrice(item.soLuong)}</td>
                <td>${formatPrice(item.donGia)}</td>
                <td>${formatPrice(item.thanhTien)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <span class="total-text">
            Tổng doanh thu: <span class="total-amount">${formatPrice(totalRevenue)} VNĐ</span>
          </span>
        </div>

        <table style="width: 100%; margin-top: 60px; border: none;">
  <tr>
    <td style="width: 50%; border: none; vertical-align: top;">
      <div style="text-align: center;">
        <div style="font-weight: bold; margin: 0; padding: 0; line-height: 1;">Người làm báo cáo</div>

        <div style="border-bottom: 1px solid #D1D5DB; width: 200px; height: 50px; margin: 10px auto 0;"></div>
      </div>
    </td>
    <td style="width: 50%; border: none; vertical-align: top;">
      <div style="text-align: center;">
        <div style="font-weight: bold; margin: 0; padding: 0; line-height: 1;">Người phê duyệt</div>

        <div style="border-bottom: 1px solid #D1D5DB; width: 200px; height: 50px; margin: 10px auto 0;"></div>
      </div>
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
  };

  // Render dynamic time selection inputs based on report type
  // ...existing code...

// Render dynamic time selection inputs based on report type
const renderTimeSelection = () => {
  switch (reportType) {
    case 'quarter':
      return (
        <>
          <div className="w-32">
            <Label htmlFor="year">Năm</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Label htmlFor="quarter">Quý</Label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Quý 1 (T1-T3)</SelectItem>
                <SelectItem value="2">Quý 2 (T4-T6)</SelectItem>
                <SelectItem value="3">Quý 3 (T7-T9)</SelectItem>
                <SelectItem value="4">Quý 4 (T10-T12)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    
    case 'month':
      return (
        <>
          <div className="w-32">
            <Label htmlFor="year">Năm</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Label htmlFor="month">Tháng</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Tháng {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    
    case 'custom':
      return (
        <>
          <div className="w-40">
            <Label htmlFor="startDate">Ngày Bắt Đầu</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Label htmlFor="endDate">Ngày Kết Thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </>
      );
    
    default:
      return null;
  }
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
            {/* Single row layout với các controls */}
            <div className="flex items-end gap-4 flex-wrap">
              {/* Combobox chọn loại báo cáo */}
              <div className="w-36">
                <Label htmlFor="reportType">Loại Báo Cáo</Label>
                <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter">Theo Quý</SelectItem>
                    <SelectItem value="month">Theo Tháng</SelectItem>
                    <SelectItem value="custom">Tùy Chọn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic time selection inputs với transition mượt */}
              <div className="transition-all duration-300 ease-in-out flex gap-4">
                {renderTimeSelection()}
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
          </CardContent>
        </Card>

        {/* Phần 2: Dữ Liệu Báo Cáo - Fixed height */}
        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Dữ Liệu Báo Cáo</CardTitle>
              {processedData.length > 0 && (
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
            {processedData.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Thời gian: {getDateRangeText()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {processedData.length > 0 ? (
              <>
                <div className="max-h-80 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-16">STT</TableHead>
                        <TableHead className="w-20">Mã Loại</TableHead>
                        <TableHead className="w-32">Tên Loại</TableHead>
                        <TableHead className="w-20">Mã SP</TableHead>
                        <TableHead className="min-w-40">Tên Sản Phẩm</TableHead>
                        <TableHead className="w-20">SL Bán</TableHead>
                        <TableHead className="w-32">Đơn Giá</TableHead>
                        <TableHead className="w-32">Thành Tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{item.stt}</TableCell>
                          <TableCell>{item.maLoai}</TableCell>
                          <TableCell>{item.tenLoai}</TableCell>
                          <TableCell>{item.maSanPham}</TableCell>
                          <TableCell className="max-w-60 truncate" title={item.tenSanPham}>
                            {item.tenSanPham}
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(item.soLuong)}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.donGia)} VNĐ</TableCell>
                          <TableCell className="text-right">{formatPrice(item.thanhTien)} VNĐ</TableCell>
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

      {/* Preview Modal */}
      {showPreview && (
  <Dialog open={showPreview} onOpenChange={setShowPreview}>
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Preview Báo Cáo Doanh Thu</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 p-4">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-7xl font-bold text-primary">3TSHOP</h1>
          <h2 className="text-2xl font-bold text-gray-800">{getReportTitle()}</h2>
        </div>
        
        {/* Information Section - Chỉ còn thông tin người tạo báo cáo */}
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
                <TableHead className="font-bold text-center border text-gray-900">Mã loại</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Tên loại</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Mã sản phẩm</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Tên sản phẩm</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Số lượng bán ra</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Đơn giá bán ra (VNĐ)</TableHead>
                <TableHead className="font-bold text-center border text-gray-900">Thành tiền (VND)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center border">{item.stt}</TableCell>
                  <TableCell className="text-center border">{item.maLoai}</TableCell>
                  <TableCell className="text-center border">{item.tenLoai}</TableCell>
                  <TableCell className="text-center border">{item.maSanPham}</TableCell>
                  <TableCell className="text-center border">{item.tenSanPham}</TableCell>
                  <TableCell className="text-center border">{formatPrice(item.soLuong)}</TableCell>
                  <TableCell className="text-center border">{formatPrice(item.donGia)}</TableCell>
                  <TableCell className="text-center border">{formatPrice(item.thanhTien)}</TableCell>
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

// ...existing code...
}