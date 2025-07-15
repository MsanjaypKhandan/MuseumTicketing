import { EventEmitter } from "node:events";
import { logger } from "../middleware/logger.js";

/**
 * Event Bus — the publish/subscribe port for the domain.
 *
 * Producers call publish(); consumers register via subscribe(). The domain
 * code depends only on this interface, never on the transport. Today the
 * transport is an in-process EventEmitter (InMemoryEventBus). To move to
 * RabbitMQ/Redis Streams/Kafka, implement the same publish/subscribe
 * surface in a new adapter and swap the export below — zero changes to
 * services or subscribers.
 *
 * This is the Adapter pattern protecting a Ports-and-Adapters boundary.
 */
class InMemoryEventBus {
  constructor() {
    this.emitter = new EventEmitter();
    // Subscribers fan out; raise the cap above the default 10.
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish an event. Handlers run asynchronously and independently — a
   * throwing handler is logged and isolated so it cannot break the
   * producer or sibling handlers (failure isolation / bulkhead).
   */
  publish(type, payload) {
    logger.info("event.published", { type });
    // setImmediate decouples handler execution from the publishing call
    // stack, mirroring how a real broker would deliver asynchronously.
    setImmediate(() => this.emitter.emit(type, payload));
  }

  subscribe(type, handler) {
    this.emitter.on(type, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error("event.handler_failed", { type, message: err.message });
      }
    });
  }
}

export const eventBus = new InMemoryEventBus();
