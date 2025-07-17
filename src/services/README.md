# API Services Documentation

## Tổng quan

Hệ thống API services đã được refactor để có tính tái sử dụng cao hơn, dễ bảo trì và mở rộng. Hệ thống mới bao gồm:

- **BaseApiService**: Class cơ sở cung cấp các operations CRUD cơ bản
- **Specific Services**: Các service chuyên biệt cho từng domain (Employee, Product, etc.)
- **Service Utils**: Các tiện ích để xử lý error, cache, validation, v.v.
- **Backward Compatibility**: Vẫn hỗ trợ các function cũ để không làm break existing code

## Cấu trúc thư mục

```
src/services/
├── fetch.js                 # Axios client configuration
├── BaseApiService.js        # Base service class
├── apiServices.js          # Specific service classes
├── commonService.js        # Backward compatibility layer
├── serviceUtils.js         # Utility functions
└── README.md              # Documentation
```

## Cách sử dụng

### 1. Sử dụng cách cũ (Backward Compatibility)

```javascript
// Vẫn hoạt động như trước
import { 
  getEmployees, 
  createPurchaseOrder, 
  getGoodsReceipts 
} from '../services/commonService';

const employees = await getEmployees();
const order = await createPurchaseOrder(orderData);
const receipts = await getGoodsReceipts();
```

### 2. Sử dụng Service Classes (Khuyến khích)

```javascript
// Import các service cần thiết
import { 
  employeeService, 
  purchaseOrderService, 
  goodsReceiptService 
} from '../services/apiServices';

// Hoặc import tất cả
import apiServices from '../services/apiServices';

// Sử dụng
const employees = await employeeService.getAll();
const order = await purchaseOrderService.create(orderData);
const receipts = await goodsReceiptService.getAll();

// Với apiServices object
const employees = await apiServices.employee.getAll();
const order = await apiServices.purchaseOrder.create(orderData);
```

### 3. Sử dụng với Error Handling

```javascript
import { employeeService } from '../services/apiServices';
import { withErrorHandling, getErrorMessage } from '../services/serviceUtils';

// Cách 1: Sử dụng withErrorHandling
const employees = await withErrorHandling(
  () => employeeService.getAll(),
  {
    defaultValue: [],
    onError: (error) => {
      console.error('Failed to load employees:', getErrorMessage(error));
    }
  }
);

// Cách 2: Tự handle error
try {
  const employees = await employeeService.getAll();
} catch (error) {
  const userMessage = getErrorMessage(error);
  // Show user-friendly message
}
```

### 4. Sử dụng Cache

```javascript
import { employeeService } from '../services/apiServices';
import { withCache } from '../services/serviceUtils';

// Cache kết quả trong 5 phút
const employees = await withCache(
  'employees-list',
  () => employeeService.getAll(),
  5 * 60 * 1000 // 5 minutes
);
```

### 5. Sử dụng Pagination

```javascript
import { employeeService } from '../services/apiServices';
import { withPagination } from '../services/serviceUtils';

const paginatedEmployees = await withPagination(
  (params) => employeeService.getAll(params),
  {
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc',
    filters: { department: 'IT' }
  }
);
```

## Các Service Classes

### 1. EmployeeService

```javascript
import { employeeService } from '../services/apiServices';

// Basic CRUD
const employees = await employeeService.getAll();
const employee = await employeeService.getById(id);
const newEmployee = await employeeService.create(data);
const updatedEmployee = await employeeService.update(id, data);
await employeeService.delete(id);

// Specific methods
const profile = await employeeService.getCurrentProfile();
const deptEmployees = await employeeService.getByDepartment(deptId);
await employeeService.updateProfile(profileData);
```

### 2. PurchaseOrderService

```javascript
import { purchaseOrderService } from '../services/apiServices';

// Basic CRUD
const orders = await purchaseOrderService.getAll();
const order = await purchaseOrderService.getById(id);
const newOrder = await purchaseOrderService.create(orderData);

// Specific methods
await purchaseOrderService.updateStatus(id, statusId);
const availableOrders = await purchaseOrderService.getAvailableForReceipt();
const orderForReceipt = await purchaseOrderService.getForReceipt(orderId);
const ordersBySupplier = await purchaseOrderService.getBySupplier(supplierId);
const ordersByDate = await purchaseOrderService.getByDateRange(startDate, endDate);
```

### 3. GoodsReceiptService

