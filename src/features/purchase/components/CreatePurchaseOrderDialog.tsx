import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import CreatePurchaseOrderForm from "./CreatePurchaseOrderForm";
import { POForm, Supplier, Product } from "../types";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  poForm: POForm;
  setPOForm: (form: POForm) => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: () => void;
  isLoading?: boolean;
}

export default function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  trigger,
  poForm,
  setPOForm,
  suppliers,
  products,
  onSubmit,
  isLoading = false,
}: CreatePurchaseOrderDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu đặt hàng mới</DialogTitle>
          <DialogDescription>
            Tạo phiếu đặt hàng với nhà cung cấp để nhập kho
          </DialogDescription>
        </DialogHeader>
        <CreatePurchaseOrderForm
          poForm={poForm}
          setPOForm={setPOForm}
          suppliers={suppliers}
          products={products}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
} 