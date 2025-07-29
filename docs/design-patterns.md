# Design Patterns & System Design — Museum Ticketing System

This document describes the design patterns and system-design concepts **actually implemented in the code** (not aspirational). Every pattern below points at real files you can open.

---

## Architecture at a Glance

```
HTTP  ──▶  Routes ──▶ Controllers ──▶ Services ──▶ Models (MongoDB)
                          (thin)        (domain logic)
                                           │
                                           ├── writes business row + Outbox row (one txn)
                                           ▼
                                     OutboxEvent ──▶ Dispatcher ──▶ Event Bus
                                                                       │ (pub/sub)
                                              ┌────────────────────────┼───────────────┐
                                              ▼                        ▼               ▼
                                      NotificationSubscriber   WaitlistSubscriber   (future: SMS, analytics)
```

Layered, event-driven modular monolith. The synchronous request path stays fast; everything reactive (notifications, waitlist promotion) happens off the event bus.

---

## 1. Layered Architecture / Separation of Concerns

**Where:** `routes/` → `controllers/` → `services/` → `models/`

Controllers are thin HTTP adapters — they parse the request, call a service, and map the result (or a thrown error with a `.status`) to a response. All domain logic lives in `services/`, so it is unit-testable without HTTP and reusable across entry points.

**Proof of reuse:** `bookingService.createBooking()` is called by both the booking controller (`POST /booking`) **and** the waitlist promotion path (`waitlistService.promoteNextForSlot`). One implementation, two callers.

```
controllers/booking-controller.js   → 40 lines, no business logic
services/bookingService.js          → transactions, capacity, events
```

**Interview line:** "Thin controllers, fat services. The controller knows HTTP; the service knows the domain. That boundary is why I can unit-test booking logic without spinning up Express."

---

## 2. Ports and Adapters (Hexagonal) — Event Bus & Cache

**Where:** `events/eventBus.js`, `cache/cache.js`

The domain depends on an **interface**, not a transport:

- `eventBus.publish() / subscribe()` is the port. Today's adapter is `InMemoryEventBus` (Node `EventEmitter`). Moving to RabbitMQ/Kafka/Redis Streams means writing a new adapter with the same two methods — **zero changes** to services or subscribers.
- `cache.get/set/del/delByPrefix` is the port. Today's adapter is an in-memory `Map` with TTL. Swapping to Redis (`ioredis`) is a drop-in.

**Interview line:** "I used Ports and Adapters so the in-memory event bus and cache are swappable for RabbitMQ and Redis without touching domain code. The decision to scale infra is deferred without incurring rewrite cost."

---

## 3. Publish/Subscribe + Observer — Event-Driven Core

**Where:** `events/`, `services/*` publish; `events/subscribers/*` consume

Services publish **facts** about what happened (`booking.confirmed`, `booking.cancelled`, `waitlist.promoted`). Subscribers decide what to **do** about them. The booking service has no idea notifications or waitlists exist — it just announces facts.

**Why it matters:** Adding SMS notifications later = add a handler in `notificationSubscriber.js`. Adding an analytics projection = add a new subscriber. Producers never change. This is the Open/Closed Principle in action.

```
BOOKING_CANCELLED ─┬─▶ NotificationSubscriber  (tell the user)
                   └─▶ WaitlistSubscriber      (promote next in line)
```

One event, two independent reactions — fan-out.

---

## 4. Transactional Outbox — Reliable Event Delivery

**Where:** `models/OutboxEvent.js`, `services/bookingService.js`, `events/dispatcher.js`

**The problem it solves (dual-write):** You cannot atomically "commit a booking to MongoDB" and "publish an event to a broker" — they're two systems. A crash in between loses the event.

**The implementation:** The event row is written to the `outbox` collection **inside the same transaction** as the booking. Either both commit or neither does. A separate dispatcher then reads pending rows and publishes them, marking each published.

```js
await session.withTransaction(async () => {
  await Booking.create([...], { session });
  await OutboxEvent.create([{ type: "booking.confirmed", payload }], { session }); // same txn
});
drainOutbox(); // publish after commit; poller is the backstop
```

