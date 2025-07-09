# ADR-004: QR Code Ticket Delivery via Email

**Date:** 2024-02-01  
**Status:** Accepted

---

## Context

After a successful Razorpay payment, users need a verifiable ticket for museum entry. The ticket must be tamper-resistant (or at least difficult to forge) and presentable at the museum entrance without requiring app access.

---

## Problem

How should the system deliver booking confirmation and provide a verifiable entry credential that museum staff can validate without an internet-dependent lookup?

---

## Proposed Solution

After booking creation, the client calls `POST /sendEmail` with booking metadata. The server:
1. Generates a QR code image containing booking details (museum name, date, count, booking ID)
2. Attaches the QR PNG to a formatted confirmation email
3. Delivers the email via Nodemailer + Gmail SMTP

QR code data structure:
```
Museum: <museum_name>
Tickets: <count>
Date: <date>
BookingId: <mongo_objectid>
```

Museum staff scan the QR code to read booking details directly from the encoded data.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| PDF ticket | Professional appearance | Heavy dependency, slow generation |
| QR code email ✓ | Lightweight, scannable, email-native | QR not cryptographically signed |
| SMS delivery | Accessible without email | SMS gateway cost, delivery unreliability |
| In-app ticket only | No email cost | Requires app at entry; poor offline UX |
| Signed JWT in QR | Cryptographically verifiable | More complex; overkill for museum entry |

---

## Current Implementation Limitations

1. **QR data is not signed** — the QR content can be manually crafted. A motivated attacker could generate a fake booking ID and forge a ticket.
2. **Email is synchronous** — the booking endpoint blocks until email delivery completes. If SMTP fails, the booking appears to fail from the user's perspective even though the booking was saved.
3. **QR file written to disk** — generated to `os.tmpdir()` per booking ID; no cleanup mechanism.

---

## Future Improvements

### Signed QR (JWT-in-QR)
Encode a signed JWT inside the QR code:
```js
const payload = { bookingId, museumId, date, count };
const signed = jwt.sign(payload, process.env.TICKET_SECRET, { expiresIn: '1y' });
// encode `signed` as the QR data
```
Staff app verifies the JWT signature before accepting the ticket.

### Asynchronous Email (Event-Driven)
Move email sending out of the HTTP request cycle:
1. Booking endpoint saves booking and publishes `booking.confirmed` event to a queue (Redis Streams, BullMQ, or RabbitMQ)
2. Separate email worker consumes the event and sends the email
3. Eliminates SMTP latency from booking response time (~300-800ms savings)

---

## Tradeoffs

**Wins:**
- Zero external queue infrastructure needed for current scale
- QR contains enough human-readable data that staff can manually verify without scanning
- Email confirmation provides a paper trail for users

**Costs:**
- No cryptographic verification of ticket authenticity
- Synchronous email blocks the booking confirmation response
- Gmail SMTP has a 500 emails/day limit; not suitable for high-volume deployments

---

## Consequences

- QR generation writes to `os.tmpdir()` — safe for serverless/container environments but needs periodic cleanup in persistent deployments
- Gmail SMTP credentials must be rotated before production; consider SendGrid or AWS SES for reliability
- Email failure should not fail a completed booking — error must be caught and logged, not propagated to user

---

## Interview Talking Points

**Q: How would you make ticket validation fraud-resistant?**  
A: Encode a HMAC-signed JWT inside the QR code. When a visitor presents the QR, the museum's scanner app verifies the JWT signature against a shared secret. This prevents QR forgery without requiring a database lookup. For high-security environments, add a one-time use flag in a Redis set: mark bookingId as "used" on first scan, reject duplicates.

**Q: Why call a separate /sendEmail endpoint from the client instead of triggering email from the booking controller?**  
A: This is a design debt from the original implementation. Ideally the booking controller emits a `booking.created` event internally, and an email service handles it asynchronously. The separate endpoint was originally needed because the frontend sends additional data (price) that's not stored in the booking. In production, all required data would be in the booking document and email would be triggered server-side.

**Q: How would you scale email delivery beyond Gmail's 500/day limit?**  
A: Replace the Nodemailer SMTP transport with a transactional email provider (SendGrid, AWS SES, Mailgun) which offer 10,000+ free emails/month, delivery tracking, bounce/complaint webhooks, and compliance with CAN-SPAM/GDPR. Wire it through an environment variable (`EMAIL_PROVIDER=sendgrid`) to avoid code changes when switching.
