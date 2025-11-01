import { Download, Image, X } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";

interface DeliveryImageProps {
  showProofImageModal: boolean;
  imageURL?: string | null;
  setShowProofImageModal: (value: boolean) => void;
  handleDownloadProofImage: () => void;
}
export const DeliveryImage = ({
  showProofImageModal,
  imageURL,
  setShowProofImageModal,
  handleDownloadProofImage,
}: DeliveryImageProps) => {
  return (
    <Dialog open={showProofImageModal} onOpenChange={setShowProofImageModal}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-0 shadow-none">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleDownloadProofImage}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Tải xuống"
            title="Tải xuống hình ảnh"
          >
            <Download className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowProofImageModal(false)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            aria-label="Đóng"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {imageURL ? (
          <img
            src={imageURL}
            alt="Hình minh chứng giao hàng"
            className="w-full h-auto max-h-[95vh] object-contain rounded-lg cursor-pointer"
            onClick={() => setShowProofImageModal(false)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "";
              target.alt = "Không thể tải hình ảnh";
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-900/80 rounded-lg">
            <div className="text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300">Không có hình ảnh minh chứng</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
