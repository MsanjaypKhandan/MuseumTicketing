import { eventBus } from "../eventBus.js";
import { EventTypes } from "../eventTypes.js";
import { notify } from "../../services/notificationService.js";

/**
 * Notification subscriber.
 *
 * Reacts to domain events by creating user-facing notifications. This is
 * the Observer pattern: the booking/waitlist services know nothing about
 * notifications — they publish facts, and this subscriber decides what the
 * user should hear about. Adding SMS/push later means adding a channel
 * here, with no change to the producers.
 *
 * Handlers are idempotent-friendly: re-delivery creates a duplicate
 * notification at worst, never corrupts state. (A production system would
 * dedupe on the event id.)
 */
export const registerNotificationSubscriber = () => {
  eventBus.subscribe(EventTypes.BOOKING_CONFIRMED, async (e) => {
    await notify({
      userId: e.userId,
      type: EventTypes.BOOKING_CONFIRMED,
      title: "Booking confirmed",
      message: `Your booking for ${e.count} ticket(s) is confirmed.`,
      channels: ["in_app", "email"],
      metadata: { bookingId: e.bookingId, slotId: e.slotId },
    });
  });

  eventBus.subscribe(EventTypes.BOOKING_CANCELLED, async (e) => {
    await notify({
      userId: e.userId,
      type: EventTypes.BOOKING_CANCELLED,
      title: "Booking cancelled",
      message: `Your booking for ${e.count} ticket(s) has been cancelled.`,
      channels: ["in_app"],
      metadata: { bookingId: e.bookingId },
    });
  });

  eventBus.subscribe(EventTypes.WAITLIST_JOINED, async (e) => {
    await notify({
      userId: e.userId,
      type: EventTypes.WAITLIST_JOINED,
      title: "Added to waitlist",
      message: `This slot is full. You're on the waitlist for ${e.count} ticket(s) and will be notified if a spot opens.`,
      channels: ["in_app"],
      metadata: { waitlistId: e.waitlistId, slotId: e.slotId },
    });
  });

  eventBus.subscribe(EventTypes.WAITLIST_PROMOTED, async (e) => {
    await notify({
      userId: e.userId,
      type: EventTypes.WAITLIST_PROMOTED,
      title: "A spot opened up — you're in!",
      message: `Good news! A spot opened and your waitlisted request for ${e.count} ticket(s) is now a confirmed booking.`,
      channels: ["in_app", "email"],
      metadata: { bookingId: e.bookingId, waitlistId: e.waitlistId },
    });
  });
};
