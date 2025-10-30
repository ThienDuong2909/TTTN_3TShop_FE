import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Users, MapPin, Check, Star } from "lucide-react";

// Interfaces
interface DeliveryStaff {
  MaNV: number;
  TenNV: string;
  DiaChi: string;
  SoDonDangGiao: number;
  KhuVucPhuTrach: string | null;
}

interface OrderEmployee {
  MaNV: number;
  TenNV: string;
}

interface Order {
  MaDDH: number;
  NguoiNhan: string;
  SDT: string;
  DiaChiGiao: string;
  TongTien: number;
  MaNV_Giao: number | null;
  NguoiGiao: OrderEmployee | null;
}

interface DeliveryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  deliveryStaff: DeliveryStaff[];
  selectedStaff: number | null;
  isLoadingStaff: boolean;
  isAssigning: boolean;
  onStaffSelect: (staffId: number) => void;
  onConfirm: () => void;
  formatPrice: (price: number) => string;
}

export const DeliveryAssignmentModal: React.FC<
  DeliveryAssignmentModalProps
> = ({
  isOpen,
  onClose,
  order,
  deliveryStaff,
  selectedStaff,
  isLoadingStaff,
  isAssigning,
  onStaffSelect,
  onConfirm,
  formatPrice,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#825B32]" />
            {order?.MaNV_Giao
              ? "Thay đổi nhân viên giao hàng"
              : "Phân công nhân viên giao hàng"}
          </DialogTitle>
          <DialogDescription>
            {order?.MaNV_Giao
              ? `Thay đổi nhân viên giao hàng cho đơn hàng #${order?.MaDDH}`
              : `Chọn nhân viên giao hàng phù hợp cho đơn hàng #${order?.MaDDH}`}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            {/* Order Info */}
            <div className="bg-[#825B32]/5 border border-[#825B32]/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-[#825B32]">
                <MapPin className="h-4 w-4" />
                Thông tin giao hàng
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Người nhận:</span>{" "}
                  {order.NguoiNhan}
                </p>
                <p>
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {order.SDT}
                </p>
                <p>
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {order.DiaChiGiao}
                </p>
                <p>
                  <span className="font-medium">Tổng tiền:</span>{" "}
                  {formatPrice(order.TongTien)}
                </p>
                {order.MaNV_Giao && order.NguoiGiao && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="flex items-center gap-2 text-green-700">
                      <Check className="h-3 w-3" />
                      <span className="font-medium">Đã phân công:</span>{" "}
                      {order.NguoiGiao.TenNV}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Staff List */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-[#825B32]">
                Danh sách nhân viên giao hàng
              </h4>

              {isLoadingStaff ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-sm text-muted-foreground">
                    Đang tải danh sách nhân viên...
                  </div>
                </div>
              ) : deliveryStaff.filter((staff) => staff.KhuVucPhuTrach)
                  .length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-sm text-muted-foreground">
                    Không có nhân viên giao hàng có khu vực phụ trách
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryStaff
                    .filter((staff) => staff.KhuVucPhuTrach)
                    .map((staff) => (
                      <div
                        key={staff.MaNV}
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 relative ${
                          selectedStaff === staff.MaNV
                            ? "border-[#825B32] bg-[#825B32]/10 shadow-md"
                            : "border-gray-200 hover:border-[#825B32]/50 hover:bg-[#825B32]/5"
                        }`}
                        onClick={() => onStaffSelect(staff.MaNV)}
                      >
                        {/* Selected Check Icon */}
                        {selectedStaff === staff.MaNV && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[#825B32] rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pr-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5
                                className={`font-medium text-sm ${
                                  selectedStaff === staff.MaNV
                                    ? "text-[#825B32]"
                                    : "text-gray-900"
                                }`}
                              >
                                {staff.TenNV}
                              </h5>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-yellow-600 font-medium">
                                  Có khu vực phụ trách
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p>Địa chỉ: {staff.DiaChi}</p>
                              <p className="text-blue-600">
                                Khu vực:{" "}
                                {
                                  staff.KhuVucPhuTrach
                                  // &&
                                  // staff.KhuVucPhuTrach.length > 60
                                  //   ? `${staff.KhuVucPhuTrach.substring(
                                  //       0,
                                  //       60
                                  //     )}...`
                                  //   : staff.KhuVucPhuTrach
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Đơn đang giao
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                staff.SoDonDangGiao === 0
                                  ? "text-green-600"
                                  : staff.SoDonDangGiao <= 3
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {staff.SoDonDangGiao}
                            </div>
                            {staff.SoDonDangGiao === 0 && (
                              <div className="text-xs text-green-600">Rảnh</div>
                            )}
                            {staff.SoDonDangGiao > 0 &&
                              staff.SoDonDangGiao <= 3 && (
                                <div className="text-xs text-yellow-600">
                                  Bình thường
                                </div>
                              )}
                            {staff.SoDonDangGiao > 3 && (
                              <div className="text-xs text-red-600">Bận</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedStaff || isAssigning}
            className="bg-[#825B32] hover:bg-[#825B32]/90 text-white"
          >
            {isAssigning
              ? order?.MaNV_Giao
                ? "Đang thay đổi..."
                : "Đang phân công..."
              : order?.MaNV_Giao
              ? "Thay đổi nhân viên"
              : "Phân công nhân viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
