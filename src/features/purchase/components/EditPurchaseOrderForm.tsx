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
import { toast } from "sonner";



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
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
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
      case 'MaCTSP':
        return (value === "" || value === undefined || value === null || value === 0) ? "Vui lòng chọn màu và kích thước" : "";
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
        // Also clear the color and size IDs
        newItems[index].colorId = undefined;
        newItems[index].sizeId = undefined;
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
        // Also store the actual color and size IDs for API compatibility
        newItems[index].colorId = selectedDetail.Mau.MaMau;
        newItems[index].sizeId = selectedDetail.KichThuoc.MaKichThuoc;
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
        // Also clear the color and size IDs
        newItems[index].colorId = undefined;
        newItems[index].sizeId = undefined;
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
      (sum, item) => {
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
        return sum + quantity * unitPrice;
      },
      0
    );
  };

  const handleSubmit = () => {
    // Mark form as submitted
    setHasSubmitted(true);
    
    // Mark all fields as touched to show validation errors
    const touchedFields = {
      supplierId: true,
      expectedDeliveryDate: true,
      ...poForm.items.reduce((acc, _, index) => ({
        ...acc,
        [`MaSP_${index}`]: true,
        [`MaCTSP_${index}`]: true,
        [`quantity_${index}`]: true,
        [`unitPrice_${index}`]: true,
      }), {})
    };
    setTouched(touchedFields);

    // Check if no products selected - this should show toast
    if (poForm.items.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    // Validate form fields and update errors state
    const newErrors: {[key: string]: string} = {};

    // Validate supplier
    newErrors.supplierId = validateField('supplierId', poForm.supplierId);

    // Validate delivery date
    newErrors.expectedDeliveryDate = validateField('expectedDeliveryDate', poForm.expectedDeliveryDate);

    // Validate items
    poForm.items.forEach((item, index) => {
      newErrors[`MaSP_${index}`] = validateItemField(index, 'MaSP', item.MaSP);
      newErrors[`MaCTSP_${index}`] = validateItemField(index, 'MaCTSP', item.MaCTSP);
      newErrors[`quantity_${index}`] = validateItemField(index, 'quantity', item.quantity);
      newErrors[`unitPrice_${index}`] = validateItemField(index, 'unitPrice', item.unitPrice);
      

    });

    // Update errors state
    setErrors(newErrors);

    // Check if there are any validation errors
    const allErrors = Object.values(newErrors).filter(Boolean);

    if (allErrors.length > 0) {
      // Don't submit if there are validation errors - they will be shown as red borders
      return;
    }

    onSubmit();
  };

  return (
    <div className="space-y-6 relative">
      {/* General Error Banner */}
      {(() => {
        // Check if there are any validation errors
        const hasValidationErrors = Object.values(errors).some(error => error);
        
        if (hasValidationErrors) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Thông tin không đầy đủ
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Vui lòng chọn màu và kích thước cho tất cả sản phẩm</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      
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
                      {isFieldInvalid(`MaSP_${index}`, item.MaSP) && (
                        <p className="text-sm text-red-500 mt-1">{errors[`MaSP_${index}`]}</p>
                      )}
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
                      {isFieldInvalid(`MaCTSP_${index}`, item.MaCTSP) && (
                        <p className="text-sm text-red-500 mt-1">{errors[`MaCTSP_${index}`]}</p>
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