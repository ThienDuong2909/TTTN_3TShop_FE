const XLSX = require('xlsx');
const fs = require('fs');

// Read CSV data
const csvData = `STT,product_id,product_name,ordered_quantity,received_quantity,notes
1,1,Áo sơ mi nam trắng basic,50,48,Nhận thiếu 2 cái do hư hỏng
2,2,Áo sơ mi nam sọc xanh,30,30,Nhận đủ số lượng
3,3,Quần jean nam slim fit,25,23,2 cái bị rách nhẹ
4,SP004,Áo khoác denim unisex,20,20,Nhận đủ số lượng
5,SP005,Giày sneaker unisex,15,14,1 đôi bị lỗi khóa
6,SP006,Túi xách nữ da thật,10,10,Nhận đủ số lượng
7,SP007,Áo len nữ cổ lọ,35,33,2 cái bị sút chỉ
8,SP008,Quần tây nam công sở,18,18,Nhận đủ số lượng`;

// Parse CSV to JSON
const lines = csvData.split('\n');
const headers = lines[0].split(',');
const jsonData = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((header, index) => {
    obj[header.trim()] = values[index]?.trim() || '';
  });
  return obj;
});

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(jsonData);

// Add styling to header
const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
for (let C = range.s.c; C <= range.e.c; ++C) {
  const address = XLSX.utils.encode_col(C) + "1";
  if (!ws[address]) continue;
  ws[address].s = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center" },
  };
}

// Set column widths
ws["!cols"] = [
  { width: 5 },  // STT
  { width: 15 }, // product_id
  { width: 40 }, // product_name
  { width: 15 }, // ordered_quantity
  { width: 15 }, // received_quantity
  { width: 30 }, // notes
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, "Goods_Receipt");

// Write file
XLSX.writeFile(wb, "test_goods_receipt_import.xlsx");

console.log("Excel file 'test_goods_receipt_import.xlsx' has been created successfully!");
console.log("\nFile structure:");
console.log("- STT: Số thứ tự");
console.log("- product_id: Mã sản phẩm (phải khớp với mã trong phiếu đặt hàng)");
console.log("- product_name: Tên sản phẩm (để tham khảo)");
console.log("- ordered_quantity: Số lượng đặt hàng (để tham khảo)");
console.log("- received_quantity: Số lượng nhận thực tế (bắt buộc điền)");
console.log("- notes: Ghi chú (tùy chọn)"); 