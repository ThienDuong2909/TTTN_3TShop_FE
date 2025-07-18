import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import CreatePurchaseOrderForm from "./CreatePurchaseOrderForm";
import EditPurchaseOrderForm from "./EditPurchaseOrderForm";
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
  isEditMode?: boolean;
  editingPO?: any;
  isLoadingPODetails?: boolean;
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
  isEditMode = false,
  editingPO,
  isLoadingPODetails = false,
}: CreatePurchaseOrderDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh sửa phiếu đặt hàng" : "Tạo phiếu đặt hàng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Chỉnh sửa phiếu đặt hàng ${editingPO?.id || ""}`
              : "Tạo phiếu đặt hàng với nhà cung cấp để nhập kho"
            }
          </DialogDescription>
        </DialogHeader>
        {isEditMode ? (
          <EditPurchaseOrderForm
            poForm={poForm}
            setPOForm={setPOForm}
            suppliers={suppliers}
            products={products}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        ) : (
          <CreatePurchaseOrderForm
            poForm={poForm}
            setPOForm={setPOForm}
            suppliers={suppliers}
            products={products}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
} 