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
import { POForm, Supplier, Product, PurchaseOrderItem, Color, Size } from "../types";
import { useState, useEffect } from "react";

interface CreatePurchaseOrderFormProps {
  poForm: POForm;
  setPOForm: (form: POForm) => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  editingPO?: any;
  isLoadingPODetails?: boolean;
}

export default function CreatePurchaseOrderForm({
  poForm,
  setPOForm,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditMode = false,
  editingPO,
  isLoadingPODetails = false,
}: CreatePurchaseOrderFormProps) {
  // State for colors and sizes for each item
  const [itemColorsSizes, setItemColorsSizes] = useState<{ [key: number]: { colors: Color[], sizes: Size[] } }>({});
  
  // State for filtered products (when supplier is selected first)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Debug log for suppliers
  console.log("CreatePurchaseOrderForm - suppliers:", suppliers);
  console.log("CreatePurchaseOrderForm - poForm:", poForm);
  console.log("CreatePurchaseOrderForm - filteredProducts:", filteredProducts);
  console.log("CreatePurchaseOrderForm - loadingProducts:", loadingProducts);
  
  // Reset filtered products when supplier is cleared
  useEffect(() => {
    if (!poForm.supplierId) {
      setFilteredProducts([]);
    }
  }, [poForm.supplierId]);
  
  // Get selected product-color-size combinations
  const getSelectedCombinations = () => {
    return poForm.items
      .filter(item => item.MaSP && item.MaMau && item.MaKichThuoc)
      .map(item => `${item.MaSP}-${item.MaMau}-${item.MaKichThuoc}`);
  };
  
  // Check if a combination is already selected (excluding current index)
  const isCombinationSelected = (productId: string, colorId: number, sizeId: number, currentIndex: number) => {
    const combination = `${productId}-${colorId}-${sizeId}`;
    return poForm.items.some((item, index) => 
      index !== currentIndex && 
      item.MaSP === productId && 
      item.MaMau === colorId && 
      item.MaKichThuoc === sizeId
    );
  };
  
  // Load products by supplier
  const loadProductsBySupplier = async (supplierId: string) => {
    if (!supplierId) {
      setFilteredProducts([]);
      return;
    }
    
    setLoadingProducts(true);
    try {
      console.log("Loading products for supplier:", supplierId);
      const response = await getProductsBySupplier(supplierId);
      console.log("Products by supplier response:", response);
      
      // Handle different response formats
      let productData: any[] = [];
      if (Array.isArray(response)) {
        productData = response;
      } else if (response && Array.isArray((response as any).data)) {
        productData = (response as any).data;
      } else if (response && typeof response === 'object') {
        const responseObj = response as any;
        productData = responseObj.products || responseObj.items || responseObj.result || [];
      }
      
      console.log("Product data length:", productData.length);
      
      // Transform products to match our interface
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
      
      console.log("Transformed products:", transformedProducts);
      console.log("Setting filtered products to:", transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (error) {
      console.error("Error loading products by supplier:", error);
      setFilteredProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Get available suppliers based on selected products
  const getAvailableSuppliers = () => {
    const selectedProductIds = poForm.items.map(item => item.MaSP).filter(id => id);
    
    if (selectedProductIds.length === 0) {
      return suppliers; // Show all suppliers if no products selected
    }
    
    // Filter suppliers that have all selected products
    // This is a simplified approach - in reality, you might need to query the backend
    return suppliers.filter(supplier => {
      // For now, we'll show all suppliers
      // In a real app, you'd check if the supplier has the selected products
      return true;
    });
  };
  
  // Auto-fill supplier for product (Flow 2)
  const autoFillSupplierForProduct = async (productId: string) => {
    try {
      console.log("Auto-filling supplier for product:", productId);
      
      // Try to find supplier from product data (if available)
      const selectedProduct = products.find(p => p.id.toString() === productId.toString());
      console.log("Selected product for supplier lookup:", selectedProduct);
      
             // If product has supplier info, use it
       if (selectedProduct && (selectedProduct as any).supplierId) {
         const supplierId = (selectedProduct as any).supplierId;
         console.log("Found supplier ID from product:", supplierId);
         const newSupplierId = supplierId.toString();
         setPOForm({ ...poForm, supplierId: newSupplierId });
         // Load products for this supplier
         loadProductsBySupplier(newSupplierId);
         return;
       }
      
      // Fallback: Find supplier by checking which supplier has this product
      // Try each supplier until we find one that has this product
      for (const supplier of suppliers) {
        try {
          const response = await getProductsBySupplier(supplier.id.toString());
          let supplierProducts: any[] = [];
          
          if (Array.isArray(response)) {
            supplierProducts = response;
          } else if (response && Array.isArray((response as any).data)) {
            supplierProducts = (response as any).data;
          }
          
          // Check if this supplier has the selected product
          const hasProduct = supplierProducts.some(p => 
            (p.MaSP || p.id)?.toString() === productId.toString()
          );
          
          if (hasProduct) {
            console.log("Found supplier with this product:", supplier);
            const newSupplierId = supplier.id.toString();
            setPOForm({ ...poForm, supplierId: newSupplierId });
            // Load all products for this supplier
            loadProductsBySupplier(newSupplierId);
            return;
          }
        } catch (error) {
          console.error("Error checking supplier products:", error);
        }
      }
      
      console.log("No supplier found for product:", productId);
    } catch (error) {
      console.error("Error auto-filling supplier:", error);
    }
  };
  
  // Load colors and sizes for a product
  const loadProductColorsSizes = async (index: number, productId: string) => {
    console.log(`loadProductColorsSizes called with index: ${index}, productId: ${productId}`);
    if (!productId || productId === "") {
      console.log("No productId provided, skipping API call");
      return;
    }
    
    try {
      console.log(`Loading colors/sizes for product ${productId} at index ${index}`);
      console.log("getProductColorsSizes function:", getProductColorsSizes);
      
      const response = await getProductColorsSizes(productId);
      console.log("Colors/sizes response:", response);
      
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
      
      console.log("Data array:", dataArray);
      
      if (dataArray.length > 0) {
        // Extract unique colors from the data
        const uniqueColors = new Map<number, Color>();
        const uniqueSizes = new Map<number, Size>();
        
        dataArray.forEach((item: any) => {
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
        
        console.log("Extracted colors:", colors);
        console.log("Extracted sizes:", sizes);
      }
      
      setItemColorsSizes(prev => ({
        ...prev,
        [index]: { colors, sizes }
      }));
      
      console.log(`Loaded ${colors.length} colors and ${sizes.length} sizes for index ${index}`);
    } catch (error) {
      console.error(`Error loading colors/sizes for product ${productId}:`, error);
      // Set empty arrays on error
      setItemColorsSizes(prev => ({
        ...prev,
        [index]: { colors: [], sizes: [] }
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
    console.log(`updatePOItem: index=${index}, field=${field}, value=${value}`);
    
    const newItems = [...poForm.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill product name and price when product is selected
    if (field === "MaSP") {
      console.log("Product selection - value:", value, "type:", typeof value);
      console.log("Available products:", products);
      console.log("Available filteredProducts:", filteredProducts);
      
      // Find product from either filtered or all products
      const allProducts = filteredProducts.length > 0 ? filteredProducts : products;
      const product = allProducts.find((p) => p.id.toString() === value.toString());
      console.log("Found product:", product);
      
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
        
        // Load colors and sizes for the new product immediately
        console.log("About to call loadProductColorsSizes with:", index, value);
        loadProductColorsSizes(index, value);
        
        // Flow 2: Auto-fill supplier if not selected and product is from all products list
        if (!poForm.supplierId && filteredProducts.length === 0) {
          console.log("Flow 2: Auto-filling supplier for product");
          // Get supplier from product data or find supplier who has this product
          autoFillSupplierForProduct(value);
        }
      } else {
        console.log("No product found, clearing colors/sizes");
        // Clear colors/sizes if no product selected
        setItemColorsSizes(prev => ({
          ...prev,
          [index]: { colors: [], sizes: [] }
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
          console.log(`Combination already selected, clearing ${field}`);
        }
      }
    }

    console.log("Updated items:", newItems);
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
  };

  const calculateTotal = () => {
    return poForm.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  const handleSubmit = () => {
    console.log("Form submit - poForm:", poForm);
    console.log("Form submit - supplierId:", poForm.supplierId, "type:", typeof poForm.supplierId);
    console.log("Form submit - suppliers:", suppliers);
    
    if (!poForm.supplierId || poForm.items.length === 0) {
      alert("Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm");
      return;
    }
    onSubmit();
  };

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {isLoadingPODetails && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            <span className="text-sm font-medium">Đang tải thông tin phiếu đặt hàng...</span>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="supplier">Nhà cung cấp *</Label>
          </div>
          <Select
            value={poForm.supplierId}
            onValueChange={(value) => {
              console.log("Supplier selected:", value, "type:", typeof value);
              setPOForm({ ...poForm, supplierId: value });
              // Load products for this supplier
              loadProductsBySupplier(value);
            }}
          >
            <SelectTrigger>
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
              console.log(`Rendering item ${index}:`, item);
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
                          console.log(`Product selected: ${value} for index ${index}`);
                          updatePOItem(index, "MaSP", value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            console.log("Supplier selected:", poForm.supplierId);
                            console.log("Filtered products:", filteredProducts);
                            console.log("All products:", products);
                            
                            if (loadingProducts) {
                              return (
                                <div className="px-2 py-1 text-sm text-muted-foreground">
                                  Đang tải sản phẩm...
                                </div>
                              );
                            }
                            
                            // If supplier is selected, only show filtered products
                            if (poForm.supplierId) {
                              console.log("Supplier selected, showing filtered products");
                              console.log("FilteredProducts length:", filteredProducts.length);
                              console.log("FilteredProducts array:", filteredProducts);
                              
                              if (filteredProducts.length > 0) {
                                console.log("Showing filtered products");
                                return filteredProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name}
                                  </SelectItem>
                                ));
                              } else {
                                console.log("No filtered products, showing empty message");
                                return (
                                  <div className="px-2 py-1 text-sm text-muted-foreground">
                                    Nhà cung cấp này không có sản phẩm nào
                                  </div>
                                );
                              }
                            }
                            
                            // If no supplier selected, show all products
                            console.log("No supplier selected, showing all products");
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
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn màu" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const colorsData = itemColorsSizes[index]?.colors || [];
                            console.log(`Colors for index ${index}:`, colorsData);
                            
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
                              
                              console.log(`Available colors for index ${index}:`, availableColors);
                              
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
                                  {item.MaSP ? "Không có màu nào" : "Chọn sản phẩm trước"}
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
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kích thước" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const sizesData = itemColorsSizes[index]?.sizes || [];
                            console.log(`Sizes for index ${index}:`, sizesData);
                            
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
                              
                              console.log(`Available sizes for index ${index}:`, availableSizes);
                              
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
                                  {item.MaSP ? "Không có kích thước nào" : "Chọn sản phẩm trước"}
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
            ? (isEditMode ? "Đang cập nhật..." : "Đang tạo...") 
            : (isEditMode ? "Cập nhật phiếu đặt hàng" : "Tạo phiếu đặt hàng")
          }
        </Button>
      </div>
    </div>
  );
} 