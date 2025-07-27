import { signTicket, verifyTicket } from "../utils/ticket.js";

describe("signed ticket tokens", () => {
  beforeAll(() => {
    process.env.TICKET_SECRET = "test_ticket_secret_value";
  });

  it("produces a token that verifies back to its claims", () => {
    const token = signTicket({ bookingId: "b1", slotId: "s1", museumId: "m1", count: 3 });
    const claims = verifyTicket(token);
    expect(claims.bookingId).toBe("b1");
    expect(claims.slotId).toBe("s1");
    expect(claims.museumId).toBe("m1");
    expect(claims.count).toBe(3);
  });

  it("rejects a tampered token", () => {
    const token = signTicket({ bookingId: "b1", slotId: "s1", museumId: "m1", count: 1 });
    const tampered = token.slice(0, -3) + "xyz";
    expect(() => verifyTicket(tampered)).toThrow();
  });

  it("rejects a token signed with a different secret (forgery attempt)", async () => {
    const token = signTicket({ bookingId: "b1", slotId: "s1", museumId: "m1", count: 1 });
    process.env.TICKET_SECRET = "rotated_secret";
    expect(() => verifyTicket(token)).toThrow();
    process.env.TICKET_SECRET = "test_ticket_secret_value"; // restore
  });
});
