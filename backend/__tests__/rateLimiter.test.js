import { jest } from "@jest/globals";
import { rateLimiter } from "../middleware/rateLimiter.js";

const makeResNext = () => {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    set(k, v) { this.headers[k] = v; },
  };
  const next = jest.fn();
  return { res, next };
};

describe("rateLimiter (sliding window)", () => {
  it("allows requests up to the limit, then blocks with 429", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 2, name: "test" });
    const req = { ip: "10.0.0.1" };

    let r = makeResNext();
    limiter(req, r.res, r.next);
    expect(r.next).toHaveBeenCalled();

    r = makeResNext();
    limiter(req, r.res, r.next);
    expect(r.next).toHaveBeenCalled();

    r = makeResNext();
    limiter(req, r.res, r.next);
    expect(r.next).not.toHaveBeenCalled();
    expect(r.res.statusCode).toBe(429);
    expect(r.res.headers["Retry-After"]).toBeDefined();
  });

  it("tracks limits per client independently", () => {
    const limiter = rateLimiter({ windowMs: 60000, max: 1, name: "perclient" });

    let r = makeResNext();
    limiter({ ip: "1.1.1.1" }, r.res, r.next);
    expect(r.next).toHaveBeenCalled();

    // Different IP is unaffected by the first client's usage
    r = makeResNext();
    limiter({ ip: "2.2.2.2" }, r.res, r.next);
    expect(r.next).toHaveBeenCalled();
  });
});
