import * as slotService from "../services/slotService.js";

export const createSlot = async (req, res, next) => {
  const { date, startTime, endTime, capacity } = req.body;
  if (!date || !startTime || !endTime || !capacity || capacity < 1) {
    return res.status(422).json({ message: "Invalid slot inputs" });
  }
  try {
    const slot = await slotService.createSlot({
      museumId: req.params.museumId,
      date,
      startTime,
      endTime,
      capacity: Number(capacity),
    });
    return res.status(201).json({ slot });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    return next(err);
  }
};

export const listSlots = async (req, res, next) => {
  try {
    const slots = await slotService.listSlots(req.params.museumId, req.query.date);
    return res.status(200).json({ slots });
  } catch (err) {
    return next(err);
  }
};
