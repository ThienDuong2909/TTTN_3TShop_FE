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

interface Order {
  MaDDH: number;
  NguoiNhan: string;
  SDT: string;
  DiaChiGiao: string;
  TongTien: number;
  [key: string]: any; // Allow additional properties
}

interface InvoiceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isCreating: boolean;
  onConfirm: () => void;
  formatPrice: (price: number) => string;
  getTotalItems: (order: any) => number; // Use any to accept any order type
}

export const InvoiceCreationModal: React.FC<InvoiceCreationModalProps> = ({
  isOpen,
  onClose,
  order,
  isCreating,
  onConfirm,
  formatPrice,
  getTotalItems,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn tạo hóa đơn cho đơn hàng #{order?.MaDDH}?
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="mt-4 space-y-3">
            <div className="bg-[#825B32]/5 border border-[#825B32]/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2 text-[#825B32]">
                Thông tin đơn hàng
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
                <p>
                  <span className="font-medium">Số lượng sản phẩm:</span>{" "}
                  {getTotalItems(order)}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? "Đang tạo hóa đơn..." : "Tạo hóa đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
