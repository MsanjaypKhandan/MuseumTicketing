import * as waitlistService from "../services/waitlistService.js";

export const joinWaitlist = async (req, res, next) => {
  const { slotId, user, count } = req.body;
  if (!slotId || !user || !count || count < 1) {
    return res.status(422).json({ message: "Invalid waitlist inputs" });
  }
  try {
    const entry = await waitlistService.joinWaitlist({ slotId, userId: user, count: Number(count) });
    return res.status(201).json({ waitlist: entry });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return next(err);
  }
};

export const myWaitlist = async (req, res, next) => {
  try {
    const entries = await waitlistService.listWaitlistForUser(req.params.userId);
    return res.status(200).json({ waitlist: entries });
  } catch (err) {
    return next(err);
  }
};
