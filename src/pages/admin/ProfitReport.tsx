import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Eye, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProfitReport, getProfitReportPDF } from "../../services/api";
import { useApp } from "@/contexts/AppContext";

interface ProfitItem {
  stt: number;
  loaiSanPham: string;
  maSanPham: number;
  tenSanPham: string;
  tongTriGiaNhap: number;
  tongTriGiaXuat: number;
  loiNhuan: number;
  phanTramLoiNhuan: number;
  tongTriGiaNhapFormatted: string;
  tongTriGiaXuatFormatted: string;
  loiNhuanFormatted: string;
  phanTramLoiNhuanFormatted: string;
}

interface ProfitSummary {
  tongTriGiaNhapTotal: number;
  tongTriGiaXuatTotal: number;
  tongLoiNhuan: number;
  phanTramLoiNhuanTrungBinh: number;
  tongTriGiaNhapTotalFormatted: string;
  tongTriGiaXuatTotalFormatted: string;
  tongLoiNhuanFormatted: string;
  phanTramLoiNhuanTrungBinhFormatted: string;
  soLuongSanPham: number;
}

interface ProfitReportData {
  data: ProfitItem[];
  summary: ProfitSummary;
  ngayBatDau: string;
  ngayKetThuc: string;
}

export default function ProfitReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [reportData, setReportData] = useState<ProfitReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { toast } = useToast();
  const { state } = useApp();

  // Get today's date in YYYY-MM-DD format for max date validation
  const today = new Date().toISOString().split("T")[0];

  const fetchProfitReport = async () => {
    if (!startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

    // Validate dates
    if (startDate > today) {
      toast({
        title: "Lỗi",
        description: "Ngày bắt đầu không được lớn hơn ngày hiện tại",
        variant: "destructive",
      });
      return;
    }

    const finalEndDate = endDate || today;
    if (startDate > finalEndDate) {
      toast({
        title: "Lỗi",
        description: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await getProfitReport(startDate, finalEndDate);

      if (result.success) {
        setReportData(result.data);
        setShowPreview(true);
        toast({
          title: "Thành công",
          description: "Tải báo cáo lợi nhuận thành công",
        });
      } else {
        throw new Error(result.message || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching profit report:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải báo cáo lợi nhuận. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportData || !startDate) {
      toast({
        title: "Lỗi",
        description: "Không có dữ liệu báo cáo để xuất",
        variant: "destructive",
      });
      return;
    }

    // Get current user's name for the report
    const nguoiLap = state.user?.name || state.user?.email || "Không xác định";
    const finalEndDate = endDate || today;

    setExportingPDF(true);
    try {
      // Get the PDF blob from API
      const blob = await getProfitReportPDF(startDate, finalEndDate, nguoiLap);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BaoCaoLoiNhuan_${startDate}_${finalEndDate}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Xuất báo cáo PDF thành công",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo PDF. Vui lòng thử lại.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Group items by product type for better display
  const groupedData =
    reportData?.data.reduce((acc, item) => {
      const type = item.loaiSanPham;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, ProfitItem[]>) || {};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full flex items-center gap-1 text-sm h-10"
        >
          <TrendingUp className="h-3 w-3" />
          Báo cáo Lợi nhuận
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Báo cáo Lợi nhuận sản phẩm
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!showPreview ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin báo cáo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        max={today}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Chọn ngày bắt đầu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Ngày kết thúc</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        max={today}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="Mặc định là ngày hiện tại"
                      />
                      <p className="text-sm text-muted-foreground">
                        Để trống sẽ lấy ngày hiện tại
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={fetchProfitReport}
                      disabled={loading || !startDate}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {loading ? "Đang tải..." : "Xem báo cáo"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">
                  BÁO CÁO LỢI NHUẬN SẢN PHẨM
                </h2>
                <p className="text-lg">
                  Từ ngày: {reportData ? formatDate(reportData.ngayBatDau) : ""}{" "}
                  đến ngày:{" "}
                  {reportData ? formatDate(reportData.ngayKetThuc) : ""}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Tổng trị giá nhập
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.summary.tongTriGiaNhapTotalFormatted}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Tổng trị giá bán
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.summary.tongTriGiaXuatTotalFormatted}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      Tổng lợi nhuận
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.summary.tongLoiNhuanFormatted}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">
                      % Lợi nhuận TB
                    </div>
                    <div className="text-xl font-bold">
                      {reportData?.summary.phanTramLoiNhuanTrungBinhFormatted}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center w-16">STT</TableHead>
                        <TableHead className="text-center w-24">
                          Mã SP
                        </TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-center w-32">
                          Trị giá nhập
                        </TableHead>
                        <TableHead className="text-center w-32">
                          Trị giá bán
                        </TableHead>
                        <TableHead className="text-center w-32">
                          Lợi nhuận
                        </TableHead>
                        <TableHead className="text-center w-24">% LN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedData).map(
                        ([productType, items]) => (
                          <React.Fragment key={productType}>
                            {/* Product Type Header */}
                            <TableRow className="bg-muted/50">
                              <TableCell
                                colSpan={7}
                                className="font-semibold text-left"
                              >
                                {productType}
                              </TableCell>
                            </TableRow>

                            {/* Product Items */}
                            {items.map((item, itemIndex) => (
                              <TableRow key={`${item.maSanPham}-${itemIndex}`}>
                                <TableCell className="text-center">
                                  {item.stt}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.maSanPham}
                                </TableCell>
                                <TableCell>{item.tenSanPham}</TableCell>
                                <TableCell className="text-right">
                                  {item.tongTriGiaNhapFormatted}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.tongTriGiaXuatFormatted}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.loiNhuanFormatted}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.phanTramLoiNhuanFormatted}
                                </TableCell>
                              </TableRow>
                            ))}

                            {/* Subtotal for product type */}
                            <TableRow className="bg-muted/50 font-medium">
                              <TableCell
                                colSpan={3}
                                className="text-right font-semibold"
                              >
                                Tổng {productType}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {items
                                  .reduce(
                                    (sum, item) => sum + item.tongTriGiaNhap,
                                    0
                                  )
                                  .toLocaleString("vi-VN")}{" "}
                                ₫
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {items
                                  .reduce(
                                    (sum, item) => sum + item.tongTriGiaXuat,
                                    0
                                  )
                                  .toLocaleString("vi-VN")}{" "}
                                ₫
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {items
                                  .reduce((sum, item) => sum + item.loiNhuan, 0)
                                  .toLocaleString("vi-VN")}{" "}
                                ₫
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {items.length} sản phẩm
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        )
                      )}

                      {/* Grand Total */}
                      <TableRow className="bg-muted font-semibold text-lg">
                        <TableCell colSpan={3} className="text-right font-bold">
                          TỔNG CỘNG ({reportData?.summary.soLuongSanPham} sản
                          phẩm)
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData?.summary.tongTriGiaNhapTotalFormatted}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData?.summary.tongTriGiaXuatTotalFormatted}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData?.summary.tongLoiNhuanFormatted}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {
                            reportData?.summary
                              .phanTramLoiNhuanTrungBinhFormatted
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-center pt-4">
                <Button
                  onClick={exportToPDF}
                  disabled={exportingPDF}
                  className="flex items-center gap-2"
                >
                  {exportingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exportingPDF ? "Đang xuất..." : "Xuất PDF"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setReportData(null);
                  }}
                >
                  Tạo báo cáo mới
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
