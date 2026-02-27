# Stripe Checkout Integration

**Author:** Alberto Martin Monjas

---

## Overview

This project implements a simple end-to-end checkout flow using Stripe to process payments for a small e-commerce bookstore.

The goal of this exercise was to integrate Stripe into an existing application following recommended best practices, keeping the solution clean, secure and extensible.

The integration uses Stripe Payment Intents and Stripe Elements, with a clear separation between frontend and backend responsibilities.

---
## Running the project locally
This application is built using **Node.js** with the **Express** framework
#### 1. Install dependencies
```
npm install
```
#### 2. Configure environment variables
Create a `.env` file:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```
#### 3. Start server
```
npm start
```
Application runs at:
```
http://localhost:3000
```
## Testing payments
Use Stripe test card:
```
Number: 4242 4242 4242 4242  
Date: Any future date  
CVC: Any 3 digits  
```
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

## Architecture Overview (Stripe Elements + Payment Intents)

```mermaid
flowchart TD
    A["Frontend<br>(Stripe.js + Payment Element)"]
    B["Node.js / Express Backend"]
    S[Stripe]

    A -->|1. Create PaymentIntent| B
    B -->|Create PaymentIntent| S
    S -->|returns client_secret| B
    B -->|client_secret| A
    A -->|2. Confirm Payment| S

    style A fill:#e0f2fe,stroke:#0369a1
    style S fill:#f0f9ff,stroke:#0369a1,color:#1e40af
```

### Express Backend responsibilities

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

## How the solution works

1. The customer opens http://localhost:3000/ to view the index page and selects a book
2. The server handles `GET /checkout?item=<id>`, maps the item to a title + price in cents, and renders `views/checkout.hbs`
3. The checkout page loads Stripe.js, then calls `POST /create-payment-intent` with the amount
4. The backend `app.js`creates a PaymentIntent in Stripe and returns only `clientSecret`
5. The frontend initializes Stripe Elements with that `clientSecret`, mounts the Payment Element, and submits payment with `stripe.confirmPayment()` directly to Stripe’s backend once the customer enters their payment details
6. Stripe redirects to `/success?payment_intent=...`; the server retrieves that PaymentIntent and renders amount, PaymentIntent id, and status

## Which Stripe APIs are used

- **Stripe Node SDK** (`stripe` package) on the server to use [Payment Intents](https://docs.stripe.com/api/payment_intents)
  - `stripe.paymentIntents.create(...)` in `POST /create-payment-intent`.
  - `stripe.paymentIntents.retrieve(...)` in `GET /success`.
- **Stripe.js v3** on the client (`https://js.stripe.com/v3/`).
  - `Stripe(publishableKey)` to initialize.
  - `stripe.elements({ clientSecret })` + `elements.create("payment")` for the [Payment Element](https://docs.stripe.com/js/element).
  - `stripe.confirmPayment(...)` for payment confirmation and redirect handling.

---

## How I approached the problem

I approached this challenge by aligning the implementation with Stripe’s current best practices for custom payment integrations. Given the requirement to use the Stripe Payment Element instead of Checkout, I structured the solution around the Payment Intents API, which provides flexibility, strong authentication support (including SCA), and extensibility for future enhancements.

My approach was incremental and architecture-driven. I followed the steps below:

1. **Understand the existing app flow**  
   I reviewed the Express routes and Handlebars rendering flow first, so the Stripe integration matched the current structure and remained simple to maintain.

2. **Implement a backend endpoint for PaymentIntent creation**  
   I added `/create-payment-intent` using the Stripe Node SDK to create PaymentIntents and return the `client_secret` needed by Stripe.js.

3. **Integrate Payment Element on checkout**  
   On the checkout page, Stripe.js is initialized, the Payment Element is mounted, and payment confirmation is handled with `stripe.confirmPayment()`, which supports authentication flows like 3DS/SCA when required.

4. **Display real payment results**  
   After redirect, the app retrieves the PaymentIntent and renders real transaction details (amount, PaymentIntent ID, status) on the success page.

5. **Keep the design extensible**  
   The structure can be extended with webhook-driven fulfillment, subscriptions, persistent orders/customers, idempotency handling, and richer multi-product/multi-currency logic.

Overall, I focused on clarity, security, and alignment with Stripe’s recommended integration patterns while keeping the solution simple, maintainable, and easy to extend.

--- 
## What challenges did I face?

During the implementation, I faced several challenges:

#### 1. Understanding the Payment Intents lifecycle
A key step was understanding how the Payment Intents API works conceptually and how it fits into the overall payment flow. This includes the relationship between the backend-created PaymentIntent, the `client_secret`, and the frontend confirmation step using Stripe.js.

#### 2. Separating client and server responsibilities
A critical challenge was ensuring that sensitive operations (such as creating the PaymentIntent and defining the amount) were handled exclusively on the server side, while keeping the client responsible only for confirmation.

#### 3. Correctly integrating the Payment Element
Although the Payment Element abstracts much of the complexity of supporting multiple payment methods, it must be initialized with a client_secret created server-side. This meant structuring the request flow so that the frontend waits for the backend response before rendering the Element.

#### 4. Handling error scenarios
In this specific implementation, given the simplicity of the exercise, I did not implement a fully robust error-handling strategy for all possible failure scenarios (such as declined cards or authentication failures). However, working through the integration made it clear that comprehensive error handling is a critical part of any production-ready payments flow. In a real-world environment, I would invest further effort in expanding error handling, validating all possible PaymentIntent states.

#### 5. Designing for extensibility
Although the exercise is intentionally simple, I wanted to ensure the structure would support future enhancements. Balancing simplicity with extensibility required thoughtful architectural decisions.

Overall, the main challenge was not writing the integration itself, but ensuring it followed secure, scalable, and production-aligned design principles while remaining simple and easy to understand.

## Security Considerations

The implementation follows standard security practices:

* Secret keys stored only in environment variables
* PaymentIntent created exclusively server-side
* Only client_secret exposed to frontend
* Stripe Elements handles all card data
* Backend never processes raw payment details

This keeps the integration within minimal PCI scope. It would be responsibility of the implementer to review, validate, and ensure that all security requirements and compliance measures are properly met before deploying this solution to a production environment.

---

## Potential Enhancements

Given more time, this integration could be extended to better reflect a production implementation.



#### Webhooks

Add Stripe webhooks to handle asynchronous events:

* `payment_intent.succeeded`
* `payment_intent.payment_failed`
* refunds and disputes

This ensures backend systems remain source of truth rather than relying solely on redirects.

#### Order persistence

Introduce a database to:

* store orders
* link PaymentIntent to order state
* support reconciliation and reporting

#### Idempotency & reliability

* Use idempotency keys when creating PaymentIntents
* Add structured logging and error handling
* Improve retry handling

#### Multi-currency & localization

* Dynamic currency selection instead of supporting only USD
* Region-specific payment flows

#### Partner-scale considerations

For larger partner integrations:

* modular payment service layer
* webhook event processing pipeline
* observability and alerting
* environment separation (test vs live)

---

## Summary

This implementation provides a simple Stripe integration using PaymentIntents and the Payment Element, following Stripe’s recommended patterns for secure payment processing.
<<<<<<< HEAD
=======

The architecture is intentionally lightweight and focused on clarity. While it is not production-ready, it is structured in a way that could be extended to support more robust features such as webhook-based event handling, improved error management, and persistent order storage.
>>>>>>> d0bd8e5 (Sync local changes)

The architecture is intentionally lightweight and focused on clarity. While it is not production-ready, it is structured in a way that could be extended to support more robust features such as webhook-based event handling, improved error management, and persistent order storage.
