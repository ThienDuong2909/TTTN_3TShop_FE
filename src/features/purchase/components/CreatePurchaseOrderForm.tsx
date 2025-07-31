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
import { getProductColorsSizes } from "../../../services/commonService";
import { POForm, Supplier, Product, PurchaseOrderItem, ProductDetail } from "../types";
import { useState, useEffect } from "react";
import clsx from "clsx";

interface CreatePurchaseOrderFormProps {
  poForm: POForm;
  setPOForm: (form: POForm) => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  loadProducts: (supplierId: string) => void;
}

export default function CreatePurchaseOrderForm({
  poForm,
  setPOForm,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isLoading = false,
  loadProducts,
}: CreatePurchaseOrderFormProps) {
  // State for product details for each item
  const [itemProductDetails, setItemProductDetails] = useState<{ [key: number]: ProductDetail[] }>({});
  
  // State for loading product details for each item
  const [loadingProductDetails, setLoadingProductDetails] = useState<{ [key: number]: boolean }>({});
  
  // State for filtered products (filtered from all products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Validate form
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const isFieldInvalid = (field: string, value: any) => {
    if (!touched[field]) return false;
    if (typeof value === 'string') return !value.trim();
    if (typeof value === 'number') return value === 0;
    return !value;
  };
  
  // Filter products by supplier when supplier changes
  useEffect(() => {
    if (poForm.supplierId) {
      const supplierProducts = products.filter((product: any) => {
        const productSupplierId = product.MaNCC?.toString();
        const selectedSupplierId = poForm.supplierId.toString();
        return productSupplierId === selectedSupplierId;
      });
      
      // Add currently selected products to filtered list to prevent reset
      const selectedProducts = poForm.items
        .map(item => item.MaSP)
        .filter(id => id)
        .map(id => products.find(p => p.id.toString() === id.toString()))
        .filter(Boolean);
      
      const allProductsToShow = [...supplierProducts];
      
      // Add selected products that are not already in the filtered list
      selectedProducts.forEach(selectedProduct => {
        if (selectedProduct && !allProductsToShow.find(p => p.id === selectedProduct.id)) {
          allProductsToShow.push(selectedProduct);
        }
      });
      
      setFilteredProducts(allProductsToShow);
    } else {
      setFilteredProducts([]);
    }
  }, [poForm.supplierId, products, poForm.items]);
  
  // Check if a product detail is already selected (excluding current index)
  const isProductDetailSelected = (productDetailId: number, currentIndex: number) => {
    return poForm.items.some((item, index) => 
      index !== currentIndex && 
      item.MaCTSP === productDetailId
    );
  };

  const getAvailableSuppliers = () => {
    const filteredSuppliers = suppliers.filter((supplier: any) => {
      return true;
    });
    return filteredSuppliers;
  };

  // Load product details (colors and sizes) for a product
  const loadProductDetails = async (index: number, productId: string) => {
    if (!productId || productId === "") {
      return;
    }
    
    // Set loading state
    setLoadingProductDetails(prev => ({ ...prev, [index]: true }));
    
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
    } finally {
      // Clear loading state
      setLoadingProductDetails(prev => ({ ...prev, [index]: false }));
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

    // Auto-fill product name and price when product is selected
    if (field === "MaSP") {
      // Always search in all products first to ensure we can find the product
      const product = products.find((p: any) => p.id.toString() === value.toString());
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = Math.floor(product.price * 0.6); // Wholesale price
        // Reset product detail when product changes
        newItems[index].MaCTSP = "";
        newItems[index].colorName = "";
        newItems[index].sizeName = "";
        // Clear existing product details for this index first
        setItemProductDetails(prev => ({
          ...prev,
          [index]: []
        }));
        // Clear loading state for this index
        setLoadingProductDetails(prev => ({
          ...prev,
          [index]: false
        }));
        // Load product details for the new product immediately
        loadProductDetails(index, value);
      } else {
        // Clear product details if no product selected
        setItemProductDetails(prev => ({
          ...prev,
          [index]: []
        }));
        // Clear loading state
        setLoadingProductDetails(prev => ({
          ...prev,
          [index]: false
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
    
    // Clean up product details state
    setItemProductDetails(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Re-index remaining items
      const reindexed: { [key: number]: ProductDetail[] } = {};
      Object.entries(newState).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = value;
        } else {
          reindexed[keyNum] = value;
        }
      });
      return reindexed;
    });
    
    // Clean up loading state
    setLoadingProductDetails(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Re-index remaining items
      const reindexed: { [key: number]: boolean } = {};
      Object.entries(newState).forEach(([key, value]) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = value;
        } else {
          reindexed[keyNum] = value;
        }
      });
      return reindexed;
    });
  };

  const calculateTotal = () => {
    return poForm.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
              loadProducts(value);
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
            ? "Đang tạo..." 
            : "Tạo đơn đặt hàng"
          }
        </Button>
      </div>
    </div>
  );
} 