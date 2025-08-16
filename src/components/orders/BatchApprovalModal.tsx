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

interface BatchApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrdersCount: number;
  isApproving: boolean;
  onConfirm: () => void;
}

export const BatchApprovalModal: React.FC<BatchApprovalModalProps> = ({
  isOpen,
  onClose,
  selectedOrdersCount,
  isApproving,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận duyệt đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn duyệt những đơn hàng đã chọn? Hành động này
            không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Số đơn hàng đã chọn: <strong>{selectedOrdersCount}</strong>
          </p>
        </div>
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
