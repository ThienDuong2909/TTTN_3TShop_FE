import { Plus, Save, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import { formatPrice } from "../../../services/api";
import { getProductColorsSizes, getProductsBySupplier } from "../../../services/commonService";
import { POForm, Supplier, Product, PurchaseOrderItem, ProductDetail } from "../types";
import { useState, useEffect } from "react";
import clsx from "clsx";

// Define Color and Size types
interface Color {
  MaMau: number;
  TenMau: string;
  MaHex?: string;
}

interface Size {
  MaKichThuoc: number;
  TenKichThuoc: string;
}

interface EditPurchaseOrderFormProps {
  poForm: POForm;
  setPOForm: (form: POForm) => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditPurchaseOrderForm({
  poForm,
  setPOForm,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isLoading = false,
}: EditPurchaseOrderFormProps) {
  // State for product details for each item
  const [itemProductDetails, setItemProductDetails] = useState<{ [key: number]: ProductDetail[] }>({});
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // State for colors and sizes (if needed for future use)
  const [itemColorsSizes, setItemColorsSizes] = useState<{ [key: number]: { colors: Color[], sizes: Size[] } }>({});
  // Validate form
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const isFieldInvalid = (field: string, value: any) => {
    if (!touched[field]) return false;
    if (typeof value === 'string') return !value.trim();
    if (typeof value === 'number') return value === 0;
    return !value;
  };

  useEffect(() => {
    if (!poForm.supplierId) {
      setFilteredProducts([]);
    }
  }, [poForm.supplierId]);

  const isProductDetailSelected = (productDetailId: number, currentIndex: number) => {
    return poForm.items.some((item, index) => 
      index !== currentIndex && 
      item.MaCTSP === productDetailId
    );
  };

  const loadProductsBySupplier = async (supplierId: string) => {
    if (!supplierId) {
      setFilteredProducts([]);
      return;
    }
    setLoadingProducts(true);
    try {
      const response = await getProductsBySupplier(supplierId);
      let productData: any[] = [];
      if (Array.isArray(response)) {
        productData = response;
      } else if (response && Array.isArray((response as any).data)) {
        productData = (response as any).data;
      } else if (response && typeof response === 'object') {
        const responseObj = response as any;
        productData = responseObj.products || responseObj.items || responseObj.result || [];
      }
      let transformedProducts: Product[] = [];
      if (productData.length > 0) {
        transformedProducts = productData.map((product: any) => ({
          id: product.MaSP || product.id,
          name: product.TenSP || product.name,
          price: product.DonGia || product.price || 0,
          description: product.MoTa || product.description || "",
          category: product.LoaiSP || product.category || "clothing",
        }));
      }
      setFilteredProducts(transformedProducts);
    } catch (error) {
      setFilteredProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getAvailableSuppliers = () => {
    const selectedProductIds = poForm.items.map(item => item.MaSP).filter(id => id);
    if (selectedProductIds.length === 0) {
      return suppliers;
    }
    return suppliers.filter(supplier => true);
  };

  const autoFillSupplierForProduct = async (productId: string) => {
    try {
      const selectedProduct = products.find(p => p.id.toString() === productId.toString());
      if (selectedProduct && (selectedProduct as any).supplierId) {
        const supplierId = (selectedProduct as any).supplierId;
        const newSupplierId = supplierId.toString();
        setPOForm({ ...poForm, supplierId: newSupplierId });
        loadProductsBySupplier(newSupplierId);
        return;
      }
      for (const supplier of suppliers) {
        try {
          const response = await getProductsBySupplier(supplier.id.toString());
          let supplierProducts: any[] = [];
          if (Array.isArray(response)) {
            supplierProducts = response;
          } else if (response && Array.isArray((response as any).data)) {
            supplierProducts = (response as any).data;
          }
          const hasProduct = supplierProducts.some(p => 
            (p.MaSP || p.id)?.toString() === productId.toString()
          );
          if (hasProduct) {
            const newSupplierId = supplier.id.toString();
            setPOForm({ ...poForm, supplierId: newSupplierId });
            loadProductsBySupplier(newSupplierId);
            return;
          }
        } catch (error) {}
      }
    } catch (error) {}
  };

  const loadProductDetails = async (index: number, productId: string) => {
    if (!productId || productId === "") {
      return;
    }
    
    try {
      const response = await getProductColorsSizes(productId);
      
      // Handle different API response formats
      let productDetails: ProductDetail[] = [];
      
      // Try different response formats
      if (Array.isArray(response)) {
        productDetails = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        productDetails = response.data;
      } else if (response && Array.isArray(response.data)) {
        productDetails = response.data;
      } else if (response && typeof response === 'object') {
        // Try to find array in common properties
        const responseObj = response as any;
        productDetails = responseObj.products || responseObj.items || responseObj.result || responseObj.data || [];
      }
      
      setItemProductDetails(prev => ({
        ...prev,
        [index]: productDetails
      }));
      
    } catch (error) {
      console.error(`Error loading product details for product ${productId}:`, error);
      // Set empty array on error
      setItemProductDetails(prev => ({
        ...prev,
        [index]: []
      }));
    }
  };

  const addItemToPO = () => {
    setPOForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          MaSP: "",
          productName: "",
          MaCTSP: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  };

  const updatePOItem = (
    index: number,
    field: keyof Omit<PurchaseOrderItem, "totalPrice">,
    value: any
  ) => {
    const newItems = [...poForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "MaSP") {
      const allProducts = filteredProducts.length > 0 ? filteredProducts : products;
      const product = allProducts.find((p) => p.id.toString() === value.toString());
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = Math.floor(product.price * 0.6);
        // Reset product detail when product changes
        newItems[index].MaCTSP = "";
        newItems[index].colorName = "";
        newItems[index].sizeName = "";
        // Clear existing product details for this index first
        setItemProductDetails(prev => ({
          ...prev,
          [index]: []
        }));
        // Load product details for the new product immediately
        loadProductDetails(index, value);
        if (!poForm.supplierId && filteredProducts.length === 0) {
          autoFillSupplierForProduct(value);
        }
      } else {
        // Clear product details if no product selected
        setItemProductDetails(prev => ({
          ...prev,
          [index]: []
        }));
      }
    }

    // Auto-fill color and size names when product detail is selected
    if (field === "MaCTSP") {
      const productDetails = itemProductDetails[index] || [];
      const selectedDetail = productDetails.find(detail => detail.MaCTSP === value);
      if (selectedDetail) {
        newItems[index].colorName = selectedDetail.Mau.TenMau;
        newItems[index].sizeName = selectedDetail.KichThuoc.TenKichThuoc;
      }
    }

    // Check if the selected product detail is already used
    if (field === "MaCTSP") {
      const isAlreadySelected = isProductDetailSelected(value, index);
      if (isAlreadySelected) {
        // Clear the field to avoid duplicate
        newItems[index][field] = "";
        newItems[index].colorName = "";
        newItems[index].sizeName = "";
      }
    }
    setPOForm({ ...poForm, items: newItems });
  };

  const removePOItem = (index: number) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
    setItemColorsSizes(prev => {
      const newState = { ...prev };
      delete newState[index];
      const reindexed: { [key: number]: { colors: Color[], sizes: Size[] } } = {};
      Object.entries(newState).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = value as { colors: Color[], sizes: Size[] };
        } else {
          reindexed[keyNum] = value as { colors: Color[], sizes: Size[] };
        }
      });
      return reindexed;
    });
  };

  const calculateTotal = () => {
    return poForm.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const handleSubmit = () => {
    if (!poForm.supplierId || poForm.items.length === 0) {
      alert("Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm");
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label htmlFor="supplier">Nhà cung cấp *</Label>
          <Select
            value={poForm.supplierId}
            onValueChange={(value) => {
              setPOForm({ ...poForm, supplierId: value });
              loadProductsBySupplier(value);
            }}
          >
            <SelectTrigger
              className={clsx(isFieldInvalid('supplierId', poForm.supplierId) && 'border-red-500', 'focus:outline-none')}
              onBlur={() => setTouched(t => ({...t, supplierId: true}))}
            >
              <SelectValue placeholder="Chọn nhà cung cấp" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                const availableSuppliers = getAvailableSuppliers();
                return availableSuppliers && availableSuppliers.length > 0 ? (
                  availableSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    Không có nhà cung cấp nào
                  </div>
                );
              })()}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="deliveryDate">Ngày giao dự kiến</Label>
          <Input
            id="deliveryDate"
            type="date"
            className="w-full"
            value={poForm.expectedDeliveryDate ? poForm.expectedDeliveryDate.slice(0, 10) : ""}
            onChange={(e) =>
              setPOForm({ ...poForm, expectedDeliveryDate: e.target.value })
            }
          />
        </div>
      </div>
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
            {poForm.items.map((item, index) => {
              return (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Sản phẩm</Label>
                      <Select
                        key={`product-${index}`}
                        value={item.MaSP?.toString() || ""}
                        onValueChange={(value) => {
                          updatePOItem(index, "MaSP", value);
                        }}
                      >
                        <SelectTrigger
                          className={clsx('focus:outline-none', isFieldInvalid(`MaSP_${index}`, item.MaSP) && 'border-red-500')}
                          onBlur={() => setTouched(t => ({...t, [`MaSP_${index}`]: true}))}
                        >
                          <SelectValue placeholder="Chọn sản phẩm">
                            {filteredProducts.find(p => p.id == item.MaSP)?.name || products.find(p => p.id == item.MaSP)?.name || item.productName || "Chọn sản phẩm"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            if (loadingProducts) {
                              return (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  Đang tải sản phẩm...
                                </div>
                              );
                            }
                            if (poForm.supplierId) {
                              if (filteredProducts.length > 0) {
                                return filteredProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ));
                              } else {
                                return (
                                  <div className="px-2 py-1 text-sm text-muted-foreground">
                                    Nhà cung cấp này không có sản phẩm nào
                                  </div>
                                );
                              }
                            }
                            return products && products.length > 0 ? (
                              products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1 text-sm text-muted-foreground">
                                Không có sản phẩm nào
                              </div>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Chi tiết sản phẩm</Label>
                      <Select
                        key={`product-detail-${index}`}
                        value={item.MaCTSP ? item.MaCTSP.toString() : ""}
                        onValueChange={(value) =>
                          updatePOItem(index, "MaCTSP", parseInt(value) || "")
                        }
                        disabled={!item.MaSP}
                      >
                        <SelectTrigger
                          className={clsx('focus:outline-none', isFieldInvalid(`MaCTSP_${index}`, item.MaCTSP) && 'border-red-500')}
                          onBlur={() => setTouched(t => ({...t, [`MaCTSP_${index}`]: true}))}
                        >
                          <SelectValue placeholder={!item.MaSP ? "Chọn sản phẩm trước" : "Chọn màu và size"}>
                            {item.colorName && item.sizeName ? `${item.colorName} - ${item.sizeName}` : "Chọn màu và size"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const productDetails = itemProductDetails[index] || [];
                            const availableDetails = productDetails.filter(detail => 
                              !isProductDetailSelected(detail.MaCTSP, index)
                            );
                            return availableDetails.length > 0 ? (
                              availableDetails.map((detail) => (
                                <SelectItem key={detail.MaCTSP} value={detail.MaCTSP.toString()}>
                                  <div className="flex items-center gap-2">
                                    {detail.Mau.MaHex && (
                                      <div 
                                        className="w-4 h-4 rounded border border-gray-300"
                                        style={{ backgroundColor: detail.Mau.MaHex }}
                                      />
                                    )}
                                    {detail.Mau.TenMau} - {detail.KichThuoc.TenKichThuoc}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1 text-sm text-muted-foreground">
                                {productDetails.length > 0 ? "Tất cả chi tiết đã được chọn" : "Không có chi tiết sản phẩm"}
                              </div>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Số lượng</Label>
                      <Input
                        key={`quantity-${index}`}
                        type="number"
                        value={item.quantity || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updatePOItem(index, "quantity", 1);
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 1) {
                              updatePOItem(index, "quantity", numValue);
                            }
                          }
                        }}
                        min="1"
                        placeholder="Nhập số lượng"
                        className={clsx('focus:outline-none', isFieldInvalid(`quantity_${index}`, item.quantity) && 'border-red-500')}
                        onBlur={() => setTouched(t => ({...t, [`quantity_${index}`]: true}))}
                      />
                    </div>
                    <div>
                      <Label>Đơn giá</Label>
                      <Input
                        key={`price-${index}`}
                        type="number"
                        value={item.unitPrice === 0 ? "" : item.unitPrice || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updatePOItem(index, "unitPrice", 0);
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              updatePOItem(index, "unitPrice", numValue);
                            }
                          }
                        }}
                        min="0"
                        placeholder="Nhập đơn giá"
                        className={clsx('focus:outline-none', isFieldInvalid(`unitPrice_${index}`, item.unitPrice) && 'border-red-500')}
                        onBlur={() => setTouched(t => ({...t, [`unitPrice_${index}`]: true}))}
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
              );
            })}
            <div className="text-right">
              <div className="text-lg font-bold">
                Tổng cộng: {formatPrice(calculateTotal())}
              </div>
            </div>
          </div>
        )}
      </div>
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
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading 
            ? "Đang lưu..." 
            : "Lưu chỉnh sửa"
          }
        </Button>
      </div>
    </div>
  );
} 