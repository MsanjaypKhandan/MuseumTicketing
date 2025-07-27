// Optional global setup: boots an in-memory MongoDB replica set and exposes
// its URI via MONGODB_TEST_URI so the integration suite runs for real.
// Enabled by jest --globalSetup; paired with teardown.replset.cjs.
const { MongoMemoryReplSet } = require("mongodb-memory-server");

module.exports = async () => {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_TEST_URI = replSet.getUri("museum_test");
  global.__MONGO_REPLSET__ = replSet;
  // Stash on a globalThis ref the teardown can reach across module scope.
  globalThis.__MONGO_REPLSET__ = replSet;
};
