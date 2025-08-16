import React from "react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface StockHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockHistoryDialog: React.FC<StockHistoryDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử điều chỉnh tồn kho</DialogTitle>
          <DialogDescription>
            Lịch sử các lần thay đổi số lượng tồn kho của sản phẩm
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mock stock history */}
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Nhập hàng từ nhà cung cấp</p>
                  <p className="text-sm text-gray-600">
                    Cập nhật: +50 sản phẩm các size
                  </p>
                  <p className="text-xs text-gray-500">20/01/2024 13:15</p>
                </div>
                <Badge className="bg-green-100 text-green-800">+50</Badge>
              </div>
            </div>
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Điều chỉnh kiểm kê</p>
                  <p className="text-sm text-gray-600">
                    Hiệu chỉnh sau kiểm kê định kỳ
                  </p>
                  <p className="text-xs text-gray-500">18/01/2024 16:30</p>
                </div>
                <Badge className="bg-red-100 text-red-800">-12</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
