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
  const chiTietList = apiData.ChiTietSanPhams;

  const allColors = new Set<string>();
  const allSizes = new Set<string>();
  const sizeMap: Record<string, Set<string>> = {};
  const stockMap: Record<string, number> = {}; // 👈 mới thêm

  for (const ct of chiTietList) {
    const hex = ct.Mau?.MaHex || "#000000";
    const size = ct.KichThuoc?.TenKichThuoc || "Free";

    allColors.add(hex);
    allSizes.add(size);

    if (!sizeMap[hex]) sizeMap[hex] = new Set();
    sizeMap[hex].add(size);

    stockMap[`${hex}_${size}`] = ct.SoLuongTon; // 👈 ánh xạ tồn kho
  }

  const sizeMapObj: Record<string, string[]> = {};
  Object.entries(sizeMap).forEach(([hex, sizes]) => {
    sizeMapObj[hex] = Array.from(sizes);
  });

  return {
    id: apiData.MaSP,
    name: apiData.TenSP,
    price: 299000,
    originalPrice: 349000,
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop",
    rating: 4.5,
    reviews: 123,
    discount: 15,
    isNew: true,
    isBestSeller: false,
    category: apiData.MaLoaiSP.toString(),
    colors: Array.from(allColors),
    sizes: Array.from(allSizes),
    sizeMap: sizeMapObj,
    stockMap, // 👈 thêm vào product
  };
}

