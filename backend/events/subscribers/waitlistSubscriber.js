import { eventBus } from "../eventBus.js";
import { EventTypes } from "../eventTypes.js";
import { promoteNextForSlot } from "../../services/waitlistService.js";
import { logger } from "../../middleware/logger.js";

/**
 * Waitlist subscriber.
 *
 * When a booking is cancelled, capacity is freed — this handler attempts to
 * promote the next FIFO waitlist entry for that slot. Decoupling promotion
 * from the cancellation request keeps the cancel endpoint fast and lets
 * promotion be retried independently if it fails.
 */
export const registerWaitlistSubscriber = () => {
  eventBus.subscribe(EventTypes.BOOKING_CANCELLED, async (e) => {
    if (!e.slotId) return;
    const promoted = await promoteNextForSlot(e.slotId);
    if (promoted) {
      logger.info("waitlist.promoted", { slotId: e.slotId, bookingId: String(promoted._id) });
    }
  });
};
