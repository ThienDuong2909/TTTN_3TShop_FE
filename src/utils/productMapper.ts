export const mapSanPhamFromApi = (sanPham) => {
  const allColors = sanPham.ChiTietSanPhams.map((ct) => ct.Mau.MaHex);
  const allSizes = sanPham.ChiTietSanPhams.map(
    (ct) => ct.KichThuoc.TenKichThuoc
  );

  return {
    id: sanPham.MaSP,
    name: sanPham.TenSP,
    price: 300000, // Bạn có thể lấy giá thật nếu backend có (hiện chưa có)
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop", // Tạm thời ảnh placeholder
    rating: 4.5,
    reviews: 100,
    isNew: false,
    isBestSeller: false,
    category: String(sanPham.MaLoaiSP),
    colors: [...new Set(allColors)] as string[],
    sizes: [...new Set(allSizes)] as string[],
  };
};
export function mapProductDetailFromApi(apiData: any): Product {
  console.log("apiData",apiData)
  const allColors = apiData.ChiTietSanPhams.map(
    (ct: any) => ct.Mau?.MaHex || "#000000"
  );
  const allSizes = apiData.ChiTietSanPhams.map(
    (ct: any) => ct.KichThuoc?.TenKichThuoc || "Free"
  );

  return {
    id: apiData.MaSP,
    name: apiData.TenSP,
    price: 299000, // Hoặc lấy giá từ đâu đó nếu backend có
    originalPrice: 349000,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop", // Bạn có thể cập nhật theo ảnh thật nếu có
    rating: 4.5,
    reviews: 123,
    discount: 15,
    isNew: true,
    isBestSeller: false,
    category: apiData.MaLoaiSP.toString(), // nếu cần format lại dạng '1-2'
    colors: [...new Set(allColors)] as string[],
    sizes: [...new Set(allSizes)] as string[],
  };
}

