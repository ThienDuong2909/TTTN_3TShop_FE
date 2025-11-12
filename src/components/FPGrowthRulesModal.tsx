import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { getFPGrowthRules } from "@/services/api";
import { toast } from "sonner";

interface FPGrowthRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  MaSP: number;
  TenSP: string;
  AnhSanPhams: Array<{
    DuongDan: string;
    AnhChinh: boolean;
  }>;
  ThayDoiGia: Array<{
    Gia: string;
  }>;
}

interface Rule {
  rule_id: number;
  antecedent_ids: number[];
  consequent_id: number;
  support: number;
  confidence: number;
  lift: number;
  antecedent_products: Product[];
  consequent_product: Product;
  interpretation: string;
}

export default function FPGrowthRulesModal({ open, onOpenChange }: FPGrowthRulesModalProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());
  const [modelInfo, setModelInfo] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadRules();
    }
  }, [open]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await getFPGrowthRules({ limit: 100 });
      console.log("Rules response:", response);
      
      if (response.success && response.data) {
        setRules(response.data.rules || []);
        setModelInfo(response.data.model_info);
      } else {
        toast.error("Không thể tải danh sách rules");
      }
    } catch (error) {
      console.error("Error loading rules:", error);
      toast.error("Lỗi khi tải danh sách rules");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (ruleId: number) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const getProductImage = (product: Product) => {
    const mainImage = product.AnhSanPhams?.find((img) => img.AnhChinh);
    return mainImage?.DuongDan || product.AnhSanPhams?.[0]?.DuongDan || "/placeholder.png";
  };

  const getProductPrice = (product: Product) => {
    const latestPrice = product.ThayDoiGia?.[0]?.Gia;
    if (latestPrice) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(parseFloat(latestPrice));
    }
    return "N/A";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-emerald-600 dark:text-emerald-400";
    if (confidence >= 0.7) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.5) return "text-amber-600 dark:text-amber-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getSupportColor = (support: number) => {
    if (support >= 0.6) return "text-blue-600 dark:text-blue-400";
    if (support >= 0.4) return "text-cyan-600 dark:text-cyan-400";
    if (support >= 0.2) return "text-sky-600 dark:text-sky-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getLiftColor = (lift: number) => {
    if (lift >= 1.5) return "text-purple-600 dark:text-purple-400";
    if (lift >= 1.2) return "text-violet-600 dark:text-violet-400";
    if (lift >= 1.0) return "text-indigo-600 dark:text-indigo-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-brand-600" />
            Danh sách Association Rules
          </DialogTitle>
          <DialogDescription>
            {modelInfo && (
              <div className="flex flex-wrap gap-2 lg:gap-4 mt-2 text-xs lg:text-sm">
                <span>
                  <strong>Transactions:</strong> {modelInfo.transactions}
                </span>
                <span>
                  <strong>MIN_SUP:</strong> {(modelInfo.min_sup * 100).toFixed(1)}%
                </span>
                <span>
                  <strong>MIN_CONF:</strong> {(modelInfo.min_conf * 100).toFixed(1)}%
                </span>
                <span>
                  <strong>Total Rules:</strong> {modelInfo.total_rules}
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Không có rules nào được tìm thấy
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {rules.map((rule) => {
              const isExpanded = expandedRules.has(rule.rule_id);
              
              return (
                <Card
                  key={rule.rule_id}
                  className="border-2 hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-200"
                >
                  <CardContent className="p-4">
                    {/* Compact View */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                      {/* Antecedent Products */}
                      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap flex-1 min-w-0 w-full lg:w-auto">
                        {rule.antecedent_products.map((product, idx) => (
                          <div key={product.MaSP} className="flex items-center gap-2 flex-shrink-0">
                            {idx > 0 && (
                              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400 px-1">
                                +
                              </span>
                            )}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[180px] lg:w-[200px]">
                              <img
                                src={getProductImage(product)}
                                alt={product.TenSP}
                                className="w-12 h-12 lg:w-14 lg:h-14 object-cover rounded flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span 
                                  className="text-xs lg:text-sm font-medium line-clamp-2 leading-tight"
                                  title={product.TenSP}
                                >
                                  {product.TenSP}
                                </span>
                                <span className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {getProductPrice(product)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="h-6 w-6 lg:h-7 lg:w-7 text-brand-600 dark:text-brand-400 flex-shrink-0 mx-auto lg:mx-1 rotate-90 lg:rotate-0" />

                      {/* Consequent Product */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-200 dark:border-brand-800 w-[180px] lg:w-[200px] flex-shrink-0 mx-auto lg:mx-0">
                        <img
                          src={getProductImage(rule.consequent_product)}
                          alt={rule.consequent_product.TenSP}
                          className="w-12 h-12 lg:w-14 lg:h-14 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span 
                            className="text-xs lg:text-sm font-medium line-clamp-2 leading-tight"
                            title={rule.consequent_product.TenSP}
                          >
                            {rule.consequent_product.TenSP}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5 truncate">
                            {getProductPrice(rule.consequent_product)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Metrics */}
                      <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto flex-shrink-0 justify-between lg:justify-end mt-2 lg:mt-0">
                        <Badge variant="secondary" className={`${getConfidenceColor(rule.confidence)} font-semibold px-3 py-1 text-xs lg:text-sm`}>
                          {(rule.confidence * 100).toFixed(1)}%
                        </Badge>
                        
                        {/* Expand Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(rule.rule_id)}
                          className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {/* Interpretation */}
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-xs lg:text-sm text-blue-900 dark:text-blue-100">
                            <strong>Giải thích:</strong> {rule.interpretation}
                          </p>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
                          <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                            <div className={`text-xl lg:text-2xl font-bold ${getConfidenceColor(rule.confidence)}`}>
                              {(rule.confidence * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Độ tin cậy của luật
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="text-xs text-muted-foreground mb-1">Support</div>
                            <div className={`text-xl lg:text-2xl font-bold ${getSupportColor(rule.support)}`}>
                              {(rule.support * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Tần suất xuất hiện
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
                            <div className="text-xs text-muted-foreground mb-1">Lift</div>
                            <div className={`text-xl lg:text-2xl font-bold ${getLiftColor(rule.lift)}`}>
                              {rule.lift.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Mức độ liên quan
                            </div>
                          </div>
                        </div>

                        {/* Rule ID */}
                        <div className="text-xs text-muted-foreground text-right">
                          Rule ID: #{rule.rule_id}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
