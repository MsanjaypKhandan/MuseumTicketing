/**
 * Domain event catalogue.
 *
 * Events are the contract between producers (services) and consumers
 * (subscribers). Keeping them as named constants prevents typos and gives
 * a single place to see everything the system reacts to.
 */
export const EventTypes = Object.freeze({
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_CANCELLED: "booking.cancelled",
  WAITLIST_JOINED: "waitlist.joined",
  WAITLIST_PROMOTED: "waitlist.promoted",
  SLOT_ALMOST_FULL: "slot.almost_full",
  TICKET_VERIFIED: "ticket.verified",
});
