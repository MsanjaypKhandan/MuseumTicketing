// Stops the in-memory replica set booted in setup.replset.cjs.
module.exports = async () => {
  const replSet = globalThis.__MONGO_REPLSET__ || global.__MONGO_REPLSET__;
  if (replSet) await replSet.stop();
};
