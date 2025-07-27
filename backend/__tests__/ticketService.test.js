import { jest } from "@jest/globals";

const mockFindById = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockOutboxCreate = jest.fn().mockResolvedValue({});
const mockDrain = jest.fn().mockResolvedValue();
const mockVerifyTicket = jest.fn();
const mockSignTicket = jest.fn().mockReturnValue("signed.jwt.token");
const mockToDataURL = jest.fn().mockResolvedValue("data:image/png;base64,xxx");

jest.unstable_mockModule("../models/Bookings.js", () => ({
  default: { findById: mockFindById, findOneAndUpdate: mockFindOneAndUpdate },
}));
jest.unstable_mockModule("../models/OutboxEvent.js", () => ({
  default: { create: mockOutboxCreate },
}));
jest.unstable_mockModule("../events/dispatcher.js", () => ({
  drainOutbox: mockDrain,
}));
jest.unstable_mockModule("../utils/ticket.js", () => ({
  verifyTicket: mockVerifyTicket,
  signTicket: mockSignTicket,
}));
jest.unstable_mockModule("qrcode", () => ({
  default: { toDataURL: mockToDataURL },
}));

const { verifyAndConsumeTicket, issueTicket } = await import("../services/ticketService.js");

describe("ticketService.verifyAndConsumeTicket (one-time-use)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a tampered/invalid token with 400", async () => {
    mockVerifyTicket.mockImplementation(() => { throw new Error("bad signature"); });
    await expect(verifyAndConsumeTicket("garbage")).rejects.toMatchObject({ status: 400 });
  });

  it("accepts a valid unused ticket and atomically stamps usedAt", async () => {
    mockVerifyTicket.mockReturnValue({ bookingId: "b1" });
    mockFindById.mockResolvedValue({ _id: "b1", status: "confirmed", user: "u1" });
    mockFindOneAndUpdate.mockResolvedValue({ _id: "b1", count: 2, user: "u1", usedAt: new Date() });

    const result = await verifyAndConsumeTicket("valid");
    expect(result.bookingId).toBe("b1");

    // The consume is a conditional update on usedAt:null — atomic check-and-set
    const [filter, update] = mockFindOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: "b1", usedAt: null });
    expect(update.$set.usedAt).toBeInstanceOf(Date);
  });

  it("rejects a second scan of the same ticket (already used) with 409", async () => {
    mockVerifyTicket.mockReturnValue({ bookingId: "b1" });
    mockFindById.mockResolvedValue({ _id: "b1", status: "confirmed", user: "u1" });
    // usedAt already set -> conditional update matches nothing -> null
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(verifyAndConsumeTicket("valid")).rejects.toMatchObject({
      status: 409,
      code: "ALREADY_USED",
    });
  });

  it("rejects a ticket for a cancelled booking", async () => {
    mockVerifyTicket.mockReturnValue({ bookingId: "b1" });
    mockFindById.mockResolvedValue({ _id: "b1", status: "cancelled", user: "u1" });
    await expect(verifyAndConsumeTicket("valid")).rejects.toMatchObject({ status: 409 });
  });
});

describe("ticketService.issueTicket", () => {
  it("signs a token and renders a QR data URL for a confirmed booking", async () => {
    mockFindById.mockResolvedValue({ _id: "b1", status: "confirmed", slot: "s1", museum: "m1", count: 2 });
    const out = await issueTicket("b1");
    expect(out.token).toBe("signed.jwt.token");
    expect(out.qrDataUrl).toContain("data:image/png");
  });
});
