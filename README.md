# Stripe Checkout Integration

**Author:** Alberto Martin Monjas

---

## Overview

This project implements a simple end-to-end checkout flow using Stripe to process payments for a small e-commerce bookstore.

The goal of this exercise was to integrate Stripe into an existing application using recommended best practices, keeping the solution clean, secure and extensible.

The integration uses Stripe Payment Intents and Stripe Elements, with a clear separation between frontend and backend responsibilities.

---

## Customer Flow

The implemented flow allows a user to:

1. Select a book to purchase
2. Proceed to checkout
3. Enter payment details using Stripe Elements
4. Complete payment (using credit card or Amazon Pay)
5. View a confirmation page displaying:

   * Total charged amount
   * Payment Intent ID
   * Payment Status

---

## Architecture Overview

The integration follows a standard client → server → Stripe pattern.

```
Browser (Stripe Elements)
        ↓
Node.js / Express backend
        ↓
Stripe PaymentIntents API
```
## Arquitectura del pago con Stripe Elements + PaymentIntents

```mermaid
flowchart TD
    A[Browser<br>Frontend + Stripe.js + Payment Element]
    B[Node.js / Express Backend]
    C[Stripe<br>PaymentIntents.create]
    D[Stripe<br>confirmación directa]

    A -->|1. Crear PaymentIntent| B
    B -->|Stripe API| C
    C -->|devuelve client_secret| B
    B -->|client_secret| A
    A -->|2. stripe.confirmPayment| D

    style D fill:#f0f9ff,stroke:#0369a1,color:#1e40af


### Backend responsibilities

* Create Payment Intent securely using Stripe secret key
* Control amount and currency server-side
* Retrieve payment details after completion
* Render confirmation page with real payment data

### Frontend responsibilities

* Render checkout UI
* Request Payment Intent from backend
* Initialize Stripe Elements using client_secret
* Confirm payment securely with Stripe.js

This separation ensures sensitive operations remain server-side and no card data ever touches the backend (app.js)

---

## Why PaymentIntents

The PaymentIntent API was used because it represents Stripe’s recommended integration model for modern payments.

Benefits include:

* Built-in support for SCA and 3DS authentication
* Payment lifecycle tracking
* Prevention of duplicate charges
* Support for multiple payment methods
* Secure confirmation via client_secret

This approach is aligned with production Stripe integrations.

---

## Security Considerations

The implementation follows standard security practices:

* Secret key stored only in environment variables
* PaymentIntent created exclusively server-side
* Only client_secret exposed to frontend
* Stripe Elements handles all card data
* Backend never processes raw payment details

This keeps the integration within minimal PCI scope.

---

## Running the project locally

### 1. Install dependencies

```
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```
STRIPE_SECRET_KEY=sk_test_...
```

Publishable key is configured in the frontend.

### 3. Start server

```
npm start
```

Application runs at:

```
http://localhost:3000
```

---

## Testing payments

Use Stripe test card:

```
4242 4242 4242 4242  
Any future expiry date  
Any 3-digit CVC  
```

After successful payment, the confirmation page will display:

* Charged amount
* PaymentIntent ID
* Status

---

## Potential Production Enhancements

Given more time, this integration could be extended to better reflect a production-grade partner implementation:

### Webhooks

Add Stripe webhooks to handle asynchronous events:

* `payment_intent.succeeded`
* `payment_intent.payment_failed`
* refunds and disputes

This ensures backend systems remain source of truth rather than relying solely on redirects.

### Order persistence

Introduce a database to:

* store orders
* link PaymentIntent to order state
* support reconciliation and reporting

### Idempotency & reliability

* Use idempotency keys when creating PaymentIntents
* Add structured logging and error handling
* Improve retry handling

### Multi-currency & localization

* Dynamic currency selection
* Local payment methods
* Region-specific payment flows

### Partner-scale considerations

For larger partner integrations:

* modular payment service layer
* webhook event processing pipeline
* observability and alerting
* environment separation (test vs live)

---

## Summary

This implementation demonstrates a clean and extensible Stripe integration using PaymentIntents and Stripe Elements, following recommended patterns for secure and scalable payment processing.

The architecture is intentionally simple but structured to evolve toward a production-ready partner integration with webhook-driven event handling and persistent order management.

