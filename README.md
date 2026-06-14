# Museum Ticketing System

A full-stack museum ticket-booking platform with slot-based capacity, concurrency-safe
booking, an event-driven backend, FIFO waitlists, and signed QR tickets.

The backend is a **modular monolith** built around a few deliberate patterns — a domain
event bus with a transactional outbox, atomic (transaction-guarded) slot booking, a
cache-aside read path, and sliding-window rate limiting — so it reads like a small system
rather than a CRUD app. See [docs/design-patterns.md](docs/design-patterns.md) and the
[Architecture Decision Records](docs/adr/) for the full rationale.

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | React 18, Redux Toolkit, Material UI (MUI), React Router, Axios |
| Backend     | Node.js, Express, ES modules |
| Database    | MongoDB (Mongoose ODM), multi-document transactions |
| Auth        | JWT (`jsonwebtoken`) + `bcryptjs` |
| Tickets     | `qrcode` generation, HMAC-signed payloads, email via `nodemailer` |
| Testing     | Jest, `mongodb-memory-server` (incl. replica-set integration tests) |

## Features

- **Slot-based booking** — museums expose time slots with fixed capacity; bookings
  decrement capacity inside a MongoDB transaction so the last seat can never be double-sold.
- **Event-driven core** — domain events (`booking.confirmed`, `waitlist.promoted`,
  `slot.almost_full`, …) flow through an in-process event bus. A **transactional outbox**
  and poller guarantee events are delivered even if a subscriber or the process crashes.
- **FIFO waitlist** — when a slot is full users join a waitlist; a cancellation publishes an
  event that auto-promotes the next person (a compensating-action / saga flow).
- **Signed QR tickets** — tickets carry an HMAC signature and are one-time-use; verification
  rejects forged or already-scanned tickets.
- **Analytics read models** — occupancy and revenue aggregations served via a CQRS-lite read path.
- **Performance & safety** — cache-aside (lazy-loading) for museum listings with TTL jitter to
  avoid stampedes, plus sliding-window rate limiting on auth endpoints.
- **Observability** — structured JSON request/error logging middleware.

## Project Structure

```text
MuseumTicketing/
├── backend/
│   ├── app.js              # Express entry: wires routes, subscribers, outbox poller
│   ├── config/             # DB connection + withTransaction helper
│   ├── controllers/        # HTTP handlers (museum, booking, slot, ticket, waitlist, …)
│   ├── services/           # Business logic (booking, slot, ticket, waitlist, analytics, …)
│   ├── models/             # Mongoose schemas (incl. OutboxEvent, Slot, Waitlist)
│   ├── events/             # eventBus, dispatcher (outbox poller), subscribers, event types
│   ├── cache/              # Cache-aside adapter (in-memory; swappable for Redis)
│   ├── middleware/         # auth (JWT), logger, rateLimiter
│   ├── routes/             # Express routers
│   ├── utils/              # mailer, QR ticket helpers
│   ├── scripts/            # seed.js
│   └── __tests__/          # Jest unit + integration suites
├── frontend/               # React + Redux Toolkit + MUI app
└── docs/                   # ADRs + design-patterns guide
```

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance. **The booking flow uses transactions, so MongoDB must run as a replica
  set** (a single-node replica set is fine for local dev; MongoDB Atlas works out of the box).

### Backend

```bash
cd backend
npm install
# create backend/.env (see below)
npm run seed                # optional: seed sample data
npm run dev                 # starts on http://localhost:5000 (nodemon)
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/museum?replicaSet=rs0
SECRET_KEY=your_jwt_secret
TICKET_SECRET=your_ticket_signing_secret
SMTP_EMAIL=you@example.com
SMTP_APP_PASSWORD=your_smtp_app_password
CORS_ORIGIN=http://localhost:3000
# optional tuning
DB_POOL_SIZE=10
OUTBOX_POLL_MS=10000
LOG_LEVEL=info
```

### Frontend

```bash
cd frontend
npm install
npm start                   # starts on http://localhost:3000
```

## Testing

```bash
cd backend
npm test                    # unit tests (in-memory MongoDB)
npm run test:integration    # booking integration tests (spins up a replica set)
```

## API Overview

The backend mounts these routers (see [backend/app.js](backend/app.js)); base URL defaults to
`http://localhost:5000`:

| Mount            | Purpose |
|------------------|---------|
| `/user`          | Signup, login (JWT) |
| `/admin`         | Admin auth & management |
| `/museum`        | Museum CRUD + listings (cache-aside) |
| `/booking`       | Slot-based, transaction-safe ticket booking |
| `/waitlist`      | Join waitlist / FIFO auto-promotion |
| `/ticket`        | Signed QR ticket issue & one-time verification |
| `/notification`  | Per-user notifications (event-driven) |
| `/sendEmail`     | Email dispatch |
| `/health`        | Liveness probe |

## Documentation

- [docs/design-patterns.md](docs/design-patterns.md) — every design pattern in the codebase,
  mapped to the files that implement it.
- [docs/adr/](docs/adr/) — Architecture Decision Records (modular monolith, MongoDB
  transactions, JWT auth, QR/email tickets, payments).
