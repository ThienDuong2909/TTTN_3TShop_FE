import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "../ui/button";

interface OrderDetail {
  ThongTinDonHang: {
    MaDDH: number;
  };
}

interface OrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetail: OrderDetail | null;
  isApproving: boolean;
  onConfirm: () => void;
}

export const OrderApprovalModal: React.FC<OrderApprovalModalProps> = ({
  isOpen,
  onClose,
  orderDetail,
  isApproving,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-[#825B32]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#825B32]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Xác nhận duyệt đơn hàng
              </h3>
              <p className="text-sm text-gray-500">
                Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Bạn có chắc chắn muốn duyệt đơn hàng này? Trạng thái đơn hàng sẽ
            được chuyển thành "Đã duyệt".
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isApproving}>
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isApproving}
              className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang duyệt...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Duyệt đơn hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
