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
import { toast } from "sonner";


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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const isFieldInvalid = (field: string, value: any) => {
    if (!touched[field]) return false;
    return !!errors[field];
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'supplierId':
        return (!value || value.trim() === "") ? "Vui lòng chọn nhà cung cấp" : "";
      case 'expectedDeliveryDate':
        if (!value || value.trim() === "") {
          return "Vui lòng nhập ngày giao dự kiến";
        }
        const deliveryDate = new Date(value);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        if (deliveryDate <= currentDate) {
          return "Ngày giao dự kiến phải lớn hơn ngày hiện tại";
        }
        return "";
      default:
        return "";
    }
  };

  const validateItemField = (index: number, field: string, value: any): string => {
    switch (field) {
      case 'MaSP':
        return (!value || value.toString().trim() === "") ? "Vui lòng chọn sản phẩm" : "";
      case 'colorId':
        return (!value || value === undefined) ? "Vui lòng chọn màu sắc" : "";
      case 'sizeId':
        return (!value || value === undefined) ? "Vui lòng chọn kích thước" : "";
      case 'quantity':
        if (!value || value === "" || value <= 0) {
          return "Vui lòng nhập số lượng hợp lệ (lớn hơn 0)";
        }
        return "";
      case 'unitPrice':
        if (!value || value === "" || value <= 0) {
          return "Vui lòng nhập đơn giá hợp lệ (lớn hơn 0)";
        }
        // Kiểm tra nếu là chuỗi, chuyển thành số để validate
        if (typeof value === 'string') {
          const cleanValue = value.replace(/\./g, '');
          const numValue = parseInt(cleanValue);
          if (isNaN(numValue) || numValue <= 0) {
            return "Vui lòng nhập đơn giá hợp lệ (lớn hơn 0)";
          }
        }
        return "";
      default:
        return "";
    }
  };

  const validateDuplicateItems = (): string[] => {
    const duplicateErrors: string[] = [];
    poForm.items.forEach((item, index) => {
      const duplicateItem = poForm.items.find((otherItem, otherIndex) => 
        otherIndex !== index && 
        otherItem.MaSP === item.MaSP && 
        otherItem.colorId === item.colorId && 
        otherItem.sizeId === item.sizeId
      );
      
      if (duplicateItem) {
        duplicateErrors.push(`Sản phẩm ${index + 1}: Sản phẩm này với màu và kích thước đã được chọn trước đó`);
      }
    });
    return duplicateErrors;
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

   // Load product details for existing items when component mounts or products change
   useEffect(() => {
     poForm.items.forEach((item, index) => {
       if (item.MaSP && !itemProductDetails[index]) {
         loadProductDetails(index, item.MaSP.toString());
       }
     });
   }, [products, poForm.items]);
  
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
     
     console.log("DEBUG - Loading product details for:", { index, productId });
     
     // Set loading state
      setLoadingProductDetails(prev => ({ ...prev, [index]: true }));
      
      try {
        const response = await getProductColorsSizes(productId);
        
        console.log("DEBUG - Product details API response:", response);
        
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
       
       console.log("DEBUG - Processed product details:", productDetails);
       
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
          colorId: undefined,
          colorName: "",
          sizeId: undefined,
          sizeName: "",
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
         newItems[index].colorId = undefined;
         newItems[index].colorName = "";
         newItems[index].sizeId = undefined;
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
         newItems[index].MaCTSP = "";
         newItems[index].colorId = undefined;
         newItems[index].colorName = "";
         newItems[index].sizeId = undefined;
         newItems[index].sizeName = "";
         
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
         newItems[index].colorId = selectedDetail.Mau.MaMau;
         newItems[index].colorName = selectedDetail.Mau.TenMau;
         newItems[index].sizeId = selectedDetail.KichThuoc.MaKichThuoc;
         newItems[index].sizeName = selectedDetail.KichThuoc.TenKichThuoc;
       }
     }

     // Check if the selected product detail is already used
     if (field === "MaCTSP") {
       const isAlreadySelected = isProductDetailSelected(value, index);
       if (isAlreadySelected) {
         // Clear the field to avoid duplicate
         newItems[index][field] = "";
         newItems[index].colorId = undefined;
         newItems[index].colorName = "";
         newItems[index].sizeId = undefined;
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
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

    const handleSubmit = () => {
    // Debug: Log the current form state
    console.log("DEBUG - Form submission - poForm.items:", poForm.items);
    console.log("DEBUG - Each item's colorId and sizeId:", poForm.items.map(item => ({
      MaSP: item.MaSP,
      colorId: item.colorId,
      colorName: item.colorName,
      sizeId: item.sizeId,
      sizeName: item.sizeName
    })));
    
    // Mark all fields as touched to show validation errors
    setTouched({
      supplierId: true,
      expectedDeliveryDate: true,
      ...poForm.items.reduce((acc, _, index) => ({
        ...acc,
        [`MaSP_${index}`]: true,
        [`colorId_${index}`]: true,
        [`sizeId_${index}`]: true,
        [`quantity_${index}`]: true,
        [`unitPrice_${index}`]: true,
      }), {})
    });

    // Check if no products selected - this should show toast
    if (poForm.items.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    // Validate form fields and update errors state
    const newErrors: {[key: string]: string} = {};
    const newErrorsItems: {[key: string]: string} = {};

    // Validate supplier
    newErrors.supplierId = validateField('supplierId', poForm.supplierId);

    // Validate delivery date
    newErrors.expectedDeliveryDate = validateField('expectedDeliveryDate', poForm.expectedDeliveryDate);

    // Validate items
    poForm.items.forEach((item, index) => {
      newErrorsItems[`MaSP_${index}`] = validateItemField(index, 'MaSP', item.MaSP);
      newErrorsItems[`colorId_${index}`] = validateItemField(index, 'colorId', item.colorId);
      newErrorsItems[`sizeId_${index}`] = validateItemField(index, 'sizeId', item.sizeId);
      newErrorsItems[`quantity_${index}`] = validateItemField(index, 'quantity', item.quantity);
      newErrorsItems[`unitPrice_${index}`] = validateItemField(index, 'unitPrice', item.unitPrice);

      // Check for duplicate product details (same product, color, size)
      const duplicateItem = poForm.items.find((otherItem, otherIndex) => 
        otherIndex !== index && 
        otherItem.MaSP === item.MaSP && 
        otherItem.colorId === item.colorId && 
        otherItem.sizeId === item.sizeId
      );
      
      if (duplicateItem) {
        newErrorsItems[`duplicate_${index}`] = `Sản phẩm ${index + 1}: Sản phẩm này với màu và kích thước đã được chọn trước đó`;
      }
    });

    // Update errors state
    setErrors({ ...newErrors, ...newErrorsItems });

    // Check if there are any validation errors
    const allErrors = Object.values(newErrors).filter(Boolean);
    const allErrorsItems = Object.values(newErrorsItems).filter(Boolean);

    if (allErrors.length > 0 || allErrorsItems.length > 0) {
      // Don't submit if there are validation errors - they will be shown as red borders
      return;
    }

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
          {isFieldInvalid('supplierId', poForm.supplierId) && (
            <p className="text-sm text-red-500 mt-1">{errors.supplierId}</p>
          )}
        </div>
        <div>
          <Label htmlFor="deliveryDate">Ngày giao dự kiến</Label>
          <Input
            id="deliveryDate"
            type="date"
            className={clsx("w-full", isFieldInvalid('expectedDeliveryDate', poForm.expectedDeliveryDate) && 'border-red-500')}
            value={poForm.expectedDeliveryDate || ""}
            onChange={(e) => {
              setPOForm({ ...poForm, expectedDeliveryDate: e.target.value });
            }}
            onBlur={() => setTouched(t => ({...t, expectedDeliveryDate: true}))}
          />
          {isFieldInvalid('expectedDeliveryDate', poForm.expectedDeliveryDate) && (
            <p className="text-sm text-red-500 mt-1">{errors.expectedDeliveryDate}</p>
          )}
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
                                         <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
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
                      {isFieldInvalid(`MaSP_${index}`, item.MaSP) && (
                        <p className="text-sm text-red-500 mt-1">{errors[`MaSP_${index}`]}</p>
                      )}
                    </div>
                                         <div>
                       <Label>Màu sắc</Label>
                       <Select
                         key={`color-${index}`}
                         value={item.colorId ? item.colorId.toString() : ""}
                                                   onValueChange={(value) => {
                            const colorId = parseInt(value);
                            const productDetails = itemProductDetails[index] || [];
                            const selectedColor = productDetails.find(detail => detail.Mau.MaMau === colorId);
                            
                            console.log("DEBUG - Color selected:", { colorId, selectedColor });
                            
                            if (selectedColor) {
                              // Update the item directly without using updatePOItem to avoid conflicts
                              const newItems = [...poForm.items];
                              newItems[index] = {
                                ...newItems[index],
                                colorId: colorId,
                                colorName: selectedColor.Mau.TenMau,
                                sizeId: undefined,
                                sizeName: "",
                                MaCTSP: ""
                              };
                              setPOForm({ ...poForm, items: newItems });
                              console.log("DEBUG - After color selection, item:", newItems[index]);
                            }
                          }}
                         disabled={!item.MaSP}
                       >
                         <SelectTrigger
                           className={clsx('focus:outline-none', isFieldInvalid(`colorId_${index}`, item.colorId) && 'border-red-500')}
                           onBlur={() => setTouched(t => ({...t, [`colorId_${index}`]: true}))}
                         >
                           <SelectValue placeholder={!item.MaSP ? "Chọn sản phẩm trước" : "Chọn màu"}>
                             {item.colorName || "Chọn màu"}
                           </SelectValue>
                         </SelectTrigger>
                         <SelectContent>
                           {(() => {
                             const productDetails = itemProductDetails[index] || [];
                             const colors = productDetails.reduce((acc, detail) => {
                               const existingColor = acc.find(c => c.MaMau === detail.Mau.MaMau);
                               if (!existingColor) {
                                 acc.push(detail.Mau);
                               }
                               return acc;
                             }, [] as any[]);
                             
                             return colors.length > 0 ? (
                               colors.map((color) => (
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
                                 Không có màu sắc nào
                               </div>
                             );
                           })()}
                         </SelectContent>
                       </Select>
                       {isFieldInvalid(`colorId_${index}`, item.colorId) && (
                         <p className="text-sm text-red-500 mt-1">{errors[`colorId_${index}`]}</p>
                       )}
                     </div>
                     <div>
                       <Label>Kích thước</Label>
                       <Select
                         key={`size-${index}`}
                         value={item.sizeId ? item.sizeId.toString() : ""}
                                                   onValueChange={(value) => {
                            const sizeId = parseInt(value);
                            const productDetails = itemProductDetails[index] || [];
                            const selectedSize = productDetails.find(detail => 
                              detail.KichThuoc.MaKichThuoc === sizeId && 
                              detail.Mau.MaMau === item.colorId
                            );
                            
                            console.log("DEBUG - Size selected:", { sizeId, selectedSize, itemColorId: item.colorId });
                            
                            if (selectedSize) {
                              // Update the item directly without using updatePOItem to avoid conflicts
                              const newItems = [...poForm.items];
                              newItems[index] = {
                                ...newItems[index],
                                sizeId: sizeId,
                                sizeName: selectedSize.KichThuoc.TenKichThuoc,
                                MaCTSP: selectedSize.MaCTSP
                              };
                              setPOForm({ ...poForm, items: newItems });
                              console.log("DEBUG - After size selection, item:", newItems[index]);
                            }
                          }}
                         disabled={!item.MaSP || !item.colorId}
                       >
                         <SelectTrigger
                           className={clsx('focus:outline-none', isFieldInvalid(`sizeId_${index}`, item.sizeId) && 'border-red-500')}
                           onBlur={() => setTouched(t => ({...t, [`sizeId_${index}`]: true}))}
                         >
                           <SelectValue placeholder={!item.colorId ? "Chọn màu trước" : "Chọn size"}>
                             {item.sizeName || "Chọn size"}
                           </SelectValue>
                         </SelectTrigger>
                         <SelectContent>
                           {(() => {
                             if (!item.colorId) {
                               return (
                                 <div className="px-2 py-1 text-sm text-muted-foreground">
                                   Vui lòng chọn màu trước
                                 </div>
                               );
                             }
                             
                             const productDetails = itemProductDetails[index] || [];
                             const availableSizes = productDetails
                               .filter(detail => detail.Mau.MaMau === item.colorId)
                               .map(detail => detail.KichThuoc)
                               .filter((size, index, arr) => 
                                 arr.findIndex(s => s.MaKichThuoc === size.MaKichThuoc) === index
                               );
                             
                             return availableSizes.length > 0 ? (
                               availableSizes.map((size) => (
                                 <SelectItem key={size.MaKichThuoc} value={size.MaKichThuoc.toString()}>
                                   {size.TenKichThuoc}
                                 </SelectItem>
                               ))
                             ) : (
                               <div className="px-2 py-1 text-sm text-muted-foreground">
                                 Không có kích thước nào cho màu này
                               </div>
                             );
                           })()}
                         </SelectContent>
                       </Select>
                       {isFieldInvalid(`sizeId_${index}`, item.sizeId) && (
                         <p className="text-sm text-red-500 mt-1">{errors[`sizeId_${index}`]}</p>
                       )}
                     </div>
                    <div>
                      <Label>Số lượng</Label>
                      <Input
                        key={`quantity-${index}`}
                        type="number"
                        value={item.quantity === 0 ? "" : item.quantity || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updatePOItem(index, "quantity", "");
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 1) {
                              updatePOItem(index, "quantity", numValue);
                            } else {
                              // Keep the string value if it's not a valid number
                              updatePOItem(index, "quantity", value);
                            }
                          }
                        }}
                        min="1"
                        placeholder="Nhập số lượng"
                        className={clsx('focus:outline-none', isFieldInvalid(`quantity_${index}`, item.quantity) && 'border-red-500')}
                        onBlur={() => setTouched(t => ({...t, [`quantity_${index}`]: true}))}
                      />
                      {isFieldInvalid(`quantity_${index}`, item.quantity) && (
                        <p className="text-sm text-red-500 mt-1">{errors[`quantity_${index}`]}</p>
                      )}
                    </div>
                    <div>
                      <Label>Đơn giá</Label>
                      <Input
                        key={`price-${index}`}
                        type="text"
                        value={item.unitPrice === 0 ? "" : item.unitPrice.toLocaleString('vi-VN') || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updatePOItem(index, "unitPrice", 0);
                          } else {
                            // Loại bỏ dấu chấm và chuyển thành số
                            const cleanValue = value.replace(/\./g, '');
                            const numValue = parseInt(cleanValue);
                            if (!isNaN(numValue) && numValue >= 0) {
                              updatePOItem(index, "unitPrice", numValue);
                            } else {
                              // Giữ nguyên giá trị string nếu không phải số hợp lệ
                              updatePOItem(index, "unitPrice", value);
                            }
                          }
                        }}
                        placeholder="Nhập đơn giá"
                        className={clsx('focus:outline-none', isFieldInvalid(`unitPrice_${index}`, item.unitPrice) && 'border-red-500')}
                        onBlur={() => setTouched(t => ({...t, [`unitPrice_${index}`]: true}))}
                      />
                      {isFieldInvalid(`unitPrice_${index}`, item.unitPrice) && (
                        <p className="text-sm text-red-500 mt-1">{errors[`unitPrice_${index}`]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {formatPrice((typeof item.quantity === 'number' ? item.quantity : 0) * (typeof item.unitPrice === 'number' ? item.unitPrice : 0))}
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
      {/* <div>
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          value={poForm.notes}
          onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
          placeholder="Ghi chú thêm về đơn đặt hàng..."
          rows={3}
        />
      </div> */}
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