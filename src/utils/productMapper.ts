export const mapSanPhamFromApi = (sanPham: any) => {
  const allColors = sanPham.ChiTietSanPhams?.map((ct: any) => ct.Mau?.MaHex).filter(Boolean) || [];
  const allSizes = sanPham.ChiTietSanPhams?.map((ct: any) => ct.KichThuoc?.TenKichThuoc).filter(Boolean) || [];

  const giaGoc = Number(sanPham.ThayDoiGia?.[0]?.Gia || 0);
  const giam = Number(sanPham.CT_DotGiamGia?.[0]?.PhanTramGiam || 0);
  const giaSauGiam = giaGoc - (giaGoc * giam) / 100;

  const anhChinh = sanPham.AnhSanPhams?.find((anh: any) => anh.AnhChinh === true);
  const fallbackImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
  const image = anhChinh?.DuongDan || fallbackImage;
  console.log("TenSP for product:", sanPham.TenSP);
  console.log("avgRate product from API:", sanPham.BinhLuan.avgRate);

  return {
    id: sanPham.MaSP,
    name: sanPham.TenSP,
    price: giaSauGiam,
    originalPrice: giam > 0 ? giaGoc : undefined, // chỉ hiển thị nếu có giảm giá
    discount: giam > 0 ? giam : undefined,
    image,
    rating: sanPham.BinhLuan.avgRate,
    reviews: sanPham.BinhLuan.luotBinhLuan,
    isNew: false,
    isBestSeller: !!sanPham.totalSold, // đánh dấu là bestseller nếu có totalSold
    totalSold: sanPham.totalSold ?? 0,
    category: String(sanPham.MaLoaiSP),
    colors: [...new Set(allColors)] as string[],
    sizes: [...new Set(allSizes)] as string[],
  };
};

export const mapProductDetailFromApi = (apiData: any) => {
  const mota = apiData.MoTa;
  const chiTietList = apiData.ChiTietSanPhams;
  console.log("Chi tiết sản phẩm:", chiTietList);

  const allColors = new Set<string>();
  const allSizes = new Set<string>();
  const sizeMap: Record<string, Set<string>> = {};
  const stockMap: Record<string, number> = {};

  for (const ct of chiTietList) {
    const hex = ct.Mau?.MaHex || "#000000";
    const size = ct.KichThuoc?.TenKichThuoc || "Free";

    allColors.add(hex);
    allSizes.add(size);

    if (!sizeMap[hex]) sizeMap[hex] = new Set();
    sizeMap[hex].add(size);

    stockMap[`${hex}_${size}`] = ct.SoLuongTon;
  }

  const sizeMapObj: Record<string, string[]> = {};
  Object.entries(sizeMap).forEach(([hex, sizes]) => {
    sizeMapObj[hex] = Array.from(sizes);
  });

  const giaGoc = Number(apiData.ThayDoiGia?.[0]?.Gia || 0);
  const giam = Number(apiData.CT_DotGiamGia?.[0]?.PhanTramGiam || 0);
  const giaSauGiam = giaGoc - (giaGoc * giam) / 100;

  const anhChinh = apiData.AnhSanPhams?.find((anh: any) => anh.AnhChinh === true);
  const fallbackImage = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop";
  const image = anhChinh?.DuongDan || fallbackImage;
  const images = apiData.AnhSanPhams?.map((anh: any) => anh.DuongDan) || [];

  return {
    id: apiData.MaSP,
    name: apiData.TenSP,
    mota: mota,
    price: giaSauGiam,
    originalPrice: giam > 0 ? giaGoc : undefined,
    discount: giam > 0 ? giam : undefined,
    image,
    images,
    rating: apiData.BinhLuan.avgRate,
    reviews: apiData.BinhLuan.luotBinhLuan,
    isNew: true,
    isBestSeller: false,
    category: apiData.MaLoaiSP.toString(),
    categoryName: apiData.LoaiSP?.TenLoai,
    totalSold: 0,
    colors: Array.from(allColors),
    sizes: Array.from(allSizes),
    sizeMap: sizeMapObj,
    stockMap,
  };
}


