# ADR-003: JWT-Based Stateless Authentication

**Date:** 2024-01-25  
**Status:** Accepted

---

## Context

The system has two actor types with distinct permissions:
- **Users** — can browse museums, book tickets, view their own bookings
- **Admins** — can create/update/delete museums, view all bookings for their museums

Authentication needs to be lightweight (single-server deployment), stateless (no session store), and verifiable on each protected route.

---

## Problem

How should the system authenticate requests and enforce role-based access control without a dedicated session management service?

---

## Proposed Solution

Issue **JSON Web Tokens (JWT)** signed with a server-side secret upon successful login. The token encodes the admin's ID and an expiry. Protected routes use a `verifyToken` middleware that:

1. Extracts the Bearer token from `Authorization` header
2. Verifies the signature using `process.env.SECRET_KEY`
3. Attaches `req.adminId` for downstream handlers

```js
// middleware/auth.js
const decoded = jwt.verify(token, process.env.SECRET_KEY);
req.adminId = decoded.id;
next();
```

Token payload: `{ id: adminId, iat, exp }`  
Token TTL: 7 days

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Session cookies + server-side store | Easy revocation | Requires Redis/DB session store |
| JWT ✓ | Stateless, no session DB needed | Cannot revoke before expiry |
| OAuth2 / SSO | Enterprise-grade | Heavy setup, overkill for this scope |
| API Keys | Simple | No expiry, harder to rotate |

---

## Tradeoffs

**Wins:**
- No session table or Redis required
- Scales horizontally (any server can verify without shared state)
- Token expiry enforces re-login after 7 days

**Costs:**
- Cannot immediately revoke a stolen token (must wait for expiry or rotate SECRET_KEY)
- Payload visible to anyone (base64-decoded) — never put PII or sensitive data in claims
- Token stored in localStorage is vulnerable to XSS; `HttpOnly` cookie storage is safer

---

## Current Limitation and Future Fix

Currently only admin routes require JWT. User routes are unauthenticated for CRUD operations. In production:
1. Move token storage to `HttpOnly` secure cookie
2. Issue tokens to users as well (with a `role` claim)
3. Add a refresh token mechanism to avoid 7-day hard expiry
4. Maintain a token revocation list in Redis for logout-on-demand

---

## Consequences

- `SECRET_KEY` must be a cryptographically random string (≥ 32 chars) in production. Current value `"626847"` is trivially brute-forced — **must be rotated before any public deployment**
- All protected endpoints depend on middleware order: `verifyToken` must come before the handler in the route definition

---

## Interview Talking Points

**Q: What are the security risks of JWT stored in localStorage?**  
A: localStorage is accessible to JavaScript, making it vulnerable to XSS attacks. Any injected script can steal the token. The mitigation is storing tokens in `HttpOnly; Secure; SameSite=Strict` cookies which are inaccessible to JS. The tradeoff is CSRF risk, mitigated by adding `SameSite=Strict` and a CSRF token for state-changing requests.

**Q: How would you implement token revocation for logout?**  
A: Maintain a Redis set of revoked JTI (JWT ID) claims. On logout, add the token's JTI to Redis with the same TTL as the token. On each request, check if the JTI is in the revocation set. This adds one Redis round-trip per request but enables immediate logout.

**Q: Why did you choose 7-day expiry for admin tokens?**  
A: Admin users interact with the system infrequently (adding museums, reviewing bookings). A 7-day token avoids frequent re-login friction. For user tokens, shorter expiry (1-24 hours) with silent refresh would be more appropriate given the security-sensitivity of payment flows.
