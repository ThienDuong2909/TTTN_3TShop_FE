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

interface SingleOrderApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  isApproving: boolean;
  onConfirm: () => void;
}

export const SingleOrderApprovalModal: React.FC<
  SingleOrderApprovalModalProps
> = ({ isOpen, onClose, orderId, isApproving, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận duyệt đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn duyệt đơn hàng #{orderId}? Hành động này không
            thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isApproving}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={isApproving}>
            {isApproving ? "Đang duyệt..." : "Duyệt đơn hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
