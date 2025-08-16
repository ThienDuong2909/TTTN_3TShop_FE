import { DollarSign, FileText } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { formatVietnameseCurrency } from "@/lib/utils";

interface PaymentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReturn: any;
  formatVietnameseCurrency: (amount: number, currency: string) => string;
  convertNumberToWords: (amount: number) => string;
}

export default function PaymentDetailModal({
  open,
  onOpenChange,
  selectedReturn,
  // formatVietnameseCurrency,
  convertNumberToWords,
}: PaymentDetailModalProps) {
  const handlePrint = () => {
    // Tạo nội dung in riêng biệt
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Phiếu Chi #${selectedReturn.PhieuChi.MaPhieuChi}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 20px;
            }
            .payment-slip {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .company-info {
              flex: 1;
            }
            .form-info {
              text-align: right;
              font-size: 12px;
            }
            .title-section {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .doc-number {
              text-align: right;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .payment-details {
              margin-bottom: 30px;
            }
            .detail-row {
              margin-bottom: 8px;
              font-size: 14px;
            }
            .signatures {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
            }
            .signature-box {
              height: 120px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .signature-note {
              font-style: italic;
              margin-bottom: 40px;
            }
            .signature-name {
              font-weight: 500;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .footer-note {
              margin-top: 30px;
              font-size: 12px;
            }
            .font-bold { font-weight: bold; }
            .italic { font-style: italic; }
            @media print {
              body { padding: 0; }
              .payment-slip { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="payment-slip">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <div class="font-bold" style="font-size: 14px; margin-bottom: 4px;">
                  CÔNG TY TNHH 3TSHOP
                </div>
                <div style="font-size: 12px;">
                  Địa chỉ: 97, Man Thiện, phường Thủ Đức, TP.HCM
                </div>
                <div style="font-size: 12px;">Điện thoại: 0123.456.789</div>
              </div>
              <div class="form-info">
                <div class="font-bold">Mẫu số: 02 - TT</div>
                <div>(Ban hành kèm theo Thông tư số 88/2021/TT-BTC</div>
                <div>Ngày 11/10/2021 của Bộ Tài chính)</div>
              </div>
            </div>

            <!-- Title -->
            <div class="title-section">
              <h1 class="title">PHIẾU CHI</h1>
              <div style="font-size: 12px;">
                Ngày ${new Date(selectedReturn.PhieuChi.NgayChi || new Date())
                  .getDate()
                  .toString()
                  .padStart(2, "0")} 
                tháng ${(
                  new Date(
                    selectedReturn.PhieuChi.NgayChi || new Date()
                  ).getMonth() + 1
                )
                  .toString()
                  .padStart(2, "0")} 
                năm ${new Date(
                  selectedReturn.PhieuChi.NgayChi || new Date()
                ).getFullYear()}
              </div>
            </div>

            <!-- Document Number -->
            <div class="doc-number">
              <div>Quyển số: ........................</div>
              <div>Số: ${selectedReturn.PhieuChi.MaPhieuChi}</div>
            </div>

            <!-- Payment Details -->
            <div class="payment-details">
              <div class="detail-row">
                <span class="font-bold">Họ tên người nhận tiền: </span>
                <span class="font-bold">
                  ${
                    selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                    "N/A"
                  }
                </span>
              </div>
              <div class="detail-row">
                <span class="font-bold">Địa chỉ: </span>
                <span>
                  ${
                    selectedReturn?.HoaDon?.DonDatHang?.DiaChiGiao ||
                    selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.DiaChi ||
                    "N/A"
                  }
                </span>
              </div>
              <div class="detail-row">
                <span class="font-bold">Lý do: </span>
                <span>Hoàn tiền trả hàng - Mã phiếu trả #${
                  selectedReturn.MaPhieuTra
                }</span>
              </div>
              <div class="detail-row">
                <span class="font-bold">Số tiền: </span>
                <span class="font-bold">
                  ${formatVietnameseCurrency(
                    selectedReturn.PhieuChi.SoTien,
                    "VND"
                  )}
                </span>
              </div>
              <div class="detail-row">
                <span class="font-bold">Viết bằng chữ: </span>
                <span class="font-bold italic">
                  ${convertNumberToWords(selectedReturn.PhieuChi.SoTien)}
                </span>
              </div>
            </div>

            <!-- Date -->
            <div style="text-align: right; margin-bottom: 30px; font-size: 12px;">
              <div>
                Ngày ${new Date(selectedReturn.PhieuChi.NgayChi || new Date())
                  .getDate()
                  .toString()
                  .padStart(2, "0")} 
                tháng ${(
                  new Date(
                    selectedReturn.PhieuChi.NgayChi || new Date()
                  ).getMonth() + 1
                )
                  .toString()
                  .padStart(2, "0")} 
                năm ${new Date(
                  selectedReturn.PhieuChi.NgayChi || new Date()
                ).getFullYear()}
              </div>
            </div>

            <!-- Signatures -->
            <div class="signatures">
              <div class="signature-box">
                <div>
                  <div class="signature-title">Người đại diện hợp pháp</div>
                  <div class="signature-title">doanh nghiệp/Cá nhân kinh doanh</div>
                  <div class="signature-note">(Ký, họ tên, đóng dấu)</div>
                </div>
                <div class="signature-name">Giám đốc</div>
              </div>
              <div class="signature-box">
                <div>
                  <div class="signature-title">Người lập biểu</div>
                  <div class="signature-note">(Ký, họ tên)</div>
                </div>
                <div class="signature-name">
                  ${selectedReturn.PhieuChi.NhanVien?.TenNV || "N/A"}
                </div>
              </div>
              <div class="signature-box">
                <div>
                  <div class="signature-title">Thủ quỹ</div>
                  <div class="signature-note">(Ký, họ tên)</div>
                </div>
                <div class="signature-name"></div>
              </div>
              <div class="signature-box">
                <div>
                  <div class="signature-title">Người nhận tiền</div>
                  <div class="signature-note">(Ký, họ tên)</div>
                </div>
                <div class="signature-name">
                  ${
                    selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                    "N/A"
                  }
                </div>
              </div>
            </div>

            <!-- Footer Note -->
            <div class="footer-note">
              <div>
                Đã nhận đủ số tiền (Viết bằng chữ): 
                <span class="font-bold italic">
                  ${convertNumberToWords(selectedReturn.PhieuChi.SoTien)}
                </span>
              </div>
            </div>
          </div>
          
          <script>
            // Auto print when loaded
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 200);
            };
            
            // Close window after printing or canceling
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 500);
            };
            
            // Handle ESC key to close window
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
      </html>
    `;

    // Tạo cửa sổ mới để in với kích thước phù hợp
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700,scrollbars=yes,resizable=yes"
    );
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback nếu popup bị chặn
      alert(
        "Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt popup của trình duyệt và thử lại."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="pb-2 bg-white dark:bg-gray-950 border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Chi tiết phiếu chi
          </DialogTitle>
        </DialogHeader>

        <div className="px-1 pb-4">
          {selectedReturn && selectedReturn.PhieuChi && (
            <div className="space-y-6">
              {/* Payment Slip Header - Company Info */}
              <div className="bg-white p-4 border border-gray-400 rounded-lg max-w-max mx-auto">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1">
                      CÔNG TY TNHH 3TSHOP
                    </div>
                    <div className="text-xs">
                      Địa chỉ: 97, Man Thiện, phường Thủ Đức, TP.HCM
                    </div>
                    <div className="text-xs">Điện thoại: 0123.456.789</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs">Mẫu số: 02 - TT</div>
                    <div className="text-xs">
                      (Ban hành kèm theo Thông tư số 88/2021/TT-BTC
                    </div>
                    <div className="text-xs">
                      Ngày 11/10/2021 của Bộ Tài chính)
                    </div>
                  </div>
                </div>

                {/* Title and Date */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold mb-1">PHIẾU CHI</h1>
                  <div className="text-xs">
                    Ngày{" "}
                    {new Date(selectedReturn.PhieuChi.NgayChi || new Date())
                      .getDate()
                      .toString()
                      .padStart(2, "0")}{" "}
                    tháng{" "}
                    {(
                      new Date(
                        selectedReturn.PhieuChi.NgayChi || new Date()
                      ).getMonth() + 1
                    )
                      .toString()
                      .padStart(2, "0")}{" "}
                    năm{" "}
                    {new Date(
                      selectedReturn.PhieuChi.NgayChi || new Date()
                    ).getFullYear()}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <div className="text-right text-xs">
                    <div>Quyển số: ........................</div>
                    <div>Số: {selectedReturn.PhieuChi.MaPhieuChi}</div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="font-medium">
                      Họ tên người nhận tiền:{" "}
                    </span>
                    <span className="font-medium">
                      {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Địa chỉ: </span>
                    <span>
                      {selectedReturn?.HoaDon?.DonDatHang?.DiaChiGiao ||
                        selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.DiaChi ||
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Lý do: </span>
                    <span>
                      Hoàn tiền trả hàng - Mã phiếu trả #
                      {selectedReturn.MaPhieuTra}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Số tiền: </span>
                    <span className="font-bold">
                      {formatVietnameseCurrency(
                        selectedReturn.PhieuChi.SoTien,
                        "VND"
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Viết bằng chữ: </span>
                    <span className="font-medium italic">
                      {" "}
                      {convertNumberToWords(selectedReturn.PhieuChi.SoTien)}
                    </span>
                  </div>
                </div>

                {/* Date and Signatures */}
                <div className="mt-6 mb-4">
                  <div className="text-right mb-6 text-xs">
                    <div>
                      Ngày{" "}
                      {new Date(selectedReturn.PhieuChi.NgayChi || new Date())
                        .getDate()
                        .toString()
                        .padStart(2, "0")}{" "}
                      tháng{" "}
                      {(
                        new Date(
                          selectedReturn.PhieuChi.NgayChi || new Date()
                        ).getMonth() + 1
                      )
                        .toString()
                        .padStart(2, "0")}{" "}
                      năm{" "}
                      {new Date(
                        selectedReturn.PhieuChi.NgayChi || new Date()
                      ).getFullYear()}
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-4 gap-4 text-center text-xs">
                  <div>
                    <div className="font-bold mb-1">
                      Người đại diện hợp pháp
                    </div>
                    <div className="font-bold mb-1">
                      doanh nghiệp/Cá nhân kinh doanh
                    </div>
                    <div className="text-xs italic mb-8">
                      (Ký, họ tên, đóng dấu)
                    </div>
                    <div className="mt-8 font-medium">Giám đốc</div>
                  </div>
                  <div>
                    <div className="font-bold mb-1">Người lập biểu</div>
                    <div className="text-xs italic mb-8">(Ký, họ tên)</div>
                    <div className="mt-14 font-medium">
                      {selectedReturn.PhieuChi.NhanVien?.TenNV || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold mb-1">Thủ quỹ</div>
                    <div className="text-xs italic mb-8">(Ký, họ tên)</div>
                  </div>
                  <div>
                    <div className="font-bold mb-1">Người nhận tiền</div>
                    <div className="text-xs italic mb-8">(Ký, họ tên)</div>
                    <div className="mt-14 font-medium">
                      {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                        "N/A"}
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-xs">
                  <div>
                    Đã nhận đủ số tiền (Viết bằng chữ):{" "}
                    <span className="font-medium italic">
                      {convertNumberToWords(selectedReturn.PhieuChi.SoTien)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Payment Slip Case */}
          {selectedReturn && !selectedReturn.PhieuChi && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có phiếu chi
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Phiếu chi chưa được tạo cho phiếu trả này
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t bg-white dark:bg-gray-950">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {selectedReturn?.PhieuChi && (
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              In phiếu chi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
