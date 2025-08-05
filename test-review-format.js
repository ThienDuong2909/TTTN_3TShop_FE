// Test case cho format data gửi lên BE
const testReviewData = [
  {
    maCTDonDatHang: 1,
    moTa: "Sản phẩm rất tốt, chất lượng ổn",
    soSao: 5
  },
  {
    maCTDonDatHang: 2, 
    moTa: "Chất lượng ổn, giao hàng nhanh",
    soSao: 4
  }
];

// Expected API call format:
// POST /api/binh-luan
// {
//   "binhLuanList": [
//     {
//       "maCTDonDatHang": 1,
//       "moTa": "Sản phẩm rất tốt, chất lượng ổn", 
//       "soSao": 5
//     },
//     {
//       "maCTDonDatHang": 2,
//       "moTa": "Chất lượng ổn, giao hàng nhanh",
//       "soSao": 4
//     }
//   ]
// }

console.log("Test data format:", {
  binhLuanList: testReviewData
});
