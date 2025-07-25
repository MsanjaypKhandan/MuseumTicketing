import { registerNotificationSubscriber } from "./notificationSubscriber.js";
import { registerWaitlistSubscriber } from "./waitlistSubscriber.js";
import { logger } from "../../middleware/logger.js";

/**
 * Wires all event subscribers to the bus at startup. Called once from the
 * app bootstrap. New subscribers are registered here — the single
 * composition root for the event-driven layer.
 */
export const registerSubscribers = () => {
  registerNotificationSubscriber();
  registerWaitlistSubscriber();
  logger.info("event.subscribers_registered");
};
