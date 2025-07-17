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
import { useState } from "react";

interface CreatePurchaseOrderFormProps {
  poForm: POForm;
  setPOForm: (form: POForm) => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CreatePurchaseOrderForm({
  poForm,
  setPOForm,
  suppliers,
  products,
  onSubmit,
  onCancel,
  isLoading = false,
}: CreatePurchaseOrderFormProps) {
  // State for colors and sizes for each item
  const [itemColorsSizes, setItemColorsSizes] = useState<{ [key: number]: { colors: Color[], sizes: Size[] } }>({});
  
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
  
  // Load colors and sizes for a product
  const loadProductColorsSizes = async (index: number, productId: string) => {
    if (!productId) return;
    
    try {
      console.log(`Loading colors/sizes for product ${productId} at index ${index}`);
      const response = await getProductColorsSizes(productId);
      console.log("Colors/sizes response:", response);
      
      // Handle the actual API response format
      let colors: Color[] = [];
      let sizes: Size[] = [];
      
      if (response && response.success && response.data) {
        const data = response.data;
        console.log("Raw data:", data);
        
        // Extract unique colors from the data
        const uniqueColors = new Map<number, Color>();
        const uniqueSizes = new Map<number, Size>();
        
        data.forEach((item: any) => {
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
      const product = products.find((p) => p.id === value);
      console.log("Found product:", product);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = Math.floor(product.price * 0.6); // Wholesale price
        // Reset color and size when product changes
        newItems[index].MaMau = "";
        newItems[index].MaKichThuoc = "";
        // Load colors and sizes for the new product
        loadProductColorsSizes(index, value);
      }
    }

    // Check if the selected combination is already used
    if (field === "MaMau" || field === "MaKichThuoc") {
      const currentItem = newItems[index];
      if (currentItem.MaSP && currentItem.MaMau && currentItem.MaKichThuoc) {
        const isAlreadySelected = isCombinationSelected(
          currentItem.MaSP, 
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
    if (!poForm.supplierId || poForm.items.length === 0) {
      alert("Vui lòng chọn nhà cung cấp và thêm ít nhất một sản phẩm");
      return;
    }
    onSubmit();
  };

  return (
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
              {suppliers && suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  Không có nhà cung cấp nào
                </div>
              )}
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
                        key={`product-${index}-${getSelectedCombinations().join('-')}`}
                        value={item.MaSP || ""}
                        onValueChange={(value) => {
                          console.log(`Product selected: ${value} for index ${index}`);
                          updatePOItem(index, "MaSP", value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sản phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                          {products && products.length > 0 ? (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Không có sản phẩm nào
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Màu sắc</Label>
                      <Select
                        key={`color-${index}-${getSelectedCombinations().join('-')}`}
                        value={item.MaMau ? item.MaMau.toString() : ""}
                        onValueChange={(value) =>
                          updatePOItem(index, "MaMau", parseInt(value) || "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn màu" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemColorsSizes[index]?.colors?.length > 0 ? (
                            (() => {
                              const availableColors = itemColorsSizes[index].colors.filter(color => {
                                // If size is selected, check if this specific color+size combination is already used
                                if (item.MaKichThuoc) {
                                  return !isCombinationSelected(item.MaSP, color.MaMau, item.MaKichThuoc, index);
                                }
                                // If no size selected yet, check if this color has at least one available size
                                const sizes = itemColorsSizes[index]?.sizes || [];
                                return sizes.some(size => 
                                  !isCombinationSelected(item.MaSP, color.MaMau, size.MaKichThuoc, index)
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
                            })()
                          ) : (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              {item.MaSP ? "Không có màu nào" : "Chọn sản phẩm trước"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Kích thước</Label>
                      <Select
                        key={`size-${index}-${getSelectedCombinations().join('-')}`}
                        value={item.MaKichThuoc ? item.MaKichThuoc.toString() : ""}
                        onValueChange={(value) =>
                          updatePOItem(index, "MaKichThuoc", parseInt(value) || "")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn kích thước" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemColorsSizes[index]?.sizes?.length > 0 ? (
                            (() => {
                              const availableSizes = itemColorsSizes[index].sizes.filter(size => {
                                // If color is selected, check if this specific color+size combination is already used
                                if (item.MaMau) {
                                  return !isCombinationSelected(item.MaSP, item.MaMau, size.MaKichThuoc, index);
                                }
                                // If no color selected yet, check if this size has at least one available color
                                const colors = itemColorsSizes[index]?.colors || [];
                                return colors.some(color => 
                                  !isCombinationSelected(item.MaSP, color.MaMau, size.MaKichThuoc, index)
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
                            })()
                          ) : (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              {item.MaSP ? "Không có kích thước nào" : "Chọn sản phẩm trước"}
                            </div>
                          )}
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
          {isLoading ? "Đang tạo..." : "Tạo phiếu đặt hàng"}
        </Button>
      </div>
    </div>
  );
} 