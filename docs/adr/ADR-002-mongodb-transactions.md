# ADR-002: MongoDB Multi-Document Transactions for Booking Consistency

**Date:** 2024-01-20  
**Status:** Accepted

---

## Context

Museum ticket bookings require atomically updating three documents:
1. Create a new `Booking` document
2. Push the booking ID into `Museum.bookings[]`
3. Push the booking ID into `User.bookings[]`

Without atomicity, a partial failure leaves the database in an inconsistent state: a booking exists but isn't reflected in the museum's booking list, or vice versa.

---

## Problem

MongoDB is a document store with no joins. Referential integrity is not enforced by the database engine. How do we guarantee that all three writes succeed or all three fail?

---

## Proposed Solution

Use MongoDB multi-document ACID transactions (available in replica set or sharded cluster deployments since MongoDB 4.0) via Mongoose sessions:

```js
const session = await mongoose.startSession();
try {
  session.startTransaction();
  await booking.save({ session });
  await Museum.findByIdAndUpdate(museum, { $push: { bookings: booking._id } }, { session });
  await User.findByIdAndUpdate(user, { $push: { bookings: booking._id } }, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

The same pattern is applied to:
- `addMuseum` — creates museum + updates Admin.addedMuseum[]
- `deleteMuseum` — deletes museum, its bookings, and removes from Admin.addedMuseum[]
- `deleteBooking` — deletes booking, removes from Museum.bookings[] and User.bookings[]

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| No transactions (fire-and-forget) | Simple | Orphaned documents on partial failure |
| Compensating transactions (saga) | Works without replica set | Complex rollback logic, eventual consistency |
| Denormalized single-document | No transaction needed | Poor query flexibility, large documents |
| MongoDB transactions ✓ | Full ACID on replica sets | Requires replica set; slight latency overhead |

---

## Tradeoffs

**Wins:**
- Guaranteed consistency: no orphaned bookings
- Familiar SQL-like semantics for multi-document operations
- MongoDB Atlas free tier already runs as a replica set

**Costs:**
- Transactions require a replica set (not available on standalone MongoDB)
- Transaction sessions add ~5-10ms overhead per write
- Long-running transactions hold collection-level intent locks

---

## Consequences

- All booking and museum write operations must go through session-aware handlers
- Integration tests need a real MongoDB replica set (not standalone `mongod`)
- In high-throughput scenarios, consider replacing `$push` in transactions with a dedicated event queue to reduce lock contention

---

## Interview Talking Points

**Q: Why use MongoDB for a transactional system instead of Postgres?**  
A: MongoDB Atlas was chosen for its free tier, built-in replica set (enabling transactions), and flexible schema (museum descriptions vary significantly). For a purely relational domain, Postgres would be the right choice. If this system grew, I'd consider migrating the bookings domain to Postgres for SQL analytics while keeping museum content in MongoDB.

**Q: What happens if the server crashes between commitTransaction() and the response?**  
A: MongoDB's transaction log (oplog) ensures the commit either fully applied or didn't. The client will get a connection error, but the database state remains consistent. The fix is idempotent booking creation — client should check if the booking already exists before retrying.

**Q: How would you handle the booking process at high concurrency?**  
A: Add optimistic concurrency control with a `version` field on Museum. When two users simultaneously book the last ticket, one transaction succeeds and one fails with a write conflict. The losing client retries. For very high throughput, move to a Redis-based inventory counter with atomic DECR and flush to MongoDB asynchronously.