**Delivery guarantee:** at-least-once. Consumers are written to tolerate duplicate delivery (idempotency).

**Interview line:** "I used the transactional outbox pattern to solve the dual-write problem. The event and the business row commit atomically, so we never confirm a booking without eventually delivering its notification — even if the process crashes right after commit."

---

## 5. Atomic Concurrency Control — Overbooking Prevention

**Where:** `services/slotService.js` (`reserveCapacity`), `services/bookingService.js`

The single most important correctness property: **a 10-seat slot can never sell 11 seats**, even under a thundering herd of simultaneous bookings.

The capacity check lives **in the query filter**, so check-and-decrement is one atomic document update:

```js
Slot.findOneAndUpdate(
  { _id: slotId, $expr: { $lte: [{ $add: ["$booked", count] }, "$capacity"] } },
  { $inc: { booked: count } },
  { new: true, session }
);
```

If two requests race for the last seats, MongoDB serializes the document writes — one matches the filter and succeeds, the other matches nothing and returns `null` → `409 SLOT_FULL`. **No read-then-write race window.**

This is wrapped in `session.withTransaction()` (`config/db.js`), which auto-retries on transient write conflicts — the textbook optimistic-concurrency retry loop.

**Proven by:** `__tests__/booking.integration.test.js` fires 15 concurrent bookings at a 10-seat slot and asserts exactly 10 succeed and `slot.booked === 10`.

**Interview line:** "Overbooking prevention is an atomic check-and-decrement — the capacity guard is in the update's query filter, so MongoDB serializes contending writes on that single document. There's no window where two readers both see availability."

---

## 6. Saga / Compensating Action — Waitlist Promotion

**Where:** `services/waitlistService.js` (`promoteNextForSlot`)

When a booking is cancelled, freed capacity triggers promotion of the oldest waitlist entry (FIFO). Promotion reuses the **same atomic reserve guard**, so it's safe against a fresh booking grabbing the freed seat concurrently — whoever loses the atomic update simply isn't promoted this round, and the entry stays waiting for the next opening.

Each promotion is its own transaction: reserve capacity + flip waitlist status + create booking + write outbox event, all-or-nothing.

**Interview line:** "Promotion is event-triggered and idempotent-safe. It competes for the freed seat using the exact same atomic guard as a normal booking, so there's no special-case race between 'new booking' and 'waitlist promotion'."

---

## 7. Idempotency / One-Time-Use — Ticket Verification

**Where:** `services/ticketService.js` (`verifyAndConsumeTicket`), `utils/ticket.js`

Two-layer gate at the museum entrance:

1. **Authenticity (stateless):** the QR encodes a JWT signed with `TICKET_SECRET`. The scanner verifies the signature offline — a forged QR with a made-up booking id fails signature verification, no DB needed.
2. **One-time use (atomic):** consumption is a conditional update — `findOneAndUpdate({ _id, usedAt: null }, { $set: { usedAt: now } })`. The first scan stamps `usedAt`; a second simultaneous scan matches nothing (because `usedAt` is no longer null) and is rejected. Same atomic check-and-set primitive as capacity reservation.

**Proven by:** unit test (`ticketService.test.js`) asserts the conditional-update shape and the second-scan rejection; integration test verifies a real double-scan.

---

## 8. Cache-Aside (Lazy Loading) + Stampede Mitigation

**Where:** `cache/cache.js`, `controllers/museum-controller.js`

Museum listings are read-heavy and change rarely — ideal cache candidates.

- **Read:** try cache → on miss, load from Mongo and populate (`getAllMuseums`).
- **Write:** `addMuseum` / `updateMuseum` / `deleteMuseum` call `delByPrefix("museums:")` — **invalidate-on-write**, not update-on-write, so the cache can never hold a structurally stale value.
- **Stampede mitigation:** TTL gets up-to-10% jitter so a popular key's expiry doesn't cause a synchronized cache-miss thundering herd.

