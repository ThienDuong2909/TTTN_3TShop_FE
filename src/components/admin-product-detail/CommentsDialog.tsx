import React from "react";
import { MessageSquare, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Comment {
  MaBL: number;
  MoTa: string;
  SoSao: number;
  NgayBinhLuan: string;
  MaKH: number;
  TenKH: string;
  MaKichThuoc: number;
  MaMau: number;
  TenKichThuoc: string;
  TenMau: string;
  MaHex: string;
}

interface CommentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  averageRating?: string;
  totalComments?: number;
  comments?: Comment[];
}

export const CommentsDialog: React.FC<CommentsDialogProps> = ({
  isOpen,
  onClose,
  productName,
  averageRating,
  totalComments = 0,
  comments,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-[#825B32]">
            <MessageSquare className="w-5 h-5 mr-2" />
            Bình luận và đánh giá sản phẩm
          </DialogTitle>
          <DialogDescription>
            Danh sách tất cả bình luận và đánh giá của khách hàng cho sản phẩm{" "}
            {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rating Summary */}
          <div className="bg-gradient-to-r from-[#825B32]/5 to-[#825B32]/10 rounded-lg p-4 border border-[#825B32]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#825B32]">
                    {averageRating
                      ? parseFloat(averageRating).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="flex justify-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(parseFloat(averageRating || "0"))
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalComments} đánh giá
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Tổng quan đánh giá</p>
                <div className="space-y-1 mt-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      comments?.filter((comment) => comment.SoSao === star)
                        .length || 0;
                    const percentage = comments?.length
                      ? (count / comments.length) * 100
                      : 0;
                    return (
                      <div
                        key={star}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <span className="w-8">{star} ⭐</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="w-8 text-gray-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments
                .sort(
                  (a, b) =>
                    new Date(b.NgayBinhLuan).getTime() -
                    new Date(a.NgayBinhLuan).getTime()
                )
                .map((comment) => (
                  <div
                    key={comment.MaBL}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#825B32] to-[#825B32]/80 rounded-full flex items-center justify-center text-white font-semibold">
                            {comment.TenKH.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {comment.TenKH}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < comment.SoSao
                                        ? "text-yellow-500 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  comment.NgayBinhLuan
                                ).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {comment.MoTa}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">
                            Phiên bản đã mua:
                          </p>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: comment.MaHex,
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {comment.TenKichThuoc} - {comment.TenMau}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge
                          className={`text-xs ${
                            comment.SoSao >= 4
                              ? "bg-green-100 text-green-800"
                              : comment.SoSao >= 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {comment.SoSao}/5 ⭐
                        </Badge>
                        <span className="text-xs text-gray-500">
                          #{comment.MaBL}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có bình luận
                </h3>
                <p className="text-gray-500 text-sm">
                  Sản phẩm này chưa có bình luận hoặc đánh giá từ khách hàng
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-[#825B32] border-[#825B32] hover:bg-[#825B32] hover:text-white"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
