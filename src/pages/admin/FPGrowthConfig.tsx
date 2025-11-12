import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings2,
  TrendingUp,
  Database,
  Save,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import AdminHeader from "../../components/AdminHeader";
import FPGrowthRulesModal from "../../components/FPGrowthRulesModal";
import {
  getFPGrowthConfig,
  updateFPGrowthConfig,
  refreshFPGrowthCache,
} from "../../services/api";

interface ConfigState {
  min_sup: number;
  min_conf: number;
  transactions?: number;
  rules?: number;
}

export default function FPGrowthConfig() {
  const [config, setConfig] = useState<ConfigState>({
    min_sup: 0,
    min_conf: 0,
    transactions: 0,
    rules: 0,
  });
  const [originalConfig, setOriginalConfig] = useState<ConfigState>({
    min_sup: 0,
    min_conf: 0,
    transactions: 0,
    rules: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    const changed =
      config.min_sup !== originalConfig.min_sup ||
      config.min_conf !== originalConfig.min_conf;
    setHasChanges(changed);
  }, [config, originalConfig]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await getFPGrowthConfig();
      console.log("Full response:", response);
      if (response.success && response.data) {
        // API trả về response.data với structure đúng
        const apiData = response.data;
        console.log("API data:", apiData);
        
        // Đảm bảo giá trị luôn hợp lệ - apiData có nested data property
        const loadedConfig = {
          min_sup: typeof apiData.data.min_sup === 'number' ? apiData.data.min_sup : 0,
          min_conf: typeof apiData.data.min_conf === 'number' ? apiData.data.min_conf : 0,
          transactions: typeof apiData.data.transactions === 'number' ? apiData.data.transactions : 0,
          rules: typeof apiData.data.rules === 'number' ? apiData.data.rules : 0,
        };
        console.log("Parsed config:", loadedConfig);
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      } else {
        toast.error("Không thể tải cấu hình");
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast.error("Lỗi khi tải cấu hình");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    // Validation
    if (config.min_sup < 0 || config.min_sup > 1) {
      toast.error("MIN_SUP phải nằm trong khoảng 0 đến 1");
      return;
    }
    if (config.min_conf < 0 || config.min_conf > 1) {
      toast.error("MIN_CONF phải nằm trong khoảng 0 đến 1");
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      const response = await updateFPGrowthConfig({
        min_sup: config.min_sup,
        min_conf: config.min_conf,
      });
      console.log("Update response:", response);
      
      if (response.success && response.data) {
        toast.success(response.message || "Cập nhật cấu hình thành công");
        // Update with new config from response
        const newConfig = {
          min_sup: response.data.new_config.min_sup,
          min_conf: response.data.new_config.min_conf,
          transactions: response.data.transactions,
          rules: response.data.rules,
        };
        console.log("New config:", newConfig);
        setConfig(newConfig);
        setOriginalConfig(newConfig);
        setHasChanges(false);
      } else {
        toast.error(response.message || "Không thể cập nhật cấu hình");
      }
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error(error?.message || "Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(originalConfig);
    setHasChanges(false);
  };

  const handleRefreshClick = () => {
    setShowRefreshDialog(true);
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    setShowRefreshDialog(false);
    
    try {
      const result = await refreshFPGrowthCache();
      if (result.success) {
        toast.success("Đã làm mới cache thành công!");
        // Reload config after refresh
        await loadConfig();
      } else {
        toast.error(result.message || "Không thể làm mới cache");
      }
    } catch (error) {
      console.error("Error refreshing cache:", error);
      toast.error("Có lỗi xảy ra khi làm mới cache");
    } finally {
      setRefreshing(false);
    }
  };

  const getSupValueColor = (value: number) => {
    if (value >= 0.5) return "text-emerald-600 dark:text-emerald-400";
    if (value >= 0.3) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getConfValueColor = (value: number) => {
    if (value >= 0.7) return "text-emerald-600 dark:text-emerald-400";
    if (value >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <AdminHeader title="Cấu hình FP-Growth" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section with Futuristic Design */}
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
          {/* Main Configuration Panel */}
          <div className="lg:col-span-2">
            {/* Combined MIN_SUP & MIN_CONF Configuration */}
            <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-brand-50/50 via-purple-50/30 to-blue-50/30 dark:from-brand-900/20 dark:via-purple-900/20 dark:to-blue-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-brand-500 via-purple-500 to-blue-500 shadow-lg shadow-brand-500/50">
                    <Settings2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Cấu hình tham số FP-Growth
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Điều chỉnh các ngưỡng để tối ưu khai phá luật kết hợp
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 flex-1">
                {/* Input Controls - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* MIN_SUP Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="min-sup"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-brand-600" />
                        Minimum Support (MIN_SUP)
                      </Label>
                      <span className={`text-xl font-bold ${getSupValueColor(config.min_sup || 0)}`}>
                        {((config.min_sup || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="min-sup"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.min_sup || 0}
                        onChange={(e) =>
                          setConfig({ ...config, min_sup: parseFloat(e.target.value) || 0 })
                        }
                        disabled={loading || saving}
                        className="text-lg font-semibold border-2 focus:border-brand-500 dark:focus:border-brand-400 h-12 pl-4 pr-16 bg-white dark:bg-gray-900"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        {((config.min_sup || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      <div className="h-3 bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200 dark:from-red-900/30 dark:via-amber-900/30 dark:to-emerald-900/30 rounded-full relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300 shadow-lg shadow-brand-500/50"
                          style={{ width: `${(config.min_sup || 0) * 100}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-brand-500 shadow-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MIN_CONF Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="min-conf"
                        className="text-sm font-semibold flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        Minimum Confidence (MIN_CONF)
                      </Label>
                      <span className={`text-xl font-bold ${getConfValueColor(config.min_conf || 0)}`}>
                        {((config.min_conf || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="min-conf"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.min_conf || 0}
                        onChange={(e) =>
                          setConfig({ ...config, min_conf: parseFloat(e.target.value) || 0 })
                        }
                        disabled={loading || saving}
                        className="text-lg font-semibold border-2 focus:border-purple-500 dark:focus:border-purple-400 h-12 pl-4 pr-16 bg-white dark:bg-gray-900"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        {((config.min_conf || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                      <div className="h-3 bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200 dark:from-red-900/30 dark:via-amber-900/30 dark:to-emerald-900/30 rounded-full relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/50"
                          style={{ width: `${(config.min_conf || 0) * 100}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-purple-500 shadow-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Explanation */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          📊 Minimum Support (MIN_SUP):
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mb-2">
                          Xác định tần suất xuất hiện tối thiểu của một tập mục trong cơ sở dữ liệu. 
                          Giá trị cao hơn sẽ lọc các mẫu ít phổ biến, tăng hiệu suất nhưng có thể bỏ lỡ các mẫu tiềm năng.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-white/50 dark:bg-gray-800/50">
                            <span className="font-semibold">Giá trị thấp (&lt;0.3):</span> Nhiều mẫu hơn, xử lý chậm
                          </div>
                          <div className="p-2 rounded bg-white/50 dark:bg-gray-800/50">
                            <span className="font-semibold">Giá trị cao (&gt;0.5):</span> Ít mẫu, xử lý nhanh
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-blue-200/50 dark:border-blue-800/50 pt-3">
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          🎯 Minimum Confidence (MIN_CONF):
                        </p>
                        <p className="text-purple-700 dark:text-purple-300 mb-2">
                          Đo lường độ tin cậy của luật kết hợp. Giá trị cao hơn đảm bảo các luật có 
                          độ chính xác cao hơn, nhưng có thể giảm số lượng luật được tìm ra.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-white/50 dark:bg-gray-800/50">
                            <span className="font-semibold">Giá trị thấp (&lt;0.5):</span> Nhiều luật, độ tin cậy thấp
                          </div>
                          <div className="p-2 rounded bg-white/50 dark:bg-gray-800/50">
                            <span className="font-semibold">Giá trị cao (&gt;0.7):</span> Ít luật, độ tin cậy cao
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Status & Actions */}
          <div className="flex flex-col gap-4 h-full">
            {/* Current Status Card */}
            <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex-1 flex flex-col">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-green-50/30 dark:from-emerald-900/20 dark:to-green-900/10 border-b border-gray-200/50 dark:border-gray-700/50 py-3 px-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Trạng thái hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between px-4 pb-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-900/30 dark:to-brand-800/20 border border-brand-200/50 dark:border-brand-800/50">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      MIN_SUP
                    </span>
                    <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                      {((originalConfig.min_sup || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-800/50">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      MIN_CONF
                    </span>
                    <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {((originalConfig.min_conf || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Display transactions and rules info */}
                  {originalConfig.transactions !== undefined && originalConfig.transactions > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-100/50 dark:from-blue-900/30 dark:to-cyan-800/20 border border-blue-200/50 dark:border-blue-800/50">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Transactions
                      </span>
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                        {originalConfig.transactions || 0}
                      </span>
                    </div>
                  )}
                  
                  {originalConfig.rules !== undefined && originalConfig.rules >= 0 && (
                    <button
                      onClick={() => setShowRulesModal(true)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-green-100/50 dark:from-emerald-900/30 dark:to-green-800/20 border border-emerald-200/50 dark:border-emerald-800/50 hover:from-emerald-100 hover:to-green-200/50 dark:hover:from-emerald-800/40 dark:hover:to-green-700/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer group hover:shadow-md"
                    >
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        Rules Found
                        <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem chi tiết
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {originalConfig.rules || 0}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {hasChanges && (
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 animate-pulse">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Có thay đổi chưa lưu
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-200/50 dark:border-gray-700/50 py-3 px-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-gray-600" />
                  Thao tác
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 px-4 pb-4">
                <Button
                  onClick={handleSaveClick}
                  disabled={loading || saving || !hasChanges}
                  className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cấu hình
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={loading || saving || !hasChanges}
                  variant="outline"
                  className="w-full h-10 text-sm font-semibold border-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Khôi phục
                </Button>
                <Button
                  onClick={handleRefreshClick}
                  disabled={loading || saving || refreshing}
                  variant="ghost"
                  className="w-full h-10 text-sm font-semibold"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Đang làm mới..." : "Làm mới cache"}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <FPGrowthRulesModal open={showRulesModal} onOpenChange={setShowRulesModal} />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Xác nhận lưu cấu hình
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base text-gray-700 dark:text-gray-300">
                Khi bạn lưu cấu hình, hệ thống sẽ <strong className="text-brand-600 dark:text-brand-400">chạy lại thuật toán FP-Growth</strong> với các tham số mới:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>MIN_SUP:</strong> {((config.min_sup || 0) * 100).toFixed(1)}%
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>MIN_CONF:</strong> {((config.min_conf || 0) * 100).toFixed(1)}%
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Lưu ý:</strong> Quá trình này có thể mất vài phút tùy thuộc vào số lượng giao dịch. 
                    Vui lòng không đóng trang trong khi xử lý.
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              disabled={saving}
              className="mt-0"
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Xác nhận lưu
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refresh Cache Dialog */}
      <AlertDialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <RefreshCw className="h-6 w-6 text-blue-600" />
              Xác nhận làm mới cache
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base text-gray-700 dark:text-gray-300">
                Hành động này sẽ <strong className="text-blue-600 dark:text-blue-400">làm mới dữ liệu cache</strong> từ cơ sở dữ liệu:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Tải lại dữ liệu cấu hình FP-Growth từ database</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Cập nhật cache với thông tin mới nhất</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Đồng bộ hóa dữ liệu giữa server và client</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Thao tác này sẽ không thay đổi cấu hình hiện tại, chỉ làm mới dữ liệu từ nguồn.
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              disabled={refreshing}
              className="mt-0"
            >
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefreshCache}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Đang làm mới...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Xác nhận làm mới
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
