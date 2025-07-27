/**
 * End-to-end integration tests for the capacity / waitlist / ticket flow.
 *
 * These exercise the real transaction + event-driven paths against a live
 * MongoDB *replica set* (transactions require one). They are opt-in: set
 * MONGODB_TEST_URI to a replica-set connection string to run them.
 *
 *   MONGODB_TEST_URI="mongodb://localhost:27017/museum_test?replicaSet=rs0" \
 *     NODE_OPTIONS=--experimental-vm-modules npx jest booking.integration
 *
 * Without that env var the suite self-skips so the default `npm test` stays
 * fast and infra-free. The unit suites already cover the invariants in
 * isolation (atomic guard shape, one-time-use, event delivery).
 */
import { jest } from "@jest/globals";
import mongoose from "mongoose";

const TEST_URI = process.env.MONGODB_TEST_URI;
const describeIf = TEST_URI ? describe : describe.skip;

jest.setTimeout(30000);

describeIf("capacity + waitlist + ticket (integration)", () => {
  let Museum, User, Slot, Booking, Waitlist;
  let bookingService, waitlistService, ticketService;
  let registerSubscribers, drainOutbox;

  const waitFor = async (predicate, timeoutMs = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await predicate()) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  };

  beforeAll(async () => {
    process.env.TICKET_SECRET = process.env.TICKET_SECRET || "integration_ticket_secret";
    await mongoose.connect(TEST_URI);
    ({ default: Museum } = await import("../models/Museum.js"));
    ({ default: User } = await import("../models/User.js"));
    ({ default: Slot } = await import("../models/Slot.js"));
    ({ default: Booking } = await import("../models/Bookings.js"));
    ({ default: Waitlist } = await import("../models/Waitlist.js"));
    bookingService = await import("../services/bookingService.js");
    waitlistService = await import("../services/waitlistService.js");
    ticketService = await import("../services/ticketService.js");
    ({ registerSubscribers } = await import("../events/subscribers/index.js"));
    ({ drainOutbox } = await import("../events/dispatcher.js"));
    registerSubscribers();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("prevents overbooking under concurrent bookings (atomic capacity)", async () => {
    const museum = await Museum.create({
      title: "Concurrency Museum", description: "d", posterUrl: "u",
      location: "l", price: 100, site: "Museum",
    });
    const slot = await Slot.create({
      museum: museum._id, date: new Date(), startTime: "09:00", endTime: "11:00", capacity: 10,
    });
    const users = await User.create(
      Array.from({ length: 15 }, (_, i) => ({ name: `U${i}`, email: `u${i}-${Date.now()}@t.com`, password: "hashedpw" }))
    );

    // 15 users each try to book 1 ticket for a 10-capacity slot, concurrently.
    const results = await Promise.allSettled(
      users.map((u) => bookingService.createBooking({ slotId: slot._id, userId: u._id, count: 1 }))
    );

    const confirmed = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    expect(confirmed).toBe(10);   // exactly capacity succeeded
    expect(rejected).toBe(5);     // the rest were turned away

    const fresh = await Slot.findById(slot._id);
    expect(fresh.booked).toBe(10); // never exceeded capacity
  });

  it("auto-promotes the next waitlisted user when a booking is cancelled", async () => {
    const museum = await Museum.create({
      title: "Waitlist Museum", description: "d", posterUrl: "u",
      location: "l", price: 50, site: "Museum",
    });
    const slot = await Slot.create({
      museum: museum._id, date: new Date(), startTime: "12:00", endTime: "14:00", capacity: 1,
    });
    const [holder, waiter] = await User.create([
      { name: "Holder", email: `holder-${Date.now()}@t.com`, password: "password" },
      { name: "Waiter", email: `waiter-${Date.now()}@t.com`, password: "password" },
    ]);

    // Holder takes the only seat.
    const booking = await bookingService.createBooking({ slotId: slot._id, userId: holder._id, count: 1 });
    // Waiter can't book (full) and joins the waitlist.
    await expect(
      bookingService.createBooking({ slotId: slot._id, userId: waiter._id, count: 1 })
    ).rejects.toMatchObject({ code: "SLOT_FULL" });
    await waitlistService.joinWaitlist({ slotId: slot._id, userId: waiter._id, count: 1 });

    // Holder cancels -> BOOKING_CANCELLED event -> waitlist subscriber promotes waiter.
    await bookingService.cancelBooking(booking.booking?._id || booking._id);
    await drainOutbox();

    const promoted = await waitFor(async () => {
      const entry = await Waitlist.findOne({ slot: slot._id, user: waiter._id });
      return entry?.status === "promoted";
    });
    expect(promoted).toBe(true);

    const waiterBooking = await Booking.findOne({ slot: slot._id, user: waiter._id, status: "confirmed" });
    expect(waiterBooking).toBeTruthy();
  });

  it("verifies a ticket once and rejects the second scan (one-time use)", async () => {
    const museum = await Museum.create({
      title: "Ticket Museum", description: "d", posterUrl: "u",
      location: "l", price: 75, site: "Museum",
    });
    const slot = await Slot.create({
      museum: museum._id, date: new Date(), startTime: "15:00", endTime: "17:00", capacity: 5,
    });
    const user = await User.create({ name: "Scanner", email: `scan-${Date.now()}@t.com`, password: "password" });
    const booking = await bookingService.createBooking({ slotId: slot._id, userId: user._id, count: 2 });

    const { token } = await ticketService.issueTicket(booking._id);
    const first = await ticketService.verifyAndConsumeTicket(token);
    expect(first.bookingId).toBe(String(booking._id));

    await expect(ticketService.verifyAndConsumeTicket(token)).rejects.toMatchObject({ code: "ALREADY_USED" });
  });
});
