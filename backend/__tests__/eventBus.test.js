import { jest } from "@jest/globals";
import { eventBus } from "../events/eventBus.js";

const tick = () => new Promise((r) => setImmediate(r));

describe("InMemoryEventBus", () => {
  it("delivers a published event to a subscriber", async () => {
    const handler = jest.fn();
    eventBus.subscribe("test.delivered", handler);
    eventBus.publish("test.delivered", { value: 42 });
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it("delivers to multiple subscribers (fan-out)", async () => {
    const a = jest.fn();
    const b = jest.fn();
    eventBus.subscribe("test.fanout", a);
    eventBus.subscribe("test.fanout", b);
    eventBus.publish("test.fanout", { x: 1 });
    await tick();
    await tick();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("isolates a throwing handler so siblings still run", async () => {
    const bad = jest.fn(() => { throw new Error("boom"); });
    const good = jest.fn();
    eventBus.subscribe("test.isolation", bad);
    eventBus.subscribe("test.isolation", good);
    eventBus.publish("test.isolation", {});
    await tick();
    await tick();
    expect(good).toHaveBeenCalledTimes(1); // not broken by bad handler
  });

  it("publishes asynchronously (does not block the caller)", async () => {
    const order = [];
    eventBus.subscribe("test.async", () => order.push("handler"));
    eventBus.publish("test.async", {});
    order.push("after-publish");
    await tick();
    await tick();
    expect(order[0]).toBe("after-publish"); // handler runs on a later tick
  });
});
