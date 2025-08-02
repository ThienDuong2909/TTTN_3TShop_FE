import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format số tiền Việt Nam với dấu phẩy ngàn
 * @param amount - Số tiền cần format
 * @param currency - Ký hiệu tiền tệ (mặc định: "₫")
 * @returns Chuỗi đã format (ví dụ: "12,000 ₫")
 */
export function formatVietnameseCurrency(amount: number, currency: string = "₫"): string {
  if (amount === 0) return `0 ${currency}`;
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
}

/**
 * Parse số tiền Việt Nam từ chuỗi (loại bỏ dấu phẩy, dấu chấm)
 * @param value - Giá trị cần parse
 * @returns Số nguyên
 */
export function parseVietnameseCurrency(value: any): number {
  if (!value) return 0;
  
  // Nếu đã là số, trả về trực tiếp
  if (typeof value === 'number') {
    return value;
  }
  
  const strValue = value.toString().trim();
  
  // Loại bỏ ký tự không phải số, dấu chấm, dấu phẩy
  const cleanValue = strValue.replace(/[^\d.,]/g, '');
  
  // Nếu có dấu chấm ở cuối (như 12.000), loại bỏ dấu chấm
  if (cleanValue.endsWith('.')) {
    return parseInt(cleanValue.slice(0, -1)) || 0;
  }
  
  // Xử lý định dạng "12.000,00" (dấu chấm là separator hàng nghìn, dấu phẩy là decimal)
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    // Loại bỏ dấu chấm (separator hàng nghìn) trước, sau đó xử lý dấu phẩy
    const withoutThousandSeparator = cleanValue.replace(/\./g, '');
    // Nếu có dấu phẩy, loại bỏ phần thập phân
    if (withoutThousandSeparator.includes(',')) {
      return parseInt(withoutThousandSeparator.split(',')[0]) || 0;
    }
    return parseInt(withoutThousandSeparator) || 0;
  }
  
  // Xử lý định dạng "12,000.00" (dấu phẩy là separator hàng nghìn, dấu chấm là decimal)
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Loại bỏ dấu phẩy (separator hàng nghìn) trước, sau đó xử lý dấu chấm
    const withoutThousandSeparator = cleanValue.replace(/,/g, '');
    // Nếu có dấu chấm, loại bỏ phần thập phân
    if (withoutThousandSeparator.includes('.')) {
      return parseInt(withoutThousandSeparator.split('.')[0]) || 0;
    }
    return parseInt(withoutThousandSeparator) || 0;
  }
  
  // Nếu có dấu phẩy (như 12,000), loại bỏ dấu phẩy
  if (cleanValue.includes(',')) {
    return parseInt(cleanValue.replace(/,/g, '')) || 0;
  }
  
  // Nếu có dấu chấm (như 12.000), loại bỏ dấu chấm
  if (cleanValue.includes('.')) {
    return parseInt(cleanValue.replace(/\./g, '')) || 0;
  }
  
  // Nếu chỉ có số
  return parseInt(cleanValue) || 0;
}

/**
 * So sánh đơn giá một cách linh hoạt, xử lý các định dạng khác nhau
 * @param price1 - Giá trị 1
 * @param price2 - Giá trị 2
 * @returns true nếu hai giá trị khớp nhau (xét đến các định dạng khác nhau)
 */
export function comparePricesFlexibly(price1: number, price2: number): boolean {
  // Chuyển đổi cả hai giá trị thành số nguyên để so sánh
  const p1 = Math.round(price1);
  const p2 = Math.round(price2);
  
  console.log(`comparePricesFlexibly:`, {
    originalPrice1: price1,
    originalPrice2: price2,
    roundedPrice1: p1,
    roundedPrice2: p2
  });
  
  // Trường hợp 1: So sánh trực tiếp
  if (p1 === p2) {
    console.log(`Match found: Direct comparison (${p1} === ${p2})`);
    return true;
  }
  
  // Trường hợp 2: price1 có thể là đơn vị 1000 VND, price2 là VND
  if (p1 * 1000 === p2) {
    console.log(`Match found: p1 * 1000 === p2 (${p1} * 1000 === ${p2})`);
    return true;
  }
  
  // Trường hợp 3: price1 là VND, price2 có thể là đơn vị 1000 VND
  if (p1 === p2 * 1000) {
    console.log(`Match found: p1 === p2 * 1000 (${p1} === ${p2} * 1000)`);
    return true;
  }
  
  // Trường hợp 4: price1 có thể là đơn vị 100 VND, price2 là VND
  if (p1 * 100 === p2) {
    console.log(`Match found: p1 * 100 === p2 (${p1} * 100 === ${p2})`);
    return true;
  }
  
  // Trường hợp 5: price1 là VND, price2 có thể là đơn vị 100 VND
  if (p1 === p2 * 100) {
    console.log(`Match found: p1 === p2 * 100 (${p1} === ${p2} * 100)`);
    return true;
  }
  
  // Trường hợp 6: Xử lý trường hợp database có decimal places
  // Ví dụ: Excel = 12000, DB = 120000.00 (có thể là 12000 * 10)
  if (p1 * 10 === p2) {
    console.log(`Match found: p1 * 10 === p2 (${p1} * 10 === ${p2})`);
    return true;
  }
  
  // Trường hợp 7: Excel = 12000, DB = 120000.00 (có thể là 12000 * 10)
  if (p1 === p2 / 10) {
    console.log(`Match found: p1 === p2 / 10 (${p1} === ${p2} / 10)`);
    return true;
  }
  
  // Trường hợp 8: Xử lý trường hợp database có decimal places khác
  // Ví dụ: Excel = 12000, DB = 120000.00 (có thể là 12000 * 10)
  if (Math.abs(p1 * 10 - p2) <= 1) {
    console.log(`Match found: |p1 * 10 - p2| <= 1 (|${p1} * 10 - ${p2}| <= 1)`);
    return true;
  }
  
  if (Math.abs(p1 - p2 / 10) <= 1) {
    console.log(`Match found: |p1 - p2 / 10| <= 1 (|${p1} - ${p2} / 10| <= 1)`);
    return true;
  }
  
  console.log(`No match found for ${p1} and ${p2}`);
  return false;
}
