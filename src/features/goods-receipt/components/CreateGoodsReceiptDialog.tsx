import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import CreateGoodsReceiptForm from "./CreateGoodsReceiptForm";

interface GoodsReceiptItem {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  selectedColor: string;
  selectedSize: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  condition: "good" | "damaged" | "defective";
  notes?: string;
  totalReceivedValue: number;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    selectedColor?: string;
    selectedSize?: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface GRForm {
  purchaseOrderId: string;
  receivedBy: string;
  notes: string;
  items: Omit<GoodsReceiptItem, "totalReceivedValue">[];
}

interface CreateGoodsReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  grForm: GRForm;
  setGRForm: (form: GRForm) => void;
  availablePOs: PurchaseOrder[];
  selectedPO: PurchaseOrder | null;
  onPOSelect: (poId: string) => void;
  onCreateGR: () => void;
  loading: {
    purchaseOrders: boolean;
    creating: boolean;
  };
  currentUserName: string;
  currentUserId: string;
  excelData: any[];
  setExcelData: (data: any[]) => void;
  excelError: string;
  setExcelError: (error: string) => void;
}

export default function CreateGoodsReceiptDialog({
  open,
  onOpenChange,
  trigger,
  grForm,
  setGRForm,
  availablePOs,
  selectedPO,
  onPOSelect,
  onCreateGR,
  loading,
  currentUserName,
  currentUserId,
  excelData,
  setExcelData,
  excelError,
  setExcelError,
}: CreateGoodsReceiptDialogProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu nhập hàng</DialogTitle>
          <DialogDescription>
            Xác nhận số lượng và tình trạng hàng nhận từ nhà cung cấp. Có thể nhập
            tay hoặc import từ Excel.
          </DialogDescription>
        </DialogHeader>
        <CreateGoodsReceiptForm
          grForm={grForm}
          setGRForm={setGRForm}
          availablePOs={availablePOs}
          selectedPO={selectedPO}
          onPOSelect={onPOSelect}
          onCreateGR={onCreateGR}
          onCancel={handleCancel}
          loading={loading}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          excelData={excelData}
          setExcelData={setExcelData}
          excelError={excelError}
          setExcelError={setExcelError}
        />
      </DialogContent>
    </Dialog>
  );
} 