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

interface BatchCompleteOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrdersCount: number;
  isCompleting: boolean;
  onConfirm: () => void;
}

export const BatchCompleteOrdersModal: React.FC<
  BatchCompleteOrdersModalProps
> = ({ isOpen, onClose, selectedOrdersCount, isCompleting, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận hoàn tất đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn đánh dấu những đơn hàng đã chọn là hoàn tất?
            Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Số đơn hàng đã chọn: <strong>{selectedOrdersCount}</strong>
          </p>
        </div>
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
