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
import { Package, Eye, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInventoryReport, getInventoryReportPDF } from "../../services/api";
import { useApp } from "@/contexts/AppContext";

interface InventoryItem {
  "Loại sản phẩm": string;
  "Mã sản phẩm": number;
  "Tên sản phẩm": string;
  "Số lượng tồn": string;
  "Giá nhập": string;
}

interface InventoryReportData {
  ngayBaoCao: string;
  data: InventoryItem[];
}

export default function InventoryReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [reportData, setReportData] = useState<InventoryReportData | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  const { toast } = useToast();
  const { state } = useApp();

  // Get today's date in YYYY-MM-DD format for max date validation
  const today = new Date().toISOString().split("T")[0];

  const fetchInventoryReport = async () => {
    if (!reportDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày báo cáo",
        variant: "destructive",
      });
      return;
    }

    // Validate date is not in the future
    if (reportDate > today) {
      toast({
        title: "Lỗi",
        description: "Ngày báo cáo không được lớn hơn ngày hiện tại",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await getInventoryReport(reportDate);

      if (result.success) {
        setReportData(result.data);
        setShowPreview(true);
        toast({
          title: "Thành công",
          description: "Tải báo cáo tồn kho thành công",
        });
      } else {
        throw new Error(result.message || "Không thể tải báo cáo");
      }
    } catch (error) {
      console.error("Error fetching inventory report:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải báo cáo tồn kho. Vui lòng thử lại.";
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
    if (!reportData || !reportDate) {
      toast({
        title: "Lỗi",
        description: "Không có dữ liệu báo cáo để xuất",
        variant: "destructive",
      });
      return;
    }

    // Get current user's name for the report
    const nguoiLap = state.user?.name || state.user?.email || "Không xác định";

    setExportingPDF(true);
    try {
      // Get the PDF blob from API
      const blob = await getInventoryReportPDF(reportDate, nguoiLap);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BaoCaoTonKho_${reportDate}.pdf`;

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

  // Calculate total inventory value
  const calculateTotalValue = () => {
    if (!reportData?.data) return 0;

    return reportData.data.reduce((total, item) => {
      const quantity = parseInt(item["Số lượng tồn"]) || 0;
      const price = parseFloat(item["Giá nhập"]) || 0;
      return total + quantity * price;
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Group items by product type for better display
  const groupedData =
    reportData?.data.reduce((acc, item) => {
      const type = item["Loại sản phẩm"];
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>) || {};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full flex items-center gap-1 text-sm h-10"
        >
          <Package className="h-3 w-3" />
          Báo cáo Tồn kho
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Báo cáo Tồn kho
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
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-date">Ngày báo cáo</Label>
                      <Input
                        id="report-date"
                        type="date"
                        value={reportDate}
                        max={today}
                        onChange={(e) => setReportDate(e.target.value)}
                        placeholder="Chọn ngày báo cáo"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ngày báo cáo không được lớn hơn ngày hiện tại
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={fetchInventoryReport}
                      disabled={loading || !reportDate}
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
                <h2 className="text-2xl font-bold">BÁO CÁO TỒN KHO</h2>
                <p className="text-lg">
                  Tính đến ngày:{" "}
                  {reportData ? formatDate(reportData.ngayBaoCao) : ""}
                </p>
              </div>

              {/* Inventory Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-16">STT</TableHead>
                        <TableHead className="text-center w-24">
                          Mã sản phẩm
                        </TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead className="text-center w-24">
                          SL Tồn
                        </TableHead>
                        <TableHead className="text-center w-32">
                          Đơn giá nhập
                        </TableHead>
                        <TableHead className="text-center w-32">
                          Trị giá
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedData).map(
                        ([productType, items], typeIndex) => (
                          <React.Fragment key={productType}>
                            {/* Product Type Header */}
                            <TableRow className="bg-muted/50">
                              <TableCell
                                colSpan={6}
                                className="font-semibold text-left"
                              >
                                {productType}
                              </TableCell>
                            </TableRow>

                            {/* Product Items */}
                            {items.map((item, itemIndex) => {
                              const quantity =
                                parseInt(item["Số lượng tồn"]) || 0;
                              const price = parseFloat(item["Giá nhập"]) || 0;
                              const totalValue = quantity * price;
                              const globalIndex =
                                Object.values(groupedData)
                                  .slice(0, typeIndex)
                                  .reduce((sum, arr) => sum + arr.length, 0) +
                                itemIndex +
                                1;

                              return (
                                <TableRow
                                  key={`${item["Mã sản phẩm"]}-${itemIndex}`}
                                >
                                  <TableCell className="text-center">
                                    {globalIndex}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {item["Mã sản phẩm"]}
                                  </TableCell>
                                  <TableCell>{item["Tên sản phẩm"]}</TableCell>
                                  <TableCell className="text-center">
                                    {parseInt(
                                      item["Số lượng tồn"]
                                    ).toLocaleString("vi-VN")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {price > 0 ? formatPrice(price) : "0đ"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {totalValue > 0
                                      ? formatPrice(totalValue)
                                      : "0đ"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}

                            {/* Subtotal for product type */}
                            <TableRow className="bg-muted/30">
                              <TableCell
                                colSpan={5}
                                className="text-right font-medium"
                              >
                                Tổng trị giá
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatPrice(
                                  items.reduce((sum, item) => {
                                    const qty =
                                      parseInt(item["Số lượng tồn"]) || 0;
                                    const price =
                                      parseFloat(item["Giá nhập"]) || 0;
                                    return sum + qty * price;
                                  }, 0)
                                )}
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        )
                      )}

                      {/* Grand Total */}
                      <TableRow className="bg-primary/10 border-t-2">
                        <TableCell
                          colSpan={5}
                          className="text-right font-bold text-lg"
                        >
                          TỔNG TRỊ GIÁ TỒN KHO
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {formatPrice(calculateTotalValue())}
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
