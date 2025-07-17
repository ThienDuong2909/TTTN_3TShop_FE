import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Send,
  CheckCircle,
  Package,
  Calendar,
  User,
  DollarSign,
  Save,
  X,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { useApp } from "../contexts/AppContext";
import {
  purchaseOrders,
  suppliers,
  products,
  PurchaseOrder,
  PurchaseOrderItem,
  } from "../libs/data";

export default function PurchaseOrders() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Form state for new purchase order
  const [poForm, setPOForm] = useState({
    supplierId: "",
    expectedDeliveryDate: "",
    notes: "",
    items: [] as Omit<PurchaseOrderItem, "totalPrice">[],
  });

  // Check permissions
  if (
    !state.user ||
    (state.user.role !== "admin" &&
      !state.user.permissions?.includes("manage_inventory"))
  ) {
    navigate("/admin");
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Nháp", variant: "secondary" as const },
      sent: { label: "Đã gửi", variant: "outline" as const },
      confirmed: { label: "Đã xác nhận", variant: "default" as const },
      partially_received: {
        label: "Nhập một phần",
        variant: "outline" as const,
      },
      completed: { label: "Hoàn thành", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <Badge variant={statusInfo?.variant || "secondary"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addItemToPO = () => {
    setPOForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          productId: "",
          productName: "",
          selectedColor: "",
          selectedSize: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  };

  const updatePOItem = (
    index: number,
    field: keyof Omit<PurchaseOrderItem, "totalPrice">,
    value: any,
  ) => {
    const newItems = [...poForm.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill product name when product is selected
    if (field === "productId") {
      const product = products.find((p) => p.id.toString() === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = Math.floor(product.price * 0.6); // Wholesale price
      }
    }

    setPOForm({ ...poForm, items: newItems });
  };

  const removePOItem = (index: number) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    return poForm.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
  };

  const handleCreatePO = () => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      alert("Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm");
      return;
    }

    const supplier = suppliers.find((s) => s.id === poForm.supplierId);
    if (!supplier) return;

    const newPO: PurchaseOrder = {
      id: `PO${String(purchaseOrders.length + 1).padStart(3, "0")}`,
      supplierId: poForm.supplierId,
      supplierName: supplier.name,
      items: poForm.items.map((item) => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
      status: "draft",
      totalAmount: calculateTotal(),
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: poForm.expectedDeliveryDate,
      notes: poForm.notes,
      createdBy: state.user?.id || "",
    };

    console.log("Creating Purchase Order:", newPO);
    setIsCreatePOOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setPOForm({
      supplierId: "",
      expectedDeliveryDate: "",
      notes: "",
      items: [],
    });
  };

  const handleSendPO = (poId: string) => {
    console.log("Sending PO to supplier:", poId);
  };

  const handleConfirmPO = (poId: string) => {
    console.log("Confirming PO:", poId);
  };

  const CreatePOForm = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Nhà cung cấp *</Label>
          <Select
            value={poForm.supplierId}
            onValueChange={(value) =>
              setPOForm({ ...poForm, supplierId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn nhà cung cấp" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deliveryDate">Ngày giao dự kiến</Label>
          <Input
            id="deliveryDate"
            type="date"
            value={poForm.expectedDeliveryDate}
            onChange={(e) =>
              setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })
            }
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Danh sách sản phẩm *</Label>
          <Button onClick={addItemToPO} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>

        {poForm.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            {poForm.items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Sản phẩm</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) =>
                          updatePOItem(index, "productId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Màu sắc</Label>
                      <Input
                        value={item.selectedColor}
                        onChange={(e) =>
                          updatePOItem(index, "selectedColor", e.target.value)
                        }
                        placeholder="#ffffff"
                      />
                    </div>

                    <div>
                      <Label>Kích thước</Label>
                      <Input
                        value={item.selectedSize}
                        onChange={(e) =>
                          updatePOItem(index, "selectedSize", e.target.value)
                        }
                        placeholder="M, L, XL..."
                      />
                    </div>

                    <div>
                      <Label>Số lượng</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updatePOItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min="1"
                      />
                    </div>

                    <div>
                      <Label>Đơn giá</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updatePOItem(
                            index,
                            "unitPrice",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min="0"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {formatPrice(item.quantity * item.unitPrice)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePOItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="text-right">
              <div className="text-lg font-bold">
                Tổng cộng: {formatPrice(calculateTotal())}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          value={poForm.notes}
          onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
          placeholder="Ghi chú thêm về đơn đặt hàng..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreatePOOpen(false);
            resetForm();
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleCreatePO}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Tạo phiếu đặt hàng
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <AdminHeader title="Quản lý phiếu đặt hàng" />

      <main className="py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-600 hover:bg-brand-700">
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu đặt hàng
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo phiếu đặt hàng mới</DialogTitle>
                <DialogDescription>
                  Tạo phiếu đặt hàng với nhà cung cấp để nhập kho
                </DialogDescription>
              </DialogHeader>
              <CreatePOForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm theo mã phiếu hoặc nhà cung cấp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="sent">Đã gửi</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="partially_received">
                    Nhập một phần
                  </SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách phiếu đặt hàng ({filteredPOs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã phiếu</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Số lượng SP</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày giao dự kiến</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{po.supplierName}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {po.supplierId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{po.items.length} sản phẩm</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(po.totalAmount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>{formatDate(po.orderDate)}</TableCell>
                    <TableCell>
                      {po.expectedDeliveryDate
                        ? formatDate(po.expectedDeliveryDate)
                        : "Chưa xác định"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPO(po)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {po.status === "draft" && (
                          <>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendPO(po.id)}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {po.status === "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmPO(po.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {(po.status === "confirmed" ||
                          po.status === "partially_received") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/goods-receipt?po=${po.id}`)
                            }
                          >
                            <Package className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Purchase Order Details Dialog */}
        <Dialog
          open={!!selectedPO}
          onOpenChange={(open) => !open && setSelectedPO(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Chi tiết phiếu đặt hàng {selectedPO?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedPO && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nhà cung cấp</Label>
                    <div className="font-medium">{selectedPO.supplierName}</div>
                  </div>
                  <div>
                    <Label>Trạng thái</Label>
                    <div>{getStatusBadge(selectedPO.status)}</div>
                  </div>
                  <div>
                    <Label>Ngày tạo</Label>
                    <div>{formatDate(selectedPO.orderDate)}</div>
                  </div>
                  <div>
                    <Label>Ngày giao dự kiến</Label>
                    <div>
                      {selectedPO.expectedDeliveryDate
                        ? formatDate(selectedPO.expectedDeliveryDate)
                        : "Chưa xác định"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Danh sách sản phẩm</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Màu/Size</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Đơn giá</TableHead>
                        <TableHead>Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>
                            {item.selectedColor && (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{
                                    backgroundColor: item.selectedColor,
                                  }}
                                />
                                {item.selectedSize}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right mt-4">
                    <div className="text-lg font-bold">
                      Tổng cộng: {formatPrice(selectedPO.totalAmount)}
                    </div>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div>
                    <Label>Ghi chú</Label>
                    <div className="bg-muted p-3 rounded">
                      {selectedPO.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </main>
    </div>
  );
}
