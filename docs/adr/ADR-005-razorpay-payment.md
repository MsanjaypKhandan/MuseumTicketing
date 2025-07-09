# ADR-005: Razorpay Client-Side Payment Integration

**Date:** 2024-02-05  
**Status:** Accepted (with noted limitations)

---

## Context

Museum ticket purchases require a payment step before booking confirmation. The system needs a payment gateway that is widely used in India, developer-friendly, and integrates with a React frontend.

---

## Problem

How should payments be integrated — client-side only, server-side order creation, or fully server-verified?

---

## Proposed Solution

**Current implementation (MVP):** Client-side-only Razorpay integration using the Razorpay Checkout.js SDK. The frontend initiates the payment modal, and on success calls the booking and email APIs directly.

```js
// Booking.js (frontend)
const options = {
  key: "rzp_test_N1ymzTgUJXDCwr",
  amount: museum.price * ticketCount * 100,  // paise
  currency: "INR",
  handler: async (response) => {
    // On success: create booking, send email
    const bookingData = await newBooking({ museum, date, count });
    await sendEmail({ ...bookingData, price: museum.price });
  }
};
const rzp = new window.Razorpay(options);
rzp.open();
```

---

## Critical Security Issue

**The current implementation has no payment verification.** A technically skilled user can:
1. Open browser DevTools
2. Skip the Razorpay modal entirely
3. Directly call `POST /booking` to create a free booking

**This is a known limitation for the MVP.** All Razorpay keys are test keys and no real money is involved.

---

## Production-Grade Fix: Server-Side Order Verification

The correct implementation requires three steps:

**Step 1: Server creates an order**
```js
// POST /payment/create-order
const order = await razorpay.orders.create({
  amount: museum.price * count * 100,
  currency: "INR",
  receipt: `booking_${userId}_${Date.now()}`,
});
```

**Step 2: Client completes payment using order ID**
```js
const options = {
  order_id: order.id,
  handler: (response) => {
    // Send payment_id + order_id + signature to server for verification
    verifyPayment(response);
  }
};
```

**Step 3: Server verifies the payment signature**
```js
// POST /payment/verify
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");

if (expectedSignature !== receivedSignature) {
  return res.status(400).json({ message: "Payment verification failed" });
}
// Only then create the booking
```

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Stripe | Excellent docs, global | Limited India UPI/bank support |
| PayU | Popular in India | Less developer-friendly SDK |
| Razorpay ✓ | India-native, free test mode, good SDK | Requires server verification for production |
| Cash on entry | No integration needed | No online booking UX |

---

## Tradeoffs

**Current (MVP) Wins:**
- Zero backend payment code
- Works immediately with test keys
- No Razorpay account required for development

**Current Costs:**
- No payment verification — bookings can be created without paying
- Razorpay test keys exposed in frontend source code (visible to anyone)

---

## Consequences

- **Do not go live with current implementation.** Replace client-side-only flow with server-side order creation + signature verification before accepting real payments
- Move `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to environment variables; never expose the secret in frontend code
- Add a `paymentId` field to the Booking model to store Razorpay payment reference for dispute resolution

---

## Interview Talking Points

**Q: What's wrong with the current payment implementation?**  
A: The booking endpoint has no payment verification. A user can call `POST /booking` directly without paying, bypassing Razorpay entirely. The fix is server-side payment signature verification using HMAC-SHA256 with the Razorpay key secret. Only after successful verification should the booking be created.

**Q: How would you prevent duplicate bookings on payment retry?**  
A: Store the Razorpay `order_id` in the Booking document with a unique index. On retry, the duplicate order_id causes a MongoDB unique index violation, which the server catches and returns "booking already exists." The client can then fetch the existing booking rather than creating a new one.

**Q: How would you handle refunds?**  
A: Add a `status` field to Booking (confirmed/cancelled/refunded). On cancellation, call `razorpay.payments.refund(paymentId, { amount })` from the server, update booking status, and notify the user by email. Store the refund ID in the booking document for traceability.
