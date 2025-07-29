const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  // Đọc file Excel
  const excelPath = path.join(__dirname, 'src', 'data', 'district_list.xlsx');
  const workbook = XLSX.readFile(excelPath);
  
  // Lấy sheet đầu tiên
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert sheet thành JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Dữ liệu từ Excel:');
  console.log('Số dòng:', jsonData.length);
  console.log('Dữ liệu mẫu:', jsonData.slice(0, 5));
  
  // Trích xuất danh sách phường/xã
  let districts = [];
  
  // Kiểm tra cấu trúc dữ liệu
  if (jsonData.length > 0) {
    // Nếu dòng đầu là header, bỏ qua
    const startIndex = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                       (jsonData[0][0].toLowerCase().includes('phường') || 
                        jsonData[0][0].toLowerCase().includes('xã') ||
                        jsonData[0][0].toLowerCase().includes('tên') ||
                        jsonData[0][0].toLowerCase().includes('district')) ? 1 : 0;
    
    // Lấy dữ liệu từ cột đầu tiên (cột A)
    for (let i = startIndex; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[0] && typeof row[0] === 'string') {
        const districtName = row[0].toString().trim();
        if (districtName && districtName !== '') {
          districts.push(districtName);
        }
      }
    }
  }
  
  // Loại bỏ trùng lặp và sắp xếp
  districts = [...new Set(districts)].sort();
  
  console.log('\nDanh sách phường/xã trích xuất:');
  console.log('Tổng số:', districts.length);
  console.log('5 phường/xã đầu tiên:', districts.slice(0, 5));
  console.log('5 phường/xã cuối cùng:', districts.slice(-5));
  
  // Ghi vào file JSON
  const jsonPath = path.join(__dirname, 'src', 'data', 'districts.json');
  fs.writeFileSync(jsonPath, JSON.stringify(districts, null, 2), 'utf8');
  
  console.log(`\n✅ Đã cập nhật file ${jsonPath} thành công!`);
  console.log(`📊 Tổng số phường/xã: ${districts.length}`);
  
} catch (error) {
  console.error('❌ Lỗi khi xử lý file:', error.message);
  
  // Nếu không đọc được Excel, tạo danh sách mặc định cho TP.HCM
  console.log('\n🔄 Tạo danh sách phường/xã mặc định cho TP.HCM...');
  
  const defaultDistricts = [
    // Quận 1
    "Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho", "Phường Cầu Ông Lãnh",
    "Phường Cô Giang", "Phường Đa Kao", "Phường Nguyễn Cư Trinh", "Phường Nguyễn Thái Bình",
    "Phường Phạm Ngũ Lão", "Phường Tân Định",
    
    // Quận 2 (Thủ Đức)
    "Phường An Khánh", "Phường An Lợi Đông", "Phường An Phú", "Phường Bình An",
    "Phường Bình Khánh", "Phường Bình Trưng Đông", "Phường Bình Trưng Tây",
    "Phường Cát Lái", "Phường Thạnh Mỹ Lợi", "Phường Thủ Thiêm",
    
    // Quận 3
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14",
    
    // Quận 4
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 8",
    "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16",
    "Phường 18",
    
    // Quận 5
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14", "Phường 15",
    
    // Quận 6
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14",
    
    // Quận 7
    "Phường Bình Thuận", "Phường Phú Mỹ", "Phường Phú Thuận", "Phường Tân Hưng",
    "Phường Tân Kiểng", "Phường Tân Phong", "Phường Tân Phú", "Phường Tân Quy",
    "Phường Tân Thuận Đông", "Phường Tân Thuận Tây",
    
    // Quận 8
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14", "Phường 15", "Phường 16",
    
    // Quận 9 (Thủ Đức)
    "Phường Hiệp Phú", "Phường Long Bình", "Phường Long Phước", "Phường Long Thạnh Mỹ",
    "Phường Long Trường", "Phường Phú Hữu", "Phường Phước Bình", "Phường Phước Long A",
    "Phường Phước Long B", "Phường Tăng Nhơn Phú A", "Phường Tăng Nhơn Phú B",
    "Phường Trường Thạnh",
    
    // Quận 10
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14", "Phường 15",
    
    // Quận 11
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14", "Phường 15", "Phường 16",
    
    // Quận 12
    "Phường An Phú Đông", "Phường Đông Hưng Thuận", "Phường Hiệp Thành",
    "Phường Tân Chánh Hiệp", "Phường Tân Hưng Thuận", "Phường Tân Thới Hiệp",
    "Phường Tân Thới Nhất", "Phường Thạnh Lộc", "Phường Thạnh Xuân",
    "Phường Thới An", "Phường Trung Mỹ Tây",
    
    // Quận Gò Vấp
    "Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7",
    "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13",
    "Phường 14", "Phường 15", "Phường 16", "Phường 17",
    
    // Quận Tân Bình
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6",
    "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12",
    "Phường 13", "Phường 14", "Phường 15",
    
    // Quận Tân Phú
    "Phường Hòa Thạnh", "Phường Hiệp Tân", "Phường Phú Thạnh", "Phường Phú Trung",
    "Phường Sơn Kỳ", "Phường Tân Sơn Nhì", "Phường Tân Thành", "Phường Tân Thới Hòa",
    "Phường Tây Thạnh",
    
    // Quận Phú Nhuận
    "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7",
    "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 13", "Phường 15",
    "Phường 17",
    
    // Quận Bình Thạnh
    "Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7",
    "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17",
    "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26",
    "Phường 27", "Phường 28",
    
    // Huyện Bình Chánh
    "Xã Bình Hưng", "Xã Bình Lợi", "Xã Đa Phước", "Xã Hưng Long", "Xã Lê Minh Xuân",
    "Xã Phạm Văn Hai", "Xã Phong Phú", "Xã Quy Đức", "Xã Tân Kiên", "Xã Tân Nhựt",
    "Xã Tân Quý Tây", "Xã Vĩnh Lộc A", "Xã Vĩnh Lộc B", "Thị trấn Tân Túc",
    
    // Huyện Cần Giờ
    "Xã An Thới Đông", "Xã Bình Khánh", "Xã Cần Thạnh", "Xã Long Hòa",
    "Xã Lý Nhơn", "Xã Tam Thôn Hiệp", "Thị trấn Cần Thạnh",
    
    // Huyện Củ Chi
    "Xã An Nhơn Tây", "Xã An Phú", "Xã Bình Mỹ", "Xã Hòa Phú", "Xã Nhuận Đức",
    "Xã Phạm Văn Cội", "Xã Phú Hòa Đông", "Xã Phú Mỹ Hưng", "Xã Tân An Hội",
    "Xã Tân Phú Trung", "Xã Tân Thạnh Đông", "Xã Tân Thạnh Tây", "Xã Tân Thông Hội",
    "Xã Thái Mỹ", "Xã Trung An", "Xã Trung Lập Hạ", "Xã Trung Lập Thượng",
    "Thị trấn Củ Chi",
    
    // Huyện Hóc Môn
    "Xã Bà Điểm", "Xã Đông Thạnh", "Xã Nhị Bình", "Xã Tân Hiệp", "Xã Tân Thới Nhì",
    "Xã Tân Xuân", "Xã Thới Tam Thôn", "Xã Trung Chánh", "Xã Xuân Thới Đông",
    "Xã Xuân Thới Sơn", "Xã Xuân Thới Thượng", "Thị trấn Hóc Môn",
    
    // Huyện Nhà Bè
    "Xã Hiệp Phước", "Xã Long Thới", "Xã Nhơn Đức", "Xã Phú Xuân", "Xã Phước Kiển",
    "Xã Phước Lộc"
  ];
  
  // Loại bỏ trùng lặp và sắp xếp
  const uniqueDistricts = [...new Set(defaultDistricts)].sort();
  
  // Ghi vào file JSON
  const jsonPath = path.join(__dirname, 'src', 'data', 'districts.json');
  fs.writeFileSync(jsonPath, JSON.stringify(uniqueDistricts, null, 2), 'utf8');
  
  console.log(`✅ Đã tạo file ${jsonPath} với danh sách mặc định!`);
  console.log(`📊 Tổng số phường/xã: ${uniqueDistricts.length}`);
}
