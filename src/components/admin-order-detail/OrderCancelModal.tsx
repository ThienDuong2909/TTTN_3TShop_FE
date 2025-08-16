import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface OrderDetail {
  ThongTinDonHang: {
    MaDDH: number;
  };
}

interface OrderCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetail: OrderDetail | null;
  isCancelling: boolean;
  onConfirm: () => void;
}

export const OrderCancelModal: React.FC<OrderCancelModalProps> = ({
  isOpen,
  onClose,
  orderDetail,
  isCancelling,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận hủy đơn hàng
              </h3>
              <p className="text-sm text-gray-500">
                Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn
            tác.
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isCancelling}>
              Hủy bỏ
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isCancelling}
              variant="destructive"
            >
              {isCancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang hủy...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
