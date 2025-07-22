import * as analyticsService from "../services/analyticsService.js";

export const museumAnalytics = async (req, res, next) => {
  const { museumId } = req.params;
  try {
    const [summary, occupancy, peaks] = await Promise.all([
      analyticsService.museumSummary(museumId),
      analyticsService.slotOccupancy(museumId),
      analyticsService.peakTimes(museumId),
    ]);
    return res.status(200).json({ summary, occupancy, peakTimes: peaks });
  } catch (err) {
    return next(err);
  }
};
