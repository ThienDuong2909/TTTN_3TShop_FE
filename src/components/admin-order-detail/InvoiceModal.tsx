import React from "react";
import { FileText } from "lucide-react";
import { Button } from "../ui/button";

interface OrderDetail {
  ThongTinDonHang: {
    MaDDH: number;
  };
  ThongTinHoaDon: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetail: OrderDetail | null;
  isCreating: boolean;
  onConfirm: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  orderDetail,
  isCreating,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-[#825B32]/10 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#825B32]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tạo hóa đơn cho đơn hàng
              </h3>
              <p className="text-sm text-gray-500">
                Đơn hàng #{orderDetail?.ThongTinDonHang.MaDDH}
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            {orderDetail?.ThongTinHoaDon
              ? "Đơn hàng này đã có hóa đơn. Bạn có muốn xem chi tiết hóa đơn?"
              : "Bạn có chắc chắn muốn tạo hóa đơn cho đơn hàng này? Hóa đơn sẽ được lưu vào hệ thống."}
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Hủy
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isCreating}
              className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {orderDetail?.ThongTinHoaDon ? "Xem hóa đơn" : "Tạo hóa đơn"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
