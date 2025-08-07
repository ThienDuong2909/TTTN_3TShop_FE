import React from "react";
import { MultiProductReviewDialog } from "./MultiProductReviewDialog";
import { ViewReviewsDialog } from "./ViewReviewsDialog";
import { ReturnRequestDialog } from "./ReturnRequestDialog";
import { CancelOrderDialog } from "./CancelOrderDialog";

interface OrderDialogsContainerProps {
  // Review Dialog Props
  reviewDialog: {
    isOpen: boolean;
    productsToReview: any[];
  };
  setReviewDialog: (state: {
    isOpen: boolean;
    productsToReview: any[];
  }) => void;
  onReviewSubmitted: () => void;

  // View Reviews Dialog Props
  viewReviewsDialog: {
    isOpen: boolean;
    reviews: any[];
    orderCode: string;
  };
  setViewReviewsDialog: (state: {
    isOpen: boolean;
    reviews: any[];
    orderCode: string;
  }) => void;

  // Return Request Dialog Props
  returnRequestDialog: {
    isOpen: boolean;
    order: any;
  };
  setReturnRequestDialog: (state: { isOpen: boolean; order: any }) => void;
  onReturnRequested: () => void;

  // Cancel Order Dialog Props
  showCancelModal: boolean;
  closeCancelModal: () => void;
  selectedOrder: any;
  confirmCancelOrder: () => void;
  cancelLoading: boolean;
}

export const OrderDialogsContainer: React.FC<OrderDialogsContainerProps> = ({
  reviewDialog,
  setReviewDialog,
  onReviewSubmitted,
  viewReviewsDialog,
  setViewReviewsDialog,
  returnRequestDialog,
  setReturnRequestDialog,
  onReturnRequested,
  showCancelModal,
  closeCancelModal,
  selectedOrder,
  confirmCancelOrder,
  cancelLoading,
}) => {
  return (
    <>
      {/* Review Dialog */}
      <MultiProductReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={() => setReviewDialog({ isOpen: false, productsToReview: [] })}
        productsToReview={reviewDialog.productsToReview}
        onReviewSubmitted={onReviewSubmitted}
      />

      {/* View Reviews Dialog */}
      <ViewReviewsDialog
        isOpen={viewReviewsDialog.isOpen}
        onClose={() =>
          setViewReviewsDialog({ isOpen: false, reviews: [], orderCode: "" })
        }
        reviews={viewReviewsDialog.reviews}
        orderCode={viewReviewsDialog.orderCode}
      />

      {/* Return Request Dialog */}
      <ReturnRequestDialog
        isOpen={returnRequestDialog.isOpen}
        onClose={() => setReturnRequestDialog({ isOpen: false, order: null })}
        order={returnRequestDialog.order}
        onReturnRequested={onReturnRequested}
      />

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        isOpen={showCancelModal}
        onClose={closeCancelModal}
        selectedOrder={selectedOrder}
        onConfirm={confirmCancelOrder}
        loading={cancelLoading}
      />
    </>
  );
};

export default OrderDialogsContainer;
