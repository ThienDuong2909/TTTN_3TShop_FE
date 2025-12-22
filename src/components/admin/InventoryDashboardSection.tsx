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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Package,
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
import { getInventoryReport, getInventoryReportPDF } from "@/services/api";
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

interface CategoryData {
  category: string;
  totalQuantity: number;
  totalValue: number;
  itemCount: number;
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

export default function InventoryDashboardSection() {
  const [reportDate, setReportDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [reportData, setReportData] = useState<InventoryReportData | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"category" | "product">("category");
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const { toast } = useToast();
  const { state } = useApp();

  const today = new Date().toISOString().split("T")[0];

  // Fetch report on mount with first day of current month
  useEffect(() => {
    fetchInventoryReport();
  }, []);

  const fetchInventoryReport = async () => {
    if (!reportDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày báo cáo",
        variant: "destructive",
      });
      return;
    }

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

    const nguoiLap = state.user?.name || state.user?.email || "Không xác định";

    setExportingPDF(true);
    try {
      const blob = await getInventoryReportPDF(reportDate, nguoiLap);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BaoCaoTonKho_${reportDate}.pdf`;

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
  const getCategoryData = (): CategoryData[] => {
    if (!reportData?.data) return [];

    const categoryMap = reportData.data.reduce((acc, item) => {
      const category = item["Loại sản phẩm"];
      const quantity = parseInt(item["Số lượng tồn"]) || 0;
      const price = parseFloat(item["Giá nhập"]) || 0;
      const value = quantity * price;

      if (!acc[category]) {
        acc[category] = {
          category,
          totalQuantity: 0,
          totalValue: 0,
          itemCount: 0,
        };
      }

      acc[category].totalQuantity += quantity;
      acc[category].totalValue += value;
      acc[category].itemCount += 1;

      return acc;
    }, {} as Record<string, CategoryData>);

    return Object.values(categoryMap);
  };

  const categoryData = getCategoryData();
  const totalInventoryValue = categoryData.reduce(
    (sum, cat) => sum + cat.totalValue,
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Chart config for category view
  const chartConfig = categoryData.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  // Prepare chart data
  const barChartData = categoryData.map((item, index) => ({
    name: item.category,
    quantity: item.totalQuantity,
    value: item.totalValue,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const pieChartData = categoryData.map((item, index) => ({
    name: item.category,
    value: item.totalValue,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              Tồn kho hiện tại
            </CardTitle>
            <CardDescription>
              {reportData
                ? `Tính từ ngày ${formatDate(
                    reportData.ngayBaoCao
                  )} - Tổng trị giá: ${formatPrice(totalInventoryValue)}`
                : "Báo cáo tồn kho theo loại sản phẩm"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Date picker */}
            <div className="flex items-center gap-2">
              <Label
                htmlFor="inventory-date"
                className="text-sm whitespace-nowrap"
              >
                Ngày:
              </Label>
              <Input
                id="inventory-date"
                type="date"
                value={reportDate}
                max={today}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-40"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={fetchInventoryReport}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
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
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : reportData ? (
          <div className="space-y-4">
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
                    variant={chartType === "bar" ? "default" : "outline"}
                    onClick={() => setChartType("bar")}
                    className="h-8"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === "pie" ? "default" : "outline"}
                    onClick={() => setChartType("pie")}
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
                <div className="h-[300px] w-full">
                  {chartType === "bar" ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-full w-full"
                    >
                      <BarChart
                        data={barChartData}
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
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("vi-VN", {
                              notation: "compact",
                              compactDisplay: "short",
                            }).format(value)
                          }
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold">{data.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Số lượng:{" "}
                                    {data.quantity.toLocaleString("vi-VN")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Trị giá: {formatPrice(data.value)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                          label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          outerRadius={100}
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
                                  <p className="text-sm text-muted-foreground">
                                    Trị giá: {formatPrice(data.value)}
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

                {/* Top 5 Categories by Inventory Value */}
                <div className="border rounded-lg overflow-hidden">
                  <h3 className="text-lg font-bold text-black p-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top 5 danh mục có trị giá tồn kho cao nhất
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Hạng</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead className="text-right">Số SP</TableHead>
                        <TableHead className="text-right">
                          Số lượng tồn
                        </TableHead>
                        <TableHead className="text-right">
                          Trị giá tồn kho
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryData.slice(0, 5).map((data, index) => {
                        const getRankIcon = (rank: number) => {
                          if (rank === 0)
                            return (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            );
                          if (rank === 1)
                            return <Medal className="h-5 w-5 text-gray-400" />;
                          if (rank === 2)
                            return <Medal className="h-5 w-5 text-amber-600" />;
                          return (
                            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {rank + 1}
                            </span>
                          );
                        };

                        return (
                          <TableRow
                            key={data.category}
                            className={
                              index === 0
                                ? "bg-yellow-50 dark:bg-yellow-950/20"
                                : ""
                            }
                          >
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {getRankIcon(index)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                                <span className="font-medium">
                                  {data.category}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {data.itemCount}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.totalQuantity.toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatPrice(data.totalValue)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {/* Total row */}
                  <div className="border-t bg-muted/50 p-3 flex justify-between items-center">
                    <span className="font-semibold">
                      Tổng trị giá tồn kho ({categoryData.length} danh mục)
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(
                        categoryData.reduce(
                          (sum, cat) => sum + cat.totalValue,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Product View */}
            {viewMode === "product" && (
              <div className="space-y-6">
                {/* Top 10 Products by Inventory Value */}
                <div className="border rounded-lg overflow-hidden">
                  <h3 className="text-lg font-bold text-black p-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top 10 sản phẩm có trị giá tồn kho cao nhất
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Hạng</TableHead>
                        <TableHead className="w-24">Mã SP</TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">SL Tồn</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Trị giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const top10Products = reportData.data
                          .map((item) => {
                            const quantity =
                              parseInt(item["Số lượng tồn"]) || 0;
                            const price = parseFloat(item["Giá nhập"]) || 0;
                            const totalValue = quantity * price;
                            return { ...item, quantity, price, totalValue };
                          })
                          .sort((a, b) => b.totalValue - a.totalValue)
                          .slice(0, 10);

                        const getRankIcon = (rank: number) => {
                          if (rank === 0)
                            return (
                              <Trophy className="h-5 w-5 text-yellow-500" />
                            );
                          if (rank === 1)
                            return <Medal className="h-5 w-5 text-gray-400" />;
                          if (rank === 2)
                            return <Medal className="h-5 w-5 text-amber-600" />;
                          return (
                            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {rank + 1}
                            </span>
                          );
                        };

                        return top10Products.map((item, index) => (
                          <TableRow
                            key={`top-${item["Mã sản phẩm"]}-${index}`}
                            className={
                              index === 0
                                ? "bg-yellow-50 dark:bg-yellow-950/20"
                                : ""
                            }
                          >
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {getRankIcon(index)}
                              </div>
                            </TableCell>
                            <TableCell>{item["Mã sản phẩm"]}</TableCell>
                            <TableCell className="font-medium">
                              {item["Tên sản phẩm"]}
                            </TableCell>
                            <TableCell>{item["Loại sản phẩm"]}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity.toLocaleString("vi-VN")}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {formatPrice(item.totalValue)}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>

                {/* Full Product Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-3 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Danh sách tất cả sản phẩm ({reportData.data.length} sản
                      phẩm)
                    </h3>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-16">STT</TableHead>
                          <TableHead className="w-24">Mã SP</TableHead>
                          <TableHead>Tên sản phẩm</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead className="text-right w-24">
                            SL Tồn
                          </TableHead>
                          <TableHead className="text-right w-32">
                            Đơn giá
                          </TableHead>
                          <TableHead className="text-right w-32">
                            Trị giá
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.map((item, index) => {
                          const quantity = parseInt(item["Số lượng tồn"]) || 0;
                          const price = parseFloat(item["Giá nhập"]) || 0;
                          const totalValue = quantity * price;

                          return (
                            <TableRow key={`${item["Mã sản phẩm"]}-${index}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{item["Mã sản phẩm"]}</TableCell>
                              <TableCell>{item["Tên sản phẩm"]}</TableCell>
                              <TableCell>{item["Loại sản phẩm"]}</TableCell>
                              <TableCell className="text-right">
                                {quantity.toLocaleString("vi-VN")}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPrice(price)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(totalValue)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Total row */}
                  <div className="border-t bg-muted/50 p-3 flex justify-between items-center">
                    <span className="font-semibold">Tổng trị giá tồn kho</span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(totalInventoryValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Không thể tải dữ liệu tồn kho
            </p>
            <Button onClick={fetchInventoryReport} disabled={loading}>
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
