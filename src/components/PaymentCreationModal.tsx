import { DollarSign } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface PaymentCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReturn: any;
  isCreatingPayment: boolean;
  formatPrice: (price: number) => string;
  onCreatePayment: () => void;
}

export default function PaymentCreationModal({
  open,
  onOpenChange,
  selectedReturn,
  isCreatingPayment,
  formatPrice,
  onCreatePayment,
}: PaymentCreationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Xác nhận tạo phiếu chi
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {selectedReturn && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Mã phiếu trả:
                    </span>
                    <span className="font-mono font-semibold">
                      #{selectedReturn.MaPhieuTra}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Số hóa đơn:
                    </span>
                    <span className="font-mono">{selectedReturn.SoHD}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Khách hàng:
                    </span>
                    <span className="font-medium">
                      {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      SĐT khách hàng:
                    </span>
                    <span className="font-mono">
                      {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.SDT ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount to refund */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                    Số tiền hoàn trả
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatPrice(
                      selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                        (sum: number, item: any) =>
                          sum +
                          Number(item?.DonGia || 0) * (item?.SoLuongTra || 0),
                        0
                      ) || 0
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  <strong>Xác nhận tạo phiếu chi:</strong> Hệ thống sẽ tạo phiếu
                  chi để hoàn trả số tiền trên cho khách hàng. Bạn có chắc chắn
                  muốn tiếp tục?
                </p>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                <p>
                  <strong>Lưu ý:</strong> Sau khi tạo phiếu chi, hành động này
                  không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin trước khi
                  xác nhận.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingPayment}
          >
            Hủy
          </Button>
          <Button
            onClick={onCreatePayment}
            disabled={isCreatingPayment}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingPayment ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Xác nhận tạo phiếu chi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
