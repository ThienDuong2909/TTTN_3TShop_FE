****payOS Checkout Script JS****

payOS cung cấp script-js hỗ trợ mở link thanh toán
Giới thiệu

Đây là thư viện dùng để hỗ trợ mở Pop up thanh toán trên trang web của bạn.

    Javascript
    ReactJS

Cài đặt

Cài đặt với npm

npm install payos-checkout --save

Cài đặt với yarn

yarn add payos-checkout

Sau đó nhập kiểu dữ liệu và hàm

import { usePayOS, PayOSConfig } from '@payos/payos-checkout';

Khởi tạo

const payOSConfig: PayOSConfig = {
  RETURN_URL: "", // required
  ELEMENT_ID: "", // required
  CHECKOUT_URL: "", // required
  embedded: true, // Nếu dùng giao diện nhúng
  onSuccess: (event: any) => {
    //TODO: Hành động sau khi người dùng thanh toán đơn hàng thành công
  },
  onCancel: (event: any) => {
    //TODO: Hành động sau khi người dùng Hủy đơn hàng
  },
  onExit: (event: any) => {
    //TODO: Hành động sau khi người dùng tắt Pop up
  },
};

Mô tả các thành phần của PayOSConfig:

    * RETURN_URL

    (String): Đây là đường dẫn tới trang web của bạn khi đơn hàng được thanh toán thành công

    * ELEMENT_ID

    (String): Đây là #id của thẻ div sẽ chứa iframe thanh toán

    * CHECKOUT_URL

    (String): Đây là đường dẫn tới trang thanh toán mà chúng tôi sẽ mở nó bằng iframe

    embedded (boolean): false nếu dùng pop up thanh toán, true nếu dùng giao diện nhúng.

    onSuccess (Callback): Sẽ được gọi sau khi đơn hàng được thanh toán thành công.

    onCancel (Callback): Sẽ được gọi sau khi người dùng "Hủy thanh toán".

    onExit (Callback): Sẽ được gọi sau khi người dùng bấm thoát khỏi Pop Up thanh toán (Bấm biểu tượng "X" trên iframe).

    event (Object): Đây là một object sẽ chứa những thông tin thêm nhận được từ payOS khi người dùng thực hiện các hành động onSucess, onCancel, onExit.

Lưu ý

RETURN_URL phải trùng với đường dẫn hiển thị iframe thanh toán.

Mô tả các thuộc tính có trong event:

    loading: có giá trị false nếu luồng thực thi đã kết thúc.
    code: mã code phản hồi. Tập giá trị:
        00: SUCCESS
        01: FAILED
        02: INVALID_PARAM
    id: paymentLinkId. Cí dụ: cb62d25884c7463cbabd2997b4c03af9
    cancel: Có giá trị true khi huỷ đơn hàng và false khi thanh toán đơn hàng
    orderCode: Mã đơn hàng
    status: Có giá trị CANCELLED hoặc PAID mô tả cho đơn hàng đã bị huỷ hay đã được thanh toán

{
  loading: boolean;
  code: string;
  id: string;
  cancel: string;
  orderCode: number;
  status: string;
}

Cách sử dụng

usePayOS chấp nhận một đối số là Object có kiểu dữ liệu PayOSConfig như đã mô tả ở phần trên, và trả về một Object gồm 2 hàm có tên là open và exit.

const { open, exit } = usePayOS(payOSConfig);

open();

Thông tin về các hàm:

    open() (void): Sau khi hàm này được thực thi, Pop up hoặc giao diện nhúng sẽ được thêm vào trang web.
    exit() (void): Sau khi hàm này được thực thi, Pop up sẽ được tắt ngay lập tức
