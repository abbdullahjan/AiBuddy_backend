
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Stripe backend is running!'
  });
});

app.get('/stripe-check', async (req, res) => {
  try {
    const account = await stripe.accounts.retrieve();

    res.json({
      status: 'OK',
      message: 'Connected to Stripe successfully!',
      accountId: account.id
    });
  } catch (error) {
    console.error('Stripe connection failed:', error.message);

    res.status(500).json({
      status: 'ERROR',
      message: 'Could not connect to Stripe.'
    });
  }
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 50000,
      currency: 'pkr',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('PaymentIntent creation failed:', error.message);

    res.status(500).json({
      error: 'Unable to create payment intent.',
    });
  }
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Study Buddy Premium Pack',
              description: 'Premium AI-generated study content',
            },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      success_url:
  'http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}',

cancel_url:
  'http://localhost:3000/payment-cancelled',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout Session creation failed:', error.message);

    res.status(500).json({
      error: 'Unable to create Checkout Session.',
    });
  }
});

app.get('/payment-success', async (req, res) => {
  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).send('Missing checkout session ID.');
  }

  try {
    // Verify the payment directly with Stripe.
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return res.send(`
        <h1>Payment Successful!</h1>
        <p>Your premium pack test payment is confirmed.</p>
        <p>You can close this page.</p>
      `);
    }

    return res.send(`
      <h1>Payment Not Confirmed</h1>
      <p>Status: ${session.payment_status}</p>
    `);
  } catch (error) {
    console.error('Payment verification error:', error.message);
    return res.status(500).send('Could not verify the payment.');
  }
});

app.get('/payment-cancelled', (req, res) => {
  res.send('<h1>Payment Cancelled</h1><p>No purchase was completed.</p>');
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
