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

interface SingleOrderCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  isCompleting: boolean;
  onConfirm: () => void;
}

export const SingleOrderCompleteModal: React.FC<
  SingleOrderCompleteModalProps
> = ({ isOpen, onClose, orderId, isCompleting, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận hoàn tất đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn đánh dấu đơn hàng #{orderId} là hoàn tất? Hành
            động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isCompleting}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={isCompleting}>
            {isCompleting ? "Đang hoàn tất..." : "Hoàn tất đơn hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
