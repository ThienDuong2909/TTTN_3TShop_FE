import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Loader2,
  Download,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart3,
  PieChartIcon,
  Trophy,
  Medal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProfitReport, getProfitReportPDF } from "@/services/api";
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

interface CategoryProfitData {
  category: string;
  totalGiaNhap: number;
  totalGiaXuat: number;
  totalLoiNhuan: number;
  itemCount: number;
  phanTramLoiNhuan: number;
}

// Chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
];

export default function ProfitDashboardSection() {
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [reportData, setReportData] = useState<ProfitReportData | null>(null);
  const [viewMode, setViewMode] = useState<"category" | "product">("category");
  const [chartType, setChartType] = useState<"bar" | "composed">("composed");

  const { toast } = useToast();
  const { state } = useApp();

  const today = new Date().toISOString().split("T")[0];

  // Fetch report on mount
  useEffect(() => {
    fetchProfitReport();
  }, []);

  const fetchProfitReport = async () => {
    if (!startDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày bắt đầu",
        variant: "destructive",
      });
      return;
    }

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

    const nguoiLap = state.user?.name || state.user?.email || "Không xác định";
    const finalEndDate = endDate || today;

    setExportingPDF(true);
    try {
      const blob = await getProfitReportPDF(startDate, finalEndDate, nguoiLap);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BaoCaoLoiNhuan_${startDate}_${finalEndDate}.pdf`;

      document.body.appendChild(link);
      link.click();

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

  // Calculate category data
  const getCategoryData = (): CategoryProfitData[] => {
    if (!reportData?.data) return [];

    const categoryMap = reportData.data.reduce((acc, item) => {
      const category = item.loaiSanPham || "Khác";
      const giaNhap = item.tongTriGiaNhap || 0;
      const giaXuat = item.tongTriGiaXuat || 0;
      const loiNhuan = item.loiNhuan || 0;

      if (!acc[category]) {
        acc[category] = {
          category,
          totalGiaNhap: 0,
          totalGiaXuat: 0,
          totalLoiNhuan: 0,
          itemCount: 0,
          phanTramLoiNhuan: 0,
        };
      }

      acc[category].totalGiaNhap += giaNhap;
      acc[category].totalGiaXuat += giaXuat;
      acc[category].totalLoiNhuan += loiNhuan;
      acc[category].itemCount += 1;

      return acc;
    }, {} as Record<string, CategoryProfitData>);

    // Calculate profit percentage for each category
    Object.values(categoryMap).forEach((cat) => {
      if (cat.totalGiaNhap > 0) {
        cat.phanTramLoiNhuan = (cat.totalLoiNhuan / cat.totalGiaNhap) * 100;
      }
    });

    return Object.values(categoryMap);
  };

  const categoryData = getCategoryData();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Chart config
  const chartConfig = {
    giaNhap: {
      label: "Trị giá nhập",
      color: "hsl(var(--chart-1))",
    },
    giaXuat: {
      label: "Trị giá xuất",
      color: "hsl(var(--chart-2))",
    },
    loiNhuan: {
      label: "Lợi nhuận",
      color: "hsl(var(--chart-3))",
    },
  };

  // Prepare chart data for category view
  const composedChartData = categoryData.map((item, index) => ({
    name: item.category,
    giaNhap: item.totalGiaNhap,
    giaXuat: item.totalGiaXuat,
    loiNhuan: item.totalLoiNhuan,
    phanTram: item.phanTramLoiNhuan,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const pieChartData = categoryData.map((item, index) => ({
    name: item.category,
    value: Math.abs(item.totalLoiNhuan),
    isNegative: item.totalLoiNhuan < 0,
    fill:
      item.totalLoiNhuan >= 0
        ? CHART_COLORS[index % CHART_COLORS.length]
        : "#ef4444",
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center mb-4 gap-2">
              <TrendingUp className="h-5 w-5" />
              Lợi nhuận sản phẩm
            </CardTitle>
            <CardDescription>
              {reportData
                ? `Từ ngày ${formatDate(
                    reportData.ngayBatDau
                  )} đến ${formatDate(
                    reportData.ngayKetThuc
                  )} - Tổng lợi nhuận: ${
                    reportData.summary.tongLoiNhuanFormatted
                  }`
                : "Báo cáo lợi nhuận sản phẩm theo khoảng thời gian"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Date range picker */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="profit-start-date"
                className="text-sm whitespace-nowrap"
              >
                Từ:
              </Label>
              <Input
                id="profit-start-date"
                type="date"
                value={startDate}
                max={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="profit-end-date"
                className="text-sm whitespace-nowrap"
              >
                Đến:
              </Label>
              <Input
                id="profit-end-date"
                type="date"
                value={endDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchProfitReport}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {/* Export PDF button */}
            <Button
              size="sm"
              variant="outline"
              onClick={exportToPDF}
              disabled={exportingPDF || !reportData}
            >
              {exportingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Xuất PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reportData ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">
                  Tổng trị giá nhập
                </div>
                <div className="text-sm font-bold">
                  {reportData.summary.tongTriGiaNhapTotalFormatted}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">
                  Tổng trị giá bán
                </div>
                <div className="text-sm font-bold">
                  {reportData.summary.tongTriGiaXuatTotalFormatted}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">
                  Tổng lợi nhuận
                </div>
                <div
                  className={`text-sm font-bold ${
                    reportData.summary.tongLoiNhuan >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {reportData.summary.tongLoiNhuanFormatted}
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">
                  % Lợi nhuận TB
                </div>
                <div
                  className={`text-sm font-bold ${
                    reportData.summary.phanTramLoiNhuanTrungBinh >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {reportData.summary.phanTramLoiNhuanTrungBinhFormatted}
                </div>
              </Card>
            </div>

            {/* View mode and chart type toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "category" | "product")}
              >
                <TabsList>
                  <TabsTrigger
                    value="category"
                    className="flex items-center gap-1"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Theo danh mục</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="product"
                    className="flex items-center gap-1"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Theo sản phẩm</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {viewMode === "category" && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={chartType === "composed" ? "default" : "outline"}
                    onClick={() => setChartType("composed")}
                    className="h-8"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === "bar" ? "default" : "outline"}
                    onClick={() => setChartType("bar")}
                    className="h-8"
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Category View */}
            {viewMode === "category" && (
              <div className="space-y-4">
                {/* Chart */}
                <div className="h-[350px] w-full">
                  {chartType === "composed" ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <ComposedChart
                        data={composedChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("vi-VN", {
                              notation: "compact",
                              compactDisplay: "short",
                            }).format(value)
                          }
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold mb-2">
                                    {data.name}
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-muted-foreground">
                                      Trị giá nhập: {formatPrice(data.giaNhap)}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Trị giá xuất: {formatPrice(data.giaXuat)}
                                    </p>
                                    <p
                                      className={
                                        data.loiNhuan >= 0
                                          ? "text-green-600 font-medium"
                                          : "text-red-600 font-medium"
                                      }
                                    >
                                      Lợi nhuận: {formatPrice(data.loiNhuan)}
                                    </p>
                                    <p
                                      className={
                                        data.phanTram >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      % Lợi nhuận: {data.phanTram.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="giaNhap"
                          name="Trị giá nhập"
                          fill="hsl(var(--chart-1))"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="giaXuat"
                          name="Trị giá xuất"
                          fill="hsl(var(--chart-2))"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="phanTram"
                          name="% Lợi nhuận"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                        />
                      </ComposedChart>
                    </ChartContainer>
                  ) : (
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, payload }) => {
                            const isNegative = (payload as any)?.isNegative;
                            return `${name} ${isNegative ? "(lỗ)" : ""} (${(
                              (percent ?? 0) * 100
                            ).toFixed(0)}%)`;
                          }}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold">{data.name}</p>
                                  <p
                                    className={`text-sm ${
                                      data.isNegative
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {data.isNegative ? "Lỗ" : "Lợi nhuận"}:{" "}
                                    {formatPrice(data.value)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ChartContainer>
                  )}
                </div>

                {/* Top 5 Categories by Profit */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h4 className="text-sm font-semibold">
                      Top 5 danh mục có lợi nhuận cao nhất
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {[...categoryData]
                      .sort((a, b) => b.totalLoiNhuan - a.totalLoiNhuan)
                      .slice(0, 5)
                      .map((data, index) => {
                        const medalColors = [
                          "text-yellow-500", // Gold
                          "text-gray-400", // Silver
                          "text-amber-600", // Bronze
                          "text-slate-500",
                          "text-slate-400",
                        ];
                        return (
                          <div
                            key={data.category}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-gray-800 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {index < 3 ? (
                                <Medal
                                  className={`h-5 w-5 ${medalColors[index]}`}
                                />
                              ) : (
                                <span className="text-sm font-bold text-muted-foreground">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[
                                    categoryData.findIndex(
                                      (c) => c.category === data.category
                                    ) % CHART_COLORS.length
                                  ],
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {data.category}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {data.itemCount} sản phẩm
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div
                                className={`font-bold text-sm ${
                                  data.totalLoiNhuan >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatPrice(data.totalLoiNhuan)}
                              </div>
                              <div
                                className={`text-xs ${
                                  data.phanTramLoiNhuan >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {data.phanTramLoiNhuan.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Product View */}
            {viewMode === "product" && (
              <div className="space-y-4">
                {/* Top 10 Products by Revenue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h4 className="text-sm font-semibold">
                      Top 10 sản phẩm có doanh thu cao nhất
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[...reportData.data]
                      .sort((a, b) => b.tongTriGiaXuat - a.tongTriGiaXuat)
                      .slice(0, 10)
                      .map((item, index) => {
                        const medalColors = [
                          "text-yellow-500", // Gold
                          "text-gray-400", // Silver
                          "text-amber-600", // Bronze
                        ];
                        return (
                          <div
                            key={`top-${item.maSanPham}-${index}`}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-white dark:bg-gray-800 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted flex-shrink-0">
                              {index < 3 ? (
                                <Medal
                                  className={`h-5 w-5 ${medalColors[index]}`}
                                />
                              ) : (
                                <span className="text-sm font-bold text-muted-foreground">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-medium text-sm truncate"
                                title={item.tenSanPham}
                              >
                                {item.tenSanPham}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.loaiSanPham} • Mã: {item.maSanPham}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-sm text-primary">
                                {item.tongTriGiaXuatFormatted}
                              </div>
                              <div
                                className={`text-xs ${
                                  item.loiNhuan >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                LN: {item.loiNhuanFormatted}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Product Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-16">STT</TableHead>
                          <TableHead className="w-24">Mã SP</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead className="text-right w-32">
                            Trị giá nhập
                          </TableHead>
                          <TableHead className="text-right w-32">
                            Trị giá xuất
                          </TableHead>
                          <TableHead className="text-right w-32">
                            Lợi nhuận
                          </TableHead>
                          <TableHead className="text-right w-24">
                            % LN
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.map((item, index) => (
                          <TableRow key={`${item.maSanPham}-${index}`}>
                            <TableCell>{item.stt || index + 1}</TableCell>
                            <TableCell>{item.maSanPham}</TableCell>
                            <TableCell>{item.tenSanPham}</TableCell>
                            <TableCell>{item.loaiSanPham}</TableCell>
                            <TableCell className="text-right">
                              {item.tongTriGiaNhapFormatted}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.tongTriGiaXuatFormatted}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                item.loiNhuan >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {item.loiNhuanFormatted}
                            </TableCell>
                            <TableCell
                              className={`text-right ${
                                item.phanTramLoiNhuan >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {item.phanTramLoiNhuanFormatted}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Total row */}
                  <div className="border-t bg-muted/50 p-3 flex flex-wrap justify-between items-center gap-4">
                    <span className="font-semibold">
                      Tổng cộng ({reportData.summary.soLuongSanPham} sản phẩm)
                    </span>
                    <div className="flex gap-6 text-sm">
                      <span>
                        Nhập:{" "}
                        <strong>
                          {reportData.summary.tongTriGiaNhapTotalFormatted}
                        </strong>
                      </span>
                      <span>
                        Xuất:{" "}
                        <strong>
                          {reportData.summary.tongTriGiaXuatTotalFormatted}
                        </strong>
                      </span>
                      <span
                        className={
                          reportData.summary.tongLoiNhuan >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        LN:{" "}
                        <strong>
                          {reportData.summary.tongLoiNhuanFormatted}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Không thể tải dữ liệu lợi nhuận
            </p>
            <Button onClick={fetchProfitReport} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tải lại
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
