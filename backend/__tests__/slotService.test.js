import { jest } from "@jest/globals";

const mockFindOneAndUpdate = jest.fn();
const mockFind = jest.fn();
const mockCreate = jest.fn();

jest.unstable_mockModule("../models/Slot.js", () => ({
  default: {
    findOneAndUpdate: mockFindOneAndUpdate,
    find: mockFind,
    create: mockCreate,
  },
}));
jest.unstable_mockModule("../models/Museum.js", () => ({
  default: { findById: jest.fn().mockResolvedValue({ _id: "m1" }) },
}));

const { reserveCapacity, releaseCapacity } = await import("../services/slotService.js");

describe("slotService.reserveCapacity (atomic overbooking guard)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses an atomic check-and-decrement: $expr capacity guard in the filter + $inc booked", async () => {
    mockFindOneAndUpdate.mockResolvedValue({ _id: "s1", booked: 5, capacity: 10 });
    await reserveCapacity("s1", 3, "SESSION");

    const [filter, update, opts] = mockFindOneAndUpdate.mock.calls[0];
    // The capacity check is in the query filter, so check + increment are one atomic op
    expect(filter._id).toBe("s1");
    expect(filter.$expr).toEqual({ $lte: [{ $add: ["$booked", 3] }, "$capacity"] });
    expect(update).toEqual({ $inc: { booked: 3 } });
    expect(opts.session).toBe("SESSION");
  });

  it("returns null when the slot cannot fit the request (overbooking prevented)", async () => {
    mockFindOneAndUpdate.mockResolvedValue(null); // filter matched nothing -> at capacity
    const result = await reserveCapacity("s1", 100, "SESSION");
    expect(result).toBeNull();
  });
});

describe("slotService.releaseCapacity", () => {
  it("clamps with a booked>=count filter so the counter cannot go negative", async () => {
    jest.clearAllMocks();
    mockFindOneAndUpdate.mockResolvedValue({ _id: "s1", booked: 2 });
    await releaseCapacity("s1", 3, "SESSION");
    const [filter, update] = mockFindOneAndUpdate.mock.calls[0];
    expect(filter.booked).toEqual({ $gte: 3 });
    expect(update).toEqual({ $inc: { booked: -3 } });
  });
});
