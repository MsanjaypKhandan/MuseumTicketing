# ADR-001: Modular Monolith Architecture

**Date:** 2024-01-15  
**Status:** Accepted

---

## Context

The Museum Ticketing System started as a college project with basic CRUD for museums and ticket bookings. As it matured into a production-capable platform, an architectural decision was needed: stay monolithic, migrate to microservices, or find a middle ground.

The system has three bounded domains:
- **Identity** (user/admin auth)
- **Inventory** (museum/heritage site management)
- **Ticketing** (bookings, payments, email confirmation)

---

## Problem

How should the codebase be organized as it scales from MVP to production? Microservices offer isolation but add operational complexity. A flat monolith is simple but becomes unmaintainable. The team is one developer; deployment target is a single VPS or PaaS (e.g., Railway, Render).

---

## Proposed Solution

Adopt a **modular monolith**: a single deployable Node.js/Express application where each domain has its own directory (controllers, models, routes, middleware) with clear boundaries enforced by code review and import discipline.

```
backend/
├── controllers/     # Domain handlers
│   ├── user-controller.js
│   ├── admin-controller.js
│   ├── museum-controller.js
│   ├── booking-controller.js
│   └── email/email-controller.js
├── models/          # Mongoose schemas
├── routes/          # Express routers (one per domain)
├── middleware/      # Cross-cutting: auth, logging
```

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Microservices | Independent scaling, fault isolation | Needs service mesh, distributed tracing, much higher ops cost |
| Flat monolith | Zero setup | Controller soup, hard to test in isolation |
| Modular monolith ✓ | Clear boundaries, single deploy, easy to extract later | Need discipline to avoid cross-module coupling |

---

## Tradeoffs

**Wins:**
- Single MongoDB connection, no cross-service network calls
- All code in one repo, one CI pipeline
- Easy to extract a domain into a microservice later (routes are already isolated)

**Costs:**
- Deployment scales the entire app, not individual domains
- A bug in email could crash the booking domain in the same process

---

## Consequences

- Each new feature must be added to the correct domain directory
- Inter-domain calls go through the service layer, not direct model imports from foreign domains
- When throughput demands it, `booking-controller.js` can be extracted into its own service with minimal API surface change (it already has its own router)

---

## Interview Talking Points

**Q: Why not microservices from the start?**  
A: Microservices trade simplicity for scalability. At this scale — hundreds of concurrent users, single developer — the operational overhead of service meshes, distributed tracing, and separate deployments outweighs the benefits. The modular monolith gives us clean boundaries today and a clear extraction path tomorrow.

**Q: How would you extract a microservice from this architecture?**  
A: Identify the domain router (e.g., `booking-routes.js`), extract it into a new Express app, replace direct Mongoose calls with HTTP/gRPC calls to the new service, add a service registry or API gateway, and migrate the Booking collection to its own database. The bounded domains already map to natural service boundaries.

**Q: What's the breaking point for this architecture?**  
A: When different domains need to scale at different rates (e.g., booking traffic spikes during festival season while admin usage stays flat), or when you need polyglot persistence (e.g., analytics on Postgres while bookings stay on MongoDB).
