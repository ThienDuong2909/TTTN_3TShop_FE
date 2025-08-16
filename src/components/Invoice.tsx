import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { getInvoiceDetail } from "../services/api";

interface InvoiceViewProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string | null;
}

interface InvoiceData {
  ThongTinHoaDon: {
    SoHD: string;
    NgayLap: string;
    NhanVienLap: {
      MaNV: number;
      TenNV: string;
    };
  };
  ThongTinDonHang: {
    MaDDH: number;
    NgayDat: string;
    TrangThai: {
      Ma: number;
      Ten: string;
    };
    NhanVienGiao: {
      MaNV: number;
      TenNV: string;
    } | null;
  };
  ThongTinKhachHang: {
    MaKH: number;
    TenKH: string;
    SDT: string;
    DiaChi: string;
    CCCD: string;
  };
  ThongTinNguoiNhan: {
    HoTen: string;
    SDT: string;
    DiaChi: string;
  };
  DanhSachSanPham: Array<{
    MaCTDDH: number;
    TenSanPham: string;
    MauSac: {
      TenMau: string;
      MaHex: string;
    };
    KichThuoc: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
  }>;
  TongGiaTri: {
    TongTien: number;
    SoLuongSanPham: number;
    TongSoLuong: number;
  };
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
}) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceDetail = useCallback(async () => {
    if (!invoiceNumber) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await getInvoiceDetail(invoiceNumber);
      console.log("API result:", result); // Debug log

      if (result.success && result.data) {
        console.log("Setting invoice data:", result.data); // Debug log
        setInvoiceData(result.data);
      } else if (result && !result.success && result.data) {
        // Try fallback: sometimes API returns data even when success is false
        console.log(
          "Fallback: setting invoice data from result.data:",
          result.data
        );
        setInvoiceData(result.data);
      } else if (
        result &&
        typeof result === "object" &&
        !result.success &&
        !result.error
      ) {
        // Try fallback: result might be the data itself
        console.log("Fallback: result might be data itself:", result);
        setInvoiceData(result);
      } else {
        throw new Error(result.message || "Không tìm thấy thông tin hóa đơn");
      }
    } catch (err) {
      console.error("Error fetching invoice detail:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceNumber]);

  // Fetch invoice data when modal opens
  useEffect(() => {
    if (isOpen && invoiceNumber) {
      console.log("Modal opened with invoice number:", invoiceNumber); // Debug log
      fetchInvoiceDetail();
    }
  }, [isOpen, invoiceNumber, fetchInvoiceDetail]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInvoiceData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    // Create a clean print-only element
    const printElement = document.createElement("div");
    printElement.id = "print-only-invoice";
    printElement.innerHTML = `
      <style>
        @media print {
          body * {
            visibility: hidden !important;
          }
          
          #print-only-invoice,
          #print-only-invoice * {
            visibility: visible !important;
          }
          
          #print-only-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Times New Roman', serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: black !important;
            background: white !important;
          }
          
          @page {
            margin: 20mm !important;
            size: A4 !important;
          }
        }
        
        #print-only-invoice {
          display: none;
          font-family: 'Times New Roman', serif;
          font-size: 12px;
          line-height: 1.4;
          color: black;
          background: white;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        
        .invoice-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .invoice-subtitle {
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .invoice-info {
          font-size: 11px;
          margin-bottom: 5px;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
          margin: 15px 0 8px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        
        .info-label {
          font-weight: normal;
        }
        
        .info-value {
          font-weight: bold;
        }
        
        .product-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10px;
        }
        
        .product-table th,
        .product-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: left;
        }
        
        .product-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        
        .total-section {
          text-align: right;
          margin: 15px 0;
          font-size: 12px;
        }
        
        .total-amount {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .signature-section {
          margin-top: 30px;
          border-top: 1px solid #000;
          padding-top: 15px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          text-align: center;
          font-size: 11px;
        }
        
        .signature-title {
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .signature-note {
          font-size: 10px;
          margin-bottom: 40px;
        }
        
        .footer-section {
          text-align: center;
          margin-top: 20px;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          font-size: 11px;
        }
        
        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(15deg);
          z-index: -1;
          opacity: 0.15;
          pointer-events: none;
        }
        
        .watermark-circle {
          width: 120px;
          height: 120px;
          border: 2px solid #dc2626;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.3);
        }
        
        .watermark-text {
          text-align: center;
          color: #dc2626;
          font-weight: bold;
          font-size: 14px;
          line-height: 1.2;
          opacity: 0.7;
        }
      </style>
      
      <div style="position: relative;">
        <!-- Watermark -->
        <div class="watermark">
          <div class="watermark-circle">
            <div class="watermark-text">
              ĐÃ<br>THANH TOÁN
            </div>
          </div>
        </div>
        
        <!-- Header -->
        <div class="invoice-header">
          <div class="invoice-title">3TShop</div>
          <div class="invoice-subtitle">Thời trang GenZ</div>
          <div class="invoice-info">97, Man Thiện, Phường Thủ Đức, TP.HCM</div>
          <div class="invoice-info">ĐT: 028 1234 5678 | Email: info@3tshop.com | MST: 0123456789</div>
        </div>
        
        <!-- Invoice Info -->
        <div class="info-grid">
          <div>
            <div class="section-title">Thông tin hóa đơn</div>
            <div class="info-row">
              <span class="info-label">Số hóa đơn:</span>
              <span class="info-value">${
                invoiceData?.ThongTinHoaDon.SoHD
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày lập:</span>
              <span class="info-value">${formatDateTime(
                invoiceData?.ThongTinHoaDon.NgayLap || ""
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nhân viên lập:</span>
              <span class="info-value">${
                invoiceData?.ThongTinHoaDon.NhanVienLap.TenNV
              }</span>
            </div>
          </div>
          
          <div>
            <div class="section-title">Thông tin đơn hàng</div>
            <div class="info-row">
              <span class="info-label">Mã đơn hàng:</span>
              <span class="info-value">#${
                invoiceData?.ThongTinDonHang.MaDDH
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày đặt hàng:</span>
              <span class="info-value">${formatDateTime(
                invoiceData?.ThongTinDonHang.NgayDat || ""
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nhân viên giao hàng:</span>
              <span class="info-value">${
                invoiceData?.ThongTinDonHang.NhanVienGiao?.TenNV ||
                "Chưa phân công"
              }</span>
            </div>
          </div>
        </div>
        
        <!-- Customer Info -->
        <div class="info-grid">
          <div>
            <div class="section-title">Khách hàng</div>
            <div class="info-row">
              <span class="info-label">Họ và tên:</span>
              <span class="info-value">${
                invoiceData?.ThongTinKhachHang.TenKH
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Số điện thoại:</span>
              <span class="info-value">${
                invoiceData?.ThongTinKhachHang.SDT
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ:</span>
              <span class="info-value">${
                invoiceData?.ThongTinKhachHang.DiaChi
              }</span>
            </div>
          </div>
          
          <div>
            <div class="section-title">Người nhận hàng</div>
            <div class="info-row">
              <span class="info-label">Họ và tên:</span>
              <span class="info-value">${
                invoiceData?.ThongTinNguoiNhan.HoTen
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Số điện thoại:</span>
              <span class="info-value">${
                invoiceData?.ThongTinNguoiNhan.SDT
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ giao hàng:</span>
              <span class="info-value">${
                invoiceData?.ThongTinNguoiNhan.DiaChi
              }</span>
            </div>
          </div>
        </div>
        
        <!-- Products Table -->
        <div class="section-title">Chi tiết sản phẩm</div>
        <table class="product-table">
          <thead>
            <tr>
              <th style="width: 40px;">STT</th>
              <th>Tên sản phẩm</th>
              <th style="width: 80px;">Màu sắc</th>
              <th style="width: 70px;">Kích thước</th>
              <th style="width: 60px;">Số lượng</th>
              <th style="width: 90px;">Đơn giá</th>
              <th style="width: 100px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData?.DanhSachSanPham.map(
              (item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td class="text-bold">${item.TenSanPham}</td>
                <td>${item.MauSac.TenMau}</td>
                <td class="text-center">${item.KichThuoc}</td>
                <td class="text-center">${item.SoLuong}</td>
                <td class="text-right">${formatCurrency(item.DonGia)}</td>
                <td class="text-right text-bold">${formatCurrency(
                  item.ThanhTien
                )}</td>
              </tr>
            `
            ).join("")}
          </tbody>
        </table>
        
        <!-- Total -->
        <div class="total-section">
          <div class="total-amount">
            TỔNG CỘNG: ${formatCurrency(invoiceData?.TongGiaTri.TongTien || 0)}
          </div>
          <div style="font-size: 11px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
            <strong>Bằng chữ:</strong> ${numberToWords(
              invoiceData?.TongGiaTri.TongTien || 0
            )} đồng
          </div>
        </div>
        
        <!-- Signatures -->
        <div class="signature-section">
          <div>
            <div class="signature-title">Khách hàng</div>
            <div class="signature-note">(Ký và ghi rõ họ tên)</div>
          </div>
          <div>
            <div class="signature-title">Nhân viên bán hàng</div>
            <div class="signature-note">(Ký và ghi rõ họ tên)</div>
            <div style="font-weight: bold;">${
              invoiceData?.ThongTinHoaDon.NhanVienLap.TenNV
            }</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
          <div style="font-weight: bold; margin-bottom: 5px;">Cảm ơn quý khách đã mua hàng tại 3TShop!</div>
          <div>Hotline hỗ trợ: 028 1234 5678</div>
        </div>
      </div>
    `;

    // Add to body temporarily
    document.body.appendChild(printElement);

    // Show print element and hide everything else for printing
    printElement.style.display = "block";

    // Print
    window.print();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(printElement);
    }, 1000);
  };

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Đang tải hóa đơn</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#825B32] mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Đang tải thông tin hóa đơn...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Lỗi tải hóa đơn</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={fetchInvoiceDetail}
                variant="outline"
                className="flex-1"
              >
                Thử lại
              </Button>
              <Button onClick={onClose} className="flex-1">
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No data state
  if (
    !invoiceData ||
    !invoiceData.ThongTinHoaDon ||
    !invoiceData.ThongTinHoaDon.SoHD
  ) {
    console.log("No invoice data, current state:", {
      invoiceData,
      isLoading,
      error,
    }); // Debug log
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Không tìm thấy hóa đơn
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy hóa đơn
            </h3>
            <p className="text-gray-600 mb-4">
              Hóa đơn không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  console.log("Rendering invoice with data:", invoiceData); // Debug log

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:p-0">
        <div className="print:hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Hóa đơn #{invoiceData.ThongTinHoaDon.SoHD}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Invoice Content */}
        <div className="invoice-print-content space-y-4 text-xs print:space-y-3 print:text-xs relative">
          {/* Watermark - Paid Stamp */}
          <div
            className="print-watermark absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ zIndex: -1, opacity: 0.15 }}
          >
            <div className="print-watermark-circle w-36 h-36 border-2 border-red-600 rounded-full flex items-center justify-center bg-white/30 transform rotate-12 print:w-32 print:h-32">
              <div
                className="print-watermark-text text-center"
                style={{ opacity: 0.7 }}
              >
                <div className="text-red-600 font-bold text-xl uppercase tracking-wider print:text-lg">
                  ĐÃ
                </div>
                <div className="text-red-600 font-bold text-xl uppercase tracking-wider -mt-1 print:text-lg">
                  THANH TOÁN
                </div>
                <div className="w-full h-0 bg-red-600 mt-1"></div>
              </div>
            </div>
          </div>

          {/* Header - Store Information */}
          <div className="print-header text-center border-b-2 border-gray-200 pb-4 print:pb-3">
            <h1 className="print-title text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
              3TShop
            </h1>
            <p className="text-gray-700 text-sm font-medium mb-2">
              Thời trang GenZ
            </p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                97, Man Thiện, Phường Thủ Đức, TP.HCM
              </p>
              <p className="text-xs text-gray-600">
                ĐT: 028 1234 5678 | Email: info@3tshop.com | MST: 0123456789
              </p>
            </div>
          </div>

          {/* Invoice Header Information */}
          <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
            <div className="print-section bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-2">
              <h2 className="print-section-title text-sm font-bold mb-2 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">
                Thông tin hóa đơn
              </h2>
              <div className="space-y-1.5 print:space-y-1">
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Số hóa đơn:</span>
                  <span className="font-bold text-gray-900">
                    {invoiceData.ThongTinHoaDon.SoHD}
                  </span>
                </div>
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Ngày lập:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(invoiceData.ThongTinHoaDon.NgayLap)}
                  </span>
                </div>
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Nhân viên lập:</span>
                  <span className="font-medium text-gray-900">
                    {invoiceData.ThongTinHoaDon.NhanVienLap.TenNV}
                  </span>
                </div>
              </div>
            </div>

            <div className="print-section bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-2">
              <h2 className="print-section-title text-sm font-bold mb-2 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">
                Thông tin đơn hàng
              </h2>
              <div className="space-y-1.5 print:space-y-1">
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-bold text-gray-900">
                    #{invoiceData.ThongTinDonHang.MaDDH}
                  </span>
                </div>
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Ngày đặt hàng:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(invoiceData.ThongTinDonHang.NgayDat)}
                  </span>
                </div>
                <div className="print-info-item flex justify-between text-xs">
                  <span className="text-gray-600">Nhân viên giao hàng:</span>
                  <span className="font-medium text-gray-900">
                    {invoiceData.ThongTinDonHang.NhanVienGiao?.TenNV ||
                      "Chưa phân công"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3 print:my-2 print-hidden" />

          {/* Customer and Delivery Information */}
          <div className="print-info-grid grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
            {/* Customer Information */}
            <div className="print-section">
              <h3 className="print-section-title text-sm font-bold mb-2 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">
                Khách hàng
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên
                  </div>
                  <div className="text-xs text-gray-900 font-medium">
                    {invoiceData.ThongTinKhachHang.TenKH}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại
                  </div>
                  <div className="text-xs text-gray-900">
                    {invoiceData.ThongTinKhachHang.SDT}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ
                  </div>
                  <div className="text-xs text-gray-900">
                    {invoiceData.ThongTinKhachHang.DiaChi}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="print-section">
              <h3 className="print-section-title text-sm font-bold mb-2 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">
                Người nhận hàng
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên
                  </div>
                  <div className="text-xs text-gray-900 font-medium">
                    {invoiceData.ThongTinNguoiNhan.HoTen}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại
                  </div>
                  <div className="text-xs text-gray-900">
                    {invoiceData.ThongTinNguoiNhan.SDT}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ giao hàng
                  </div>
                  <div className="text-xs text-gray-900">
                    {invoiceData.ThongTinNguoiNhan.DiaChi}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3 print:my-2 print-hidden" />

          {/* Product Information */}
          <div className="print-section">
            <h3 className="print-section-title text-sm font-bold mb-3 uppercase tracking-wide text-gray-800 border-b border-gray-300 pb-1">
              Chi tiết sản phẩm
            </h3>

            <div className="overflow-x-auto">
              <table className="print-table w-full border-collapse text-xs print:text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-400">
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold print:px-1 print:py-1">
                      STT
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left font-semibold print:px-2 print:py-1">
                      Tên sản phẩm
                    </th>
                    <th className="border border-gray-400 px-2 py-2 text-left font-semibold print:px-1 print:py-1">
                      Màu sắc
                    </th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-semibold print:px-1 print:py-1">
                      Kích thước
                    </th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-semibold print:px-1 print:py-1">
                      Số lượng
                    </th>
                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold print:px-1 print:py-1">
                      Đơn giá
                    </th>
                    <th className="border border-gray-400 px-2 py-2 text-right font-semibold print:px-1 print:py-1">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.DanhSachSanPham.map((item, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-gray-50 print:bg-gray-100"
                          : "bg-white"
                      }
                    >
                      <td className="border border-gray-300 px-2 py-2 text-center print:px-1 print:py-1">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-medium print:px-2 print:py-1">
                        {item.TenSanPham}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 print:px-1 print:py-1">
                        {item.MauSac.TenMau}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center print:px-1 print:py-1">
                        {item.KichThuoc}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center print:px-1 print:py-1">
                        {item.SoLuong}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right print:px-1 print:py-1">
                        {formatCurrency(item.DonGia)}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right font-bold print:px-1 print:py-1">
                        {formatCurrency(item.ThanhTien)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-3 print:my-2 print-hidden" />

          {/* Total Summary */}
          <div className="print-total flex justify-end">
            <div className="w-full md:w-1/2">
              <div className="space-y-2 print:space-y-1">
                <div className="flex justify-between text-sm font-bold print:text-xs">
                  <span className="text-gray-800">TỔNG CỘNG:</span>
                  <span className="text-xl text-gray-900 print:text-lg">
                    {formatCurrency(invoiceData.TongGiaTri.TongTien)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 border-t pt-1">
                  <strong>Bằng chữ:</strong>{" "}
                  {numberToWords(invoiceData.TongGiaTri.TongTien)} đồng
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="print-footer mt-6 pt-4 border-t-2 border-gray-200 print:mt-4 print:pt-2">
            <div className="print-signature grid grid-cols-2 gap-8 text-center print:gap-4">
              <div>
                <p className="font-bold mb-2 text-sm text-gray-800 uppercase tracking-wide">
                  Khách hàng
                </p>
                <p className="text-xs text-gray-600 mb-6 print:mb-4">
                  (Ký và ghi rõ họ tên)
                </p>
              </div>
              <div>
                <p className="font-bold mb-2 text-sm text-gray-800 uppercase tracking-wide">
                  Nhân viên bán hàng
                </p>
                <p className="text-xs text-gray-600 mb-16 print:mb-4">
                  (Ký và ghi rõ họ tên)
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {invoiceData.ThongTinHoaDon.NhanVienLap.TenNV}
                </p>
              </div>
            </div>
          </div>

          {/* Store Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200 print:mt-4 print:pt-2">
            <p className="text-sm font-medium text-gray-800 mb-1">
              Cảm ơn quý khách đã mua hàng tại 3TShop!
            </p>
            <p className="text-xs text-gray-600">
              Hotline hỗ trợ: 028 1234 5678
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="print-hidden flex gap-3 mt-6 print:hidden">
          <Button onClick={handlePrint} className="flex-1 font-semibold">
            In hóa đơn
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to convert number to words (Vietnamese)
function numberToWords(num: number): string {
  if (num === 0) return "Không";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];
  const hundreds = [
    "",
    "một trăm",
    "hai trăm",
    "ba trăm",
    "bốn trăm",
    "năm trăm",
    "sáu trăm",
    "bảy trăm",
    "tám trăm",
    "chín trăm",
  ];

  function convertHundreds(n: number): string {
    let result = "";
    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)] + " ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += "mười ";
      n -= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  }

  if (num < 1000) {
    return convertHundreds(num);
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  let result = "";
  if (millions > 0) {
    result += convertHundreds(millions) + " triệu ";
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + " nghìn ";
  }
  if (remainder > 0) {
    result += convertHundreds(remainder);
  }

  return result.trim();
}
