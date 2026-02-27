const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering";
      amount = 2300;
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993";
      amount = 2500;
      break;
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source";
      amount = 2800;
      break;
    default:
      error = "No item selected";
      break;
  }

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/**
 * Create PaymentIntent
 */
app.post('/create-payment-intent', async (req, res) => {
  try {
    const amount = req.body.amount;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

/**
 * Success route
 */
app.get('/success', async function(req, res) {
  try {
    const paymentIntentId = req.query.payment_intent;

    if (!paymentIntentId) {
      return res.render('success', {
        error: "PaymentIntent not found"
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.render('success', {
      amount: paymentIntent.amount / 100,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });

  } catch (err) {
    console.error(err);
    res.render('success', {
      error: err.message
    });
  }
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});
