import jwt from "jsonwebtoken";

/**
 * Signed ticket tokens.
 *
 * The QR code embeds a JWT signed with TICKET_SECRET (separate from the
 * auth SECRET_KEY so ticket and session concerns rotate independently).
 * Staff scanners verify the signature offline — no database round-trip is
 * needed to prove the ticket is authentic, only to enforce one-time use.
 *
 * Forging a ticket requires the secret, so a hand-crafted QR with a made-up
 * booking id fails signature verification.
 */
const ticketSecret = () => process.env.TICKET_SECRET || process.env.SECRET_KEY;

export const signTicket = ({ bookingId, slotId, museumId, count }) => {
  return jwt.sign(
    { bookingId, slotId, museumId, count },
    ticketSecret(),
    { expiresIn: "365d" }
  );
};

export const verifyTicket = (token) => {
  // Throws on invalid/expired signature; caller maps to a 4xx response.
  return jwt.verify(token, ticketSecret());
};
