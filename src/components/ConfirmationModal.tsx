import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReturn: any;
  confirmAction: "approve" | "reject";
  isUpdatingStatus: boolean;
  formatPrice: (price: number) => string;
  onExecuteAction: () => void;
}

export default function ConfirmationModal({
  open,
  onOpenChange,
  selectedReturn,
  confirmAction,
  isUpdatingStatus,
  formatPrice,
  onExecuteAction,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {confirmAction === "approve" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Xác nhận duyệt phiếu trả
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Xác nhận từ chối phiếu trả
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {selectedReturn && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Mã phiếu trả:
                    </span>
                    <span className="font-mono font-semibold">
                      #{selectedReturn.MaPhieuTra}
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Số hóa đơn:
                    </span>
                    <span className="font-mono">{selectedReturn.SoHD}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Khách hàng:
                    </span>
                    <span className="font-medium">
                      {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.TenKH ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      Số tiền hoàn trả:
                    </span>
                    <span className="font-bold text-green-600">
                      {formatPrice(
                        selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                          (sum: number, item: any) =>
                            sum +
                            Number(item?.DonGia || 0) * (item?.SoLuongTra || 0),
                          0
                        ) || 0
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action specific message */}
              <div
                className={`border rounded-lg p-3 ${
                  confirmAction === "approve"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    confirmAction === "approve"
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {confirmAction === "approve" ? (
                    <>
                      <strong>Xác nhận duyệt:</strong> Phiếu trả này sẽ được
                      duyệt và trạng thái sẽ chuyển thành "Đã duyệt". Bạn có
                      chắc chắn muốn tiếp tục?
                    </>
                  ) : (
                    <>
                      <strong>Xác nhận từ chối:</strong> Phiếu trả này sẽ bị từ
                      chối và trạng thái sẽ chuyển thành "Từ chối". Bạn có chắc
                      chắn muốn tiếp tục?
                    </>
                  )}
                </p>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <p>
                  <strong>Lưu ý:</strong> Hành động này không thể hoàn tác. Vui
                  lòng kiểm tra kỹ thông tin trước khi xác nhận.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdatingStatus}
          >
            Hủy
          </Button>
          <Button
            onClick={onExecuteAction}
            disabled={isUpdatingStatus}
            className={
              confirmAction === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isUpdatingStatus ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                {confirmAction === "approve" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác nhận duyệt
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Xác nhận từ chối
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
