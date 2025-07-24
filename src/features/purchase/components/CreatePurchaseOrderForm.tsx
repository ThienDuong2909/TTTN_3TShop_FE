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
import { POForm, Supplier, Product, PurchaseOrderItem, Color, Size } from "../types";
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
  // State for colors and sizes for each item
  const [itemColorsSizes, setItemColorsSizes] = useState<{ [key: number]: { colors: Color[], sizes: Size[] } }>({});
  
  // State for loading colors/sizes for each item
  const [loadingColorsSizes, setLoadingColorsSizes] = useState<{ [key: number]: boolean }>({});
  
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
    console.log("=== SUPPLIER ID CHANGED ===");
    console.log("New supplierId:", poForm.supplierId);
    
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
  
  // Check if a combination is already selected (excluding current index)
  const isCombinationSelected = (productId: string, colorId: number, sizeId: number, currentIndex: number) => {
    return poForm.items.some((item, index) => 
      index !== currentIndex && 
      item.MaSP === productId && 
      item.MaMau === colorId && 
      item.MaKichThuoc === sizeId
    );
  };
  
  // Get available suppliers based on selected products
  const getAvailableSuppliers = () => {
    const selectedProductIds = poForm.items.map(item => item.MaSP).filter(id => id);
    
    if (selectedProductIds.length === 0) {
      return suppliers; // Show all suppliers if no products selected
    }
    
    return suppliers.filter(() => {
      return true;
    });
  };
  
  // Load colors and sizes for a product
  const loadProductColorsSizes = async (index: number, productId: string) => {
    if (!productId || productId === "") {
      return;
    }
    
    // Set loading state
    setLoadingColorsSizes(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await getProductColorsSizes(productId);
      
      // Handle different API response formats
      let colors: Color[] = [];
      let sizes: Size[] = [];
      let dataArray: any[] = [];
      
      // Try different response formats
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && response.success && Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response && Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response && typeof response === 'object') {
        // Try to find array in common properties
        const responseObj = response as any;
        dataArray = responseObj.products || responseObj.items || responseObj.result || responseObj.data || [];
      }
      
      if (dataArray.length > 0) {
        // Extract unique colors from the data
        const uniqueColors = new Map<number, Color>();
        const uniqueSizes = new Map<number, Size>();
        
        dataArray.forEach((item: any, idx: number) => {
          
          // Extract color
          if (item.Mau) {
            uniqueColors.set(item.Mau.MaMau, {
              MaMau: item.Mau.MaMau,
              TenMau: item.Mau.TenMau,
              MaHex: item.Mau.MaHex ? `#${item.Mau.MaHex}` : undefined
            });
          }
          
          // Extract size
          if (item.KichThuoc) {
            uniqueSizes.set(item.KichThuoc.MaKichThuoc, {
              MaKichThuoc: item.KichThuoc.MaKichThuoc,
              TenKichThuoc: item.KichThuoc.TenKichThuoc
            });
          }
        });
        
        colors = Array.from(uniqueColors.values());
        sizes = Array.from(uniqueSizes.values());
        
      } else {
        // Fallback: try to get colors and sizes from product details if available
        const selectedProduct = products.find(p => p.id.toString() === productId.toString());
        if (selectedProduct) {
          // Try to extract colors and sizes from product details if available
          if ((selectedProduct as any).colors && Array.isArray((selectedProduct as any).colors)) {
            colors = (selectedProduct as any).colors.map((color: any, idx: number) => ({
              MaMau: idx + 1,
              TenMau: color,
              MaHex: color
            }));
          }
          if ((selectedProduct as any).sizes && Array.isArray((selectedProduct as any).sizes)) {
            sizes = (selectedProduct as any).sizes.map((size: any, idx: number) => ({
              MaKichThuoc: idx + 1,
              TenKichThuoc: size
            }));
          }
        }
      }
      
      setItemColorsSizes(prev => ({
        ...prev,
        [index]: { colors, sizes }
      }));
      
    } catch (error) {
      console.error(`Error loading colors/sizes for product ${productId}:`, error);
      // Set empty arrays on error
      setItemColorsSizes(prev => ({
        ...prev,
        [index]: { colors: [], sizes: [] }
      }));
    } finally {
      // Clear loading state
      setLoadingColorsSizes(prev => ({ ...prev, [index]: false }));
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
          MaMau: "",
          MaKichThuoc: "",
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
        // Reset color and size when product changes
        newItems[index].MaMau = "";
        newItems[index].MaKichThuoc = "";
        // Clear existing colors/sizes for this index first
        setItemColorsSizes(prev => ({
          ...prev,
          [index]: { colors: [], sizes: [] }
        }));
        // Clear loading state for this index
        setLoadingColorsSizes(prev => ({
          ...prev,
          [index]: false
        }));
        // Load colors and sizes for the new product immediately
        loadProductColorsSizes(index, value);
      } else {
        // Clear colors/sizes if no product selected
        setItemColorsSizes(prev => ({
          ...prev,
          [index]: { colors: [], sizes: [] }
        }));
        // Clear loading state
        setLoadingColorsSizes(prev => ({
          ...prev,
          [index]: false
        }));
      }
    }

    // Check if the selected combination is already used
    if (field === "MaMau" || field === "MaKichThuoc") {
      const currentItem = newItems[index];
      if (currentItem.MaSP && currentItem.MaMau && currentItem.MaKichThuoc) {
        const isAlreadySelected = isCombinationSelected(
          currentItem.MaSP.toString(), 
          currentItem.MaMau, 
          currentItem.MaKichThuoc, 
          index
        );
        
        if (isAlreadySelected) {
          // Clear the field that was just changed to avoid duplicate
          newItems[index][field] = "";
        }
      }
    }

    setPOForm({ ...poForm, items: newItems });
  };

  const removePOItem = (index: number) => {
    setPOForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index),
    });
    
    // Clean up colors/sizes state
    setItemColorsSizes(prev => {
      const newState = { ...prev };
      delete newState[index];
      // Re-index remaining items
      const reindexed: { [key: number]: { colors: Color[], sizes: Size[] } } = {};
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
    setLoadingColorsSizes(prev => {
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
      {/* Loading Overlay */}
      {/* Removed isLoadingPODetails */}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <Label htmlFor="supplier">Nhà cung cấp *</Label>
          <Select
            key={`supplier-${poForm.supplierId || 'empty'}`}
            value={poForm.supplierId}
            onValueChange={(value) => {
              setPOForm({ ...poForm, supplierId: value });
              if (value) {
                loadProducts(value);
              }
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
            {poForm.items.map((item, index) => {
              return (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Sản phẩm</Label>
                      <Select
                        key={`product-${index}-${item.MaSP || 'empty'}`}
                        value={item.MaSP?.toString() || ""}
                        onValueChange={(value) => {
                          updatePOItem(index, "MaSP", value);
                        }}
                      >
                        <SelectTrigger
                          className={clsx('focus:outline-none', isFieldInvalid(`MaSP_${index}`, item.MaSP) && 'border-red-500')}
                          onBlur={() => setTouched(t => ({...t, [`MaSP_${index}`]: true}))}
                        >
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            // If supplier is selected, show filtered products + currently selected product
                            if (poForm.supplierId) {
                              const selectedProduct = products.find(p => p.id.toString() === item.MaSP?.toString());
                              const productsToShow = [...filteredProducts];
                              
                              // Add currently selected product if it's not in filtered products
                              if (selectedProduct && !filteredProducts.find(p => p.id === selectedProduct.id)) {
                                productsToShow.push(selectedProduct);
                              }
                              
                              if (productsToShow.length > 0) {
                                return productsToShow.map((product: any) => (
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
                          
                          // If no supplier selected, show all products
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
                      <Label>Màu sắc</Label>
                      <Select
                        key={`color-${index}`}
                        value={item.MaMau ? item.MaMau.toString() : ""}
                        onValueChange={(value) =>
                          updatePOItem(index, "MaMau", parseInt(value) || "")
                        }
                      >
                        <SelectTrigger
                          className={clsx('focus:outline-none', isFieldInvalid(`MaMau_${index}`, item.MaMau) && 'border-red-500')}
                          onBlur={() => setTouched(t => ({...t, [`MaMau_${index}`]: true}))}
                        >
                          <SelectValue placeholder="Chọn màu" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const colorsData = itemColorsSizes[index]?.colors || [];
                            
                            if (colorsData.length > 0) {
                              const availableColors = colorsData.filter(color => {
                                // If size is selected, check if this specific color+size combination is already used
                                if (item.MaKichThuoc) {
                                  return !isCombinationSelected(item.MaSP.toString(), color.MaMau, item.MaKichThuoc, index);
                                }
                                // If no size selected yet, check if this color has at least one available size
                                const sizes = itemColorsSizes[index]?.sizes || [];
                                return sizes.some(size => 
                                  !isCombinationSelected(item.MaSP.toString(), color.MaMau, size.MaKichThuoc, index)
                                );
                              });
                              
                              return availableColors.length > 0 ? (
                                availableColors.map((color) => (
                                  <SelectItem key={color.MaMau} value={color.MaMau.toString()}>
                                    <div className="flex items-center gap-2">
                                      {color.MaHex && (
                                        <div 
                                          className="w-4 h-4 rounded border border-gray-300"
                                          style={{ backgroundColor: color.MaHex }}
                                        />
                                      )}
                                      {color.TenMau}
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  Tất cả màu đã được chọn
                                </div>
                              );
                            } else {
                              return (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  {item.MaSP ? 
                                    (loadingColorsSizes[index] ? "Đang tải màu sắc..." : "Không có màu nào") 
                                    : "Chọn sản phẩm trước"}
                                </div>
                              );
                            }
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Kích thước</Label>
                      <Select
                        key={`size-${index}`}
                        value={item.MaKichThuoc ? item.MaKichThuoc.toString() : ""}
                        onValueChange={(value) =>
                          updatePOItem(index, "MaKichThuoc", parseInt(value) || "")
                        }
                      >
                        <SelectTrigger
                          className={clsx('focus:outline-none', isFieldInvalid(`MaKichThuoc_${index}`, item.MaKichThuoc) && 'border-red-500')}
                          onBlur={() => setTouched(t => ({...t, [`MaKichThuoc_${index}`]: true}))}
                        >
                          <SelectValue placeholder="Chọn kích thước" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const sizesData = itemColorsSizes[index]?.sizes || [];
                            
                            if (sizesData.length > 0) {
                              const availableSizes = sizesData.filter(size => {
                                // If color is selected, check if this specific color+size combination is already used
                                if (item.MaMau) {
                                  return !isCombinationSelected(item.MaSP.toString(), item.MaMau, size.MaKichThuoc, index);
                                }
                                // If no color selected yet, check if this size has at least one available color
                                const colors = itemColorsSizes[index]?.colors || [];
                                return colors.some(color => 
                                  !isCombinationSelected(item.MaSP.toString(), color.MaMau, size.MaKichThuoc, index)
                                );
                              });
                              
                              return availableSizes.length > 0 ? (
                                availableSizes.map((size) => (
                                  <SelectItem key={size.MaKichThuoc} value={size.MaKichThuoc.toString()}>
                                    {size.TenKichThuoc}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  Tất cả kích thước đã được chọn
                                </div>
                              );
                            } else {
                              return (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  {item.MaSP ? 
                                    (loadingColorsSizes[index] ? "Đang tải kích thước..." : "Không có kích thước nào") 
                                    : "Chọn sản phẩm trước"}
                                </div>
                              );
                            }
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
                          // Allow empty string while typing
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
                          // Allow empty string while typing
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
            : "Tạo phiếu đặt hàng"
          }
        </Button>
      </div>
    </div>
  );
} 