```javascript
import { goodsReceiptService } from '../services/apiServices';

// Basic CRUD
const receipts = await goodsReceiptService.getAll();
const receipt = await goodsReceiptService.getById(id);
const newReceipt = await goodsReceiptService.create(receiptData);

// Specific methods
await goodsReceiptService.updateInventoryAfterReceipt(receiptId);
const receiptsByOrder = await goodsReceiptService.getByPurchaseOrder(orderId);
const receiptsByDate = await goodsReceiptService.getByDateRange(startDate, endDate);
```

### 4. Các Service khác

- **SupplierService**: Quản lý nhà cung cấp
- **ProductService**: Quản lý sản phẩm
- **ProductDetailService**: Quản lý chi tiết sản phẩm
- **ColorService**: Quản lý màu sắc
- **SizeService**: Quản lý kích thước
- **AuthService**: Quản lý authentication

## Base Service Methods

Tất cả service classes đều kế thừa từ `BaseApiService` và có các methods cơ bản:

```javascript
// CRUD operations
const items = await service.getAll(params);
const item = await service.getById(id);
const newItem = await service.create(data);
const updatedItem = await service.update(id, data);
const patchedItem = await service.patch(id, data);
await service.delete(id);

// Custom requests
const result = await service.customGet('/custom-path', params);
const result = await service.customPost('/custom-path', data);
const result = await service.customPut('/custom-path', data);
```

## Service Utils

### Error Handling

```javascript
import { 
  withErrorHandling, 
  getErrorMessage, 
  isNetworkError, 
  isAuthError 
} from '../services/serviceUtils';

// Retry mechanism
const result = await withErrorHandling(
  () => apiCall(),
  {
    retryCount: 3,
    retryDelay: 1000,
    onError: (error) => {
      if (isAuthError(error)) {
        // Redirect to login
      }
    }
  }
);
```

### Data Transformation

```javascript
import { 
  transformDataForApi, 
  formatDateForApi, 
  formatDateTimeForApi 
} from '../services/serviceUtils';

// Transform data before sending
const apiData = transformDataForApi(formData, {
  createdAt: formatDateForApi,
  updatedAt: formatDateTimeForApi,
  oldKey: 'newKey' // Rename key
});
```

### Validation

```javascript
import { 
  validateRequired, 
  validateEmail, 
  validatePhone 
} from '../services/serviceUtils';

// Validate required fields
const validation = validateRequired(data, ['name', 'email']);
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
}

// Validate formats
const isValidEmail = validateEmail(email);
const isValidPhone = validatePhone(phone);
```

## Tạo Service mới

Để tạo service mới, bạn có thể extend từ `BaseApiService`:

```javascript
import BaseApiService from './BaseApiService';

export class CustomService extends BaseApiService {
  constructor() {
    super('/custom-endpoint');
  }

  // Add custom methods
  async getByCustomFilter(filter) {
    return await this.customGet(`/filter/${filter}`);
  }

  async bulkCreate(items) {
    return await this.customPost('/bulk', { items });
  }

  // Override base methods if needed
  async create(data) {
    // Custom validation or transformation
    const transformedData = this.transformData(data);
    return await super.create(transformedData);
  }

  private transformData(data) {
    // Custom transformation logic
    return data;
  }
}

// Export instance
export const customService = new CustomService();
```

## Best Practices

1. **Sử dụng Error Handling**: Luôn wrap API calls với error handling
2. **Cache dữ liệu**: Sử dụng cache cho dữ liệu ít thay đổi
3. **Validate dữ liệu**: Validate dữ liệu trước khi gửi API
4. **Transform dữ liệu**: Sử dụng transformation utilities
5. **Consistent naming**: Tuân thủ naming convention
6. **Documentation**: Document các custom methods

## Migration từ cách cũ

Để migrate từ cách cũ sang cách mới:

1. **Giữ nguyên code cũ**: Vẫn hoạt động bình thường
2. **Dần dần thay thế**: Thay thế từng chỗ một
3. **Sử dụng new features**: Error handling, cache, validation
4. **Test thoroughly**: Đảm bảo functionality không bị break

## Troubleshooting

### Common Issues

1. **Network errors**: Sử dụng `withErrorHandling` với retry
2. **Authentication errors**: Check token và redirect to login
3. **Validation errors**: Sử dụng validation utilities
4. **Cache issues**: Clear cache khi cần thiết

### Debug Tips

1. Check console logs cho detailed error info
2. Sử dụng network tab trong dev tools
3. Verify API endpoints và data format
4. Check token expiration 