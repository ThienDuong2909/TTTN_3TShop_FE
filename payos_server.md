const express = require('express');
const cors = require('cors');
const PayOS = require('@payos/node');

const app = express();
// Keep your PayOS key protected by including it by an env variable
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { PayOS } = require('@payos/node');

const app = express();
dotenv.config();
const payOS = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/create-payment-link', async (req, res) => {
  const YOUR_DOMAIN = `http://localhost:3000`;
  const body = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount: 2000,
    description: 'Thanh toan don hang',
    items: [
      {
        name: 'Mì tôm Hảo Hảo ly',
        quantity: 1,
        price: 2000,
      },
    ],
    returnUrl: `${YOUR_DOMAIN}?success=true`,
    cancelUrl: `${YOUR_DOMAIN}?canceled=true`,
  };

  try {
    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    res.redirect(paymentLinkResponse.checkoutUrl);
  } catch (error) {
    console.error(error);
    res.send('Something went error');
  }
});

app.listen(3030, function () {
  console.log(`Server is listening on port 3030`);
});