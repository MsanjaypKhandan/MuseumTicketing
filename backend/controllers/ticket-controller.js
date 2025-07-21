import * as ticketService from "../services/ticketService.js";

export const getTicket = async (req, res, next) => {
  try {
    const ticket = await ticketService.issueTicket(req.params.bookingId);
    return res.status(200).json(ticket);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return next(err);
  }
};

export const verifyTicket = async (req, res, next) => {
  const { token } = req.body;
  if (!token) return res.status(422).json({ message: "Ticket token required" });
  try {
    const result = await ticketService.verifyAndConsumeTicket(token);
    return res.status(200).json({ valid: true, ...result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ valid: false, message: err.message, code: err.code });
    }
    return next(err);
  }
};
