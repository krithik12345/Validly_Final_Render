// server.js
// ─────────────────────────────────────────────────────────────────────────────
// Your existing imports
const express        = require('express');
const mongoose       = require('mongoose');
const cors           = require('cors');
const bodyParser     = require('body-parser');
const session        = require('cookie-session');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://www.validlyapp.com",
  "https://validly-final-render.onrender.com",   // optional, keep if you test directly
  "https://validly-final-render-1.onrender.com" // optional, keep if you test directly
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);


// 2) Session: store OAuth tokens in a signed, httpOnly cookie
app.use(session({
  name: 'auth-session',
  keys: [ process.env.SESSION_SECRET || 'dev_secret' ],
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // only secure in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // cross-site cookie in production
  // Note: domain is intentionally not set for cross-origin compatibility
}));

// 3) Body parsing (skip Stripe/webhook if you have one)
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') next();
  else bodyParser.json()(req, res, next);
});

// 4) Your existing DB + other routes
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(console.error);

const chatRoute   = require('./routes/chat');
const patentRoute = require('./routes/fetchPatents');
const surveyRoute = require('./routes/createSurvey');  // ← popup OAuth here
const deleteUser  = require('./routes/deleteUser');

app.use('/api', chatRoute);
app.use('/patents', patentRoute);
app.use('/survey', surveyRoute);     // ← serves /auth, /oauth2callback, POST /
app.use('/api/delete-user', deleteUser);




app.get('/subscribe', async (req, res) => {
  // check if the user is subscribed to pro plan
  const plan = req.query.plan
  const email = req.query.email

  if (!plan) {
    return res.send('Subscription plan not found')
  }

  if (!email) {
    return res.send('Email is required')
  }

  // Check if customer already exists with this email
  try {
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      
      // Check if customer has active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        // Customer has active subscription, redirect to customer dashboard
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customer.id,
          return_url: `${process.env.BASE_URL}/pricing`
        });
        
        return res.redirect(portalSession.url);
      }
    }
  } catch (error) {
    console.error('Error checking existing customer:', error);
    return res.status(500).send('Error checking customer status');
  }

  let priceId

  switch (plan.toLowerCase()) {
    case 'pro_monthly':
      priceId = 'price_1RddHdQxM6zDFL0HZBUlXdpv';
      break;

    case 'pro_yearly':
      priceId = 'price_1Rdl4uQxM6zDFL0H2yOUPUed';
      break;



    default:
      return res.send('Subscription plan not found')
  }
   
  const sessionConfig = {
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    //success_url: `${process.env.BACKEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    success_url: `${process.env.BASE_URL}/profile`,
    cancel_url: `${process.env.BASE_URL}/pricing`
  }

  // If email is provided (which should always be the case), add it to the session configuration
  if (email) {
    // customer_email is used to pre-fill the email field in the checkout page
    sessionConfig.customer_email = email
    // Setting billing_address_collection to 'auto' makes the email field non-editable in the checkout page
    sessionConfig.billing_address_collection = 'auto'
  }

  if (req.query.user_id) {
    sessionConfig.metadata = {
      user_id: req.query.user_id // pass from frontend
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  res.redirect(session.url);
})






app.get('/success', async (req, res) => {
  // Future Reference: you can also access other cutomer properties from this object in case you want to store them in the supabase database.
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['subscription', 'subscription.plan.product']})

  console.log(JSON.stringify(session))

  //res.send('Subscribed successfully')
})






// Future Reference: I might consider adding a /cancel route to handle the case where the user cancels the subscription

// This route is used to get the customer id based on the user's email
app.get('/get-customer-id', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No customer found with this email' });
    }

    const customer = customers.data[0];

    // Check if customer has active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    res.json({
      customerId: customer.id,
      hasActiveSubscription: subscriptions.data.length > 0
    });
  } catch (error) {
    console.error('Error getting customer ID:', error);
    res.status(500).json({ error: 'Error getting customer information' });
  }
})






app.get('/customers/:customerId', async (req, res) => {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: req.params.customerId,
    return_url: `${process.env.BACKEND_URL}/`
  })

  res.redirect(portalSession.url)
})




function getPlan(productId){
  switch (productId) {
    case 'prod_SYknpEzXHNaC6J':
      return 'pro';
    default:
      return 'free';
  }
}

app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Universal Function to update the user's Supabase profile with their customer data (can be used in any webhook event)
  async function updateSupabaseProfile(){
    let customerId, email, subscriptionId, productId, status;

    if (event.type === 'checkout.session.completed') {
      // For checkout.session.completed, the object is a session
      const session = event.data.object;
      customerId = session.customer;
      email = session.customer_email;
      subscriptionId = session.subscription;
    } else if (event.type === 'customer.subscription.updated' || 
               event.type === 'customer.subscription.deleted' ||
               event.type === 'customer.subscription.created') {
      // For subscription events, the object is the subscription itself
      const subscription = event.data.object;
      customerId = subscription.customer;
      subscriptionId = subscription.id;
      
      // We need to get the customer email from Stripe since it's not in the subscription object
      const customer = await stripe.customers.retrieve(customerId);
      email = customer.email;
    } else if (event.type === 'invoice.paid' || 
               event.type === 'invoice.payment_failed' ||
               event.type === 'invoice.payment_action_required') {
      // For invoice events, we need to get the subscription from the invoice
      const invoice = event.data.object;
      subscriptionId = invoice.subscription;
      
      if (!subscriptionId) {
        throw new Error('No subscription found in invoice event');
      }
      
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      customerId = subscription.customer;
      
      // Get customer email
      const customer = await stripe.customers.retrieve(customerId);
      email = customer.email;
    } else {
      throw new Error(`Unsupported event type: ${event.type}`);
    }

    // Retrieve full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    productId = subscription.items.data[0]?.price?.product;
    status = subscription.status;
    //const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString(); // Convert from Unix timestamp

    // Grouping the customer data together into an object
    const updates = {
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      plan: getPlan(productId),
      subscription_status: status,
      //billing_period_end: currentPeriodEnd,
    };

    // Updating the user's supabase profile with their customer data
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('email', email);

    if (error) throw error;
  }

  // Handle the event
  switch (event.type) {
    // Event when the subscription started
    case 'checkout.session.completed':
      console.log('New subscription started!');
      console.log(event.data);

      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription successfully saved.');

      break;

    // Event when the payment is successful (every subscription interval)
    case 'invoice.paid':
      console.log('Invoice paid');
      console.log(event.data);
      
      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription status updated after payment.');

      break;

    // Event when the payment failed due to card problems or insufficient funds (every subscription interval)
    case 'invoice.payment_failed':
      console.log('Invoice payment failed');
      console.log(event.data);
      
      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription status updated after payment failure.');

      break;

    // Event when payment requires additional action
    case 'invoice.payment_action_required':
      console.log('Invoice payment action required');
      console.log(event.data);
      
      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription status updated after payment action required.');

      break;

    // Event when subscription is created
    case 'customer.subscription.created':
      console.log('Subscription created!');
      console.log(event.data);

      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription successfully saved.');

      break;

    // Event when subscription is updated
    case 'customer.subscription.updated':
      console.log('Subscription updated!');
      console.log(event.data);

      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription successfully saved.');

      break;

    // Event when subscription is deleted/cancelled
    case 'customer.subscription.deleted':
      console.log('Subscription deleted!');
      console.log(event.data);

      // Update the user's subscription status in Supabase
      await updateSupabaseProfile();
      console.log('Subscription deletion recorded.');

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  // Return a 200 response to acknowledge receipt of the event
  res.send();
});
  
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));