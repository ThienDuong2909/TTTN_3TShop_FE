import React from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface PriceChange {
  MaSP: number;
  NgayThayDoi: string;
  Gia: string;
  NgayApDung: string;
}

interface PriceHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  priceHistory: PriceChange[];
  formatCurrency: (amount: string | number) => string;
}

export const PriceHistoryDialog: React.FC<PriceHistoryDialogProps> = ({
  isOpen,
  onClose,
  productName,
  priceHistory,
  formatCurrency,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-[#825B32]">
            <TrendingUp className="w-5 h-5 mr-2" />
            Lịch sử thay đổi giá bán
          </DialogTitle>
          <DialogDescription>
            Toàn bộ lịch sử các lần thay đổi giá của sản phẩm {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {priceHistory && priceHistory.length > 0 ? (
            <div className="space-y-3">
              {priceHistory
                .sort(
                  (a, b) =>
                    new Date(b.NgayApDung).getTime() -
                    new Date(a.NgayApDung).getTime()
                )
                .map((priceChange, index) => (
                  <div
                    key={`${priceChange.NgayThayDoi}-${index}`}
                    className={`relative p-4 rounded-lg border transition-all hover:shadow-sm ${
                      index === 0
                        ? "bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 border-[#825B32]/20"
                        : "bg-gray-50/50 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              index === 0
                                ? "bg-[#825B32] text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <p
                              className={`font-bold text-lg ${
                                index === 0 ? "text-[#825B32]" : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(priceChange.Gia)}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                Thay đổi:{" "}
                                {new Date(
                                  priceChange.NgayThayDoi
                                ).toLocaleDateString("vi-VN")}
                              </span>
                              <span>•</span>
                              <span>
                                Áp dụng:{" "}
                                {new Date(
                                  priceChange.NgayApDung
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {index === 0 && (
                          <Badge className="bg-[#825B32] hover:bg-[#825B32]/90">
                            Giá hiện tại
                          </Badge>
                        )}
                        {index > 0 && (
                          <Badge
                            variant="outline"
                            className="text-gray-600 border-gray-300"
                          >
                            #{priceHistory.length - index}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có lịch sử giá
              </h3>
              <p className="text-gray-500 text-sm">
                Sản phẩm này chưa có thông tin về các lần thay đổi giá
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
