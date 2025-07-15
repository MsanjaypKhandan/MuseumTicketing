import OutboxEvent from "../models/OutboxEvent.js";
import { eventBus } from "./eventBus.js";
import { logger } from "../middleware/logger.js";

const MAX_ATTEMPTS = 5;

/**
 * Outbox dispatcher.
 *
 * Reads pending outbox rows in creation order and publishes each to the
 * event bus, marking it published. This is the second half of the
 * transactional-outbox pattern (the first half is writing the row inside
 * the business transaction).
 *
 * Two trigger modes:
 *  - drainOutbox(): called right after a transaction commits for low
 *    latency in the happy path.
 *  - startOutboxPoller(): a periodic sweep that catches anything the
 *    inline drain missed (e.g. a crash between commit and drain), giving
 *    at-least-once delivery.
 *
 * Consumers must be idempotent because an event can be delivered more than
 * once (drain + poller, or a retry after a publish that succeeded but
 * whose status update failed).
 */
let draining = false;

export const drainOutbox = async () => {
  if (draining) return; // avoid overlapping drains
  draining = true;
  try {
    const pending = await OutboxEvent.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(50);

    for (const event of pending) {
      try {
        eventBus.publish(event.type, event.payload);
        event.status = "published";
        await event.save();
      } catch (err) {
        event.attempts += 1;
        event.status = event.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
        await event.save();
        logger.error("outbox.publish_failed", {
          id: String(event._id),
          type: event.type,
          attempts: event.attempts,
        });
      }
    }
  } finally {
    draining = false;
  }
};

export const startOutboxPoller = (intervalMs = 10000) => {
  const timer = setInterval(() => {
    drainOutbox().catch((err) =>
      logger.error("outbox.poll_failed", { message: err.message })
    );
  }, intervalMs);
  timer.unref(); // don't keep the event loop alive for the poller alone
  return timer;
};