**Interview line:** "Cache-aside with invalidate-on-write. I delete rather than update the cache entry on a museum change because deletion is simpler to reason about — the next read repopulates from the source of truth."

---

## 9. Sliding-Window Rate Limiting

**Where:** `middleware/rateLimiter.js`

Applied to credential endpoints (`/user/login`, `/admin/login`, signup) and booking creation. Stores per-client request timestamps and drops those outside the window on each check — a true sliding window, not a fixed bucket that resets on a hard boundary (which would allow a 2× burst across the seam).

State is in-process now; the same algorithm maps to Redis sorted sets (`ZADD` / `ZREMRANGEBYSCORE` / `ZCARD`) for cluster-wide enforcement.

---

## 10. CQRS-lite — Read Models via Aggregation

**Where:** `services/analyticsService.js`

The admin analytics endpoint never loads raw documents into Node to loop over them. It pushes computation into MongoDB **aggregation pipelines**:

- `slotOccupancy` — projects `booked/capacity` per slot in the database.
- `museumSummary` — `$lookup` joins bookings to museum price and sums `count * price` for revenue, all server-side.
- `peakTimes` — `$group` buckets ticket volume by slot start time.

This separates the write model (normalized bookings/slots) from purpose-built read queries — the seed of CQRS.

---

## 11. Fail-Fast Configuration & Graceful Isolation

- **Fail-fast:** `config/db.js` exits with code 1 if `MONGODB_URI` is missing or the DB is unreachable — an orchestrator restarts a misconfigured instance rather than serving 500s.
- **Failure isolation (bulkhead):** event handlers run in try/catch in the bus; a throwing notification handler is logged and cannot break the publisher or sibling handlers. Email sending is best-effort and never fails the notification write.

---

## Scalability Story (grounded in this code)

| Concern | Today (in-process) | Scale-out path (no domain rewrite) |
|---------|-------------------|-----------------------------------|
| Event delivery | EventEmitter via `eventBus` port | New adapter: RabbitMQ/Kafka/Redis Streams |
| Cache | `Map` + TTL via `cache` port | New adapter: Redis (`ioredis`) |
| Rate limiting | per-process timestamps | Redis sorted sets (cluster-wide) |
| Outbox dispatch | inline drain + interval poller | dedicated dispatcher process / CDC (Debezium) |
| Booking concurrency | atomic `$expr` guard + txn retry | already correct under horizontal scale (DB enforces) |
| Read load | cache-aside | + MongoDB read replicas / CDN for SPA |

**Why this scales horizontally today:** the API is stateless (JWT auth, no session store), and the overbooking guarantee is enforced by the *database* (atomic update), not by application-level locks. Adding API instances behind a load balancer requires no coordination — the only shared-state pieces (cache, rate-limiter, event bus) already sit behind ports ready for their distributed adapters.

**The honest current limit:** the event bus is in-process, so a crash between `drainOutbox` publishing and a handler completing relies on the outbox poller + idempotent handlers for recovery, and events don't cross instances. That's exactly the boundary the RabbitMQ adapter removes — and the reason the port exists.

---

## Pattern → File Quick Reference

| Pattern | File |
|---------|------|
| Layered / service layer | `services/*.js`, thin `controllers/*.js` |
| Ports & Adapters | `events/eventBus.js`, `cache/cache.js` |
| Pub/Sub + Observer | `events/subscribers/*.js` |
| Transactional Outbox | `models/OutboxEvent.js`, `events/dispatcher.js` |
| Atomic concurrency control | `services/slotService.js` |
| Transaction + retry | `config/db.js` (`withTransaction`) |
| Saga / compensation | `services/waitlistService.js` |
| Idempotency / one-time-use | `services/ticketService.js` |
| Cache-aside + invalidation | `cache/cache.js`, `controllers/museum-controller.js` |
| Sliding-window rate limit | `middleware/rateLimiter.js` |
| CQRS-lite read models | `services/analyticsService.js` |
| Fail-fast config | `config/db.js` |
