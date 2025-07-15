/**
 * Sliding-window rate limiter.
 *
 * Each client (keyed by IP + route) gets a window of `max` requests per
 * `windowMs`. We store request timestamps and drop those older than the
 * window on each check — a true sliding window, not a fixed bucket that
 * resets on a hard boundary (which would let 2x burst across the seam).
 *
 * State is in-process. For multiple instances this moves to Redis with the
 * same logic (ZADD timestamp / ZREMRANGEBYSCORE / ZCARD) so the limit is
 * enforced cluster-wide.
 */
const buckets = new Map(); // key -> number[] (timestamps)

export const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, name = "default" } = {}) => {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= max) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: `Too many requests. Try again in ${retryAfter}s.`,
      });
    }

    timestamps.push(now);
    buckets.set(key, timestamps);
    next();
  };
};
