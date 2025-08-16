import React from "react";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  FileText,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { formatVietnameseCurrency } from "@/lib/utils";

interface ReturnDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedReturn: any;
  activeTab: number;
  isAdmin: boolean;
  isUpdatingStatus: boolean;
  formatPrice: (price: number) => string;
  formatDate: (date: string) => string;
  getStatusBadge: (status: number) => React.ReactElement;
  onApproveReturn: (returnRequest: any) => void;
  onRejectReturn: (returnRequest: any) => void;
  onCreatePaymentSlip: (returnRequest: any) => void;
  onViewPaymentSlip: (returnRequest: any) => void;
}

export default function ReturnDetailsModal({
  open,
  onOpenChange,
  selectedReturn,
  activeTab,
  isAdmin,
  isUpdatingStatus,
  formatPrice,
  formatDate,
  getStatusBadge,
  onApproveReturn,
  onRejectReturn,
  onCreatePaymentSlip,
  onViewPaymentSlip,
}: ReturnDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[88vh] overflow-y-auto">
        <DialogHeader className="pb-2 bg-white dark:bg-gray-950 border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Chi tiết phiếu trả hàng
          </DialogTitle>
        </DialogHeader>

        <div className="px-1 pb-4">
          {selectedReturn && (
            <div className="space-y-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Trạng thái:</span>
                  {getStatusBadge(selectedReturn.TrangThai)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Tổng hoàn trả: </span>
                  <span className="font-bold text-green-600">
                    {formatVietnameseCurrency(
                      selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                        (sum: number, item: any) =>
                          sum +
                          Number(item.DonGia || 0) * (item.SoLuongTra || 0),
                        0
                      ) || 0,
                      "VND"
                    )}
                  </span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Return Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Thông tin phiếu trả
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Mã phiếu trả:
                        </span>
                        <span className="font-mono font-semibold text-sm">
                          #{selectedReturn.MaPhieuTra.toString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Số hóa đơn:
                        </span>
                        <span className="font-mono text-sm">
                          {selectedReturn.SoHD}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Ngày trả:
                        </span>
                        <span className="text-sm">
                          {formatDate(selectedReturn.NgayTra)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Thông tin khách hàng mua
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Tên khách hàng:
                        </span>
                        <span
                          className="font-semibold text-right max-w-32 text-sm"
                          title={
                            selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                              ?.TenKH || ""
                          }
                        >
                          {selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                            ?.TenKH || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Số điện thoại:
                        </span>
                        <span className="font-mono text-sm">
                          {selectedReturn?.HoaDon?.DonDatHang?.KhachHang?.SDT ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Thông tin địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Tên người nhận:
                        </span>
                        <span
                          className="font-semibold text-right max-w-32 text-sm"
                          title={
                            selectedReturn?.HoaDon?.DonDatHang?.TenNguoiNhan ||
                            selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                              ?.TenKH ||
                            ""
                          }
                        >
                          {selectedReturn?.HoaDon?.DonDatHang?.TenNguoiNhan ||
                            selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                              ?.TenKH ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          SĐT người nhận:
                        </span>
                        <span className="font-mono text-sm">
                          {selectedReturn?.HoaDon?.DonDatHang?.SDTNguoiNhan ||
                            selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                              ?.SDT ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Địa chỉ giao hàng:
                        </span>
                        <span className="text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {selectedReturn?.HoaDon?.DonDatHang?.DiaChiGiao ||
                            selectedReturn?.HoaDon?.DonDatHang?.KhachHang
                              ?.DiaChi ||
                            "Không có"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Return Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Lý do trả hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-gray-800 font-semibold dark:text-gray-200 leading-relaxed">
                      {selectedReturn.LyDo || "Không có lý do cụ thể"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Danh sách sản phẩm trả hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">Sản phẩm</TableHead>
                        <TableHead className="text-center text-sm">
                          Thuộc tính
                        </TableHead>
                        <TableHead className="text-right text-sm">
                          Đơn giá
                        </TableHead>
                        <TableHead className="text-center text-sm">
                          SL trả
                        </TableHead>
                        <TableHead className="text-right text-sm">
                          Thành tiền
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.map(
                        (item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {item?.ChiTietSanPham?.SanPham?.TenSP ||
                                    "N/A"}
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  SKU: {item?.ChiTietSanPham?.SKU || "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-2">
                                {/* Size */}
                                <div className="flex items-center justify-center gap-2">
                                  <div className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded font-medium">
                                    {item?.ChiTietSanPham?.KichThuoc?.TenSize ||
                                      "N/A"}
                                  </div>
                                </div>
                                {/* Color with preview */}
                                <div className="flex items-center justify-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{
                                        backgroundColor:
                                          item?.ChiTietSanPham?.Mau?.MaMau ||
                                          "#gray",
                                      }}
                                    ></div>
                                    <span className="text-sm">
                                      {item?.ChiTietSanPham?.Mau?.TenMau ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatPrice(Number(item?.DonGia || 0))}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded text-sm font-medium">
                                {item?.SoLuongTra || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-sm">
                              {formatPrice(
                                Number(item?.DonGia || 0) *
                                  (item?.SoLuongTra || 0)
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      ) || []}
                    </TableBody>
                  </Table>

                  {/* Table Footer */}
                  <div className="border-t bg-gray-50 dark:bg-gray-800 px-3 py-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng{" "}
                        {selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                          (sum: number, item: any) =>
                            sum + (item?.SoLuongTra || 0),
                          0
                        ) || 0}{" "}
                        sản phẩm
                      </span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Tổng tiền hoàn trả
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(
                            selectedReturn?.HoaDon?.DonDatHang?.CT_DonDatHangs?.reduce(
                              (sum: number, item: any) =>
                                sum +
                                Number(item?.DonGia || 0) *
                                  (item?.SoLuongTra || 0),
                              0
                            ) || 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t bottom-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {selectedReturn?.TrangThai === 1 && (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Đang chờ xử lý
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Đóng
              </Button>
              {selectedReturn?.TrangThai === 1 &&
                activeTab === 1 &&
                isAdmin && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApproveReturn(selectedReturn)}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRejectReturn(selectedReturn)}
                      disabled={isUpdatingStatus}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Từ chối
                    </Button>
                  </>
                )}
              {selectedReturn?.TrangThai === 2 &&
                isAdmin &&
                !selectedReturn?.PhieuChi && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onCreatePaymentSlip(selectedReturn);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Tạo phiếu chi
                  </Button>
                )}
              {selectedReturn?.TrangThai === 2 &&
                isAdmin &&
                selectedReturn?.PhieuChi && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onViewPaymentSlip(selectedReturn);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Xem phiếu chi
                  </Button>
                )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
