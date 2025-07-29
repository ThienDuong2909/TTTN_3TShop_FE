# Test API Duyệt Đơn Hàng

## Test cập nhật trạng thái đơn hàng đơn lẻ

```bash
curl -X PUT http://localhost:8080/api/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "maTTDH": 2,
    "maNVDuyet": 1
  }'
```

## Test cập nhật trạng thái nhiều đơn hàng (Batch)

```bash
curl -X PUT http://localhost:8080/api/orders/batch/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orders": [
      {
        "id": 1,
        "maTTDH": 2,
        "maNVDuyet": 1
      },
      {
        "id": 2,
        "maTTDH": 2,
        "maNVDuyet": 1
      }
    ]
  }'
```

## Test với JavaScript

```javascript
// Test batch approval function
const testBatchApproval = async () => {
  const ordersToApprove = [
    { id: 1, maTTDH: 2, maNVDuyet: 1 },
    { id: 2, maTTDH: 2, maNVDuyet: 1 }
  ];

  try {
    const response = await fetch('http://localhost:8080/api/orders/batch/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orders: ordersToApprove })
    });

    const result = await response.json();
    console.log('Batch approval result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Call the test function
testBatchApproval();
```
