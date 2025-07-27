import { cache } from "../cache/cache.js";

describe("InMemoryCache (cache-aside primitives)", () => {
  it("returns null on a miss and the value on a hit", async () => {
    expect(await cache.get("nope")).toBeNull();
    await cache.set("k1", { a: 1 }, 300);
    expect(await cache.get("k1")).toEqual({ a: 1 });
  });

  it("expires entries past their TTL", async () => {
    // ttl 0 -> expiresAt is now; a later read sees it as expired
    await cache.set("short", "v", 0);
    await new Promise((r) => setTimeout(r, 5));
    expect(await cache.get("short")).toBeNull();
  });

  it("deletes a single key", async () => {
    await cache.set("del-me", 1, 300);
    await cache.del("del-me");
    expect(await cache.get("del-me")).toBeNull();
  });

  it("invalidates by prefix (used on museum writes)", async () => {
    await cache.set("museums:Museum", [1], 300);
    await cache.set("museums:all", [2], 300);
    await cache.set("other:key", [3], 300);
    await cache.delByPrefix("museums:");
    expect(await cache.get("museums:Museum")).toBeNull();
    expect(await cache.get("museums:all")).toBeNull();
    expect(await cache.get("other:key")).toEqual([3]);
  });

  it("tracks hit/miss stats", async () => {
    const before = cache.stats();
    await cache.set("stat", 1, 300);
    await cache.get("stat"); // hit
    await cache.get("absent"); // miss
    const after = cache.stats();
    expect(after.hits).toBeGreaterThan(before.hits);
    expect(after.misses).toBeGreaterThan(before.misses);
  });
});
