const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const log = (level, message, meta = {}) => {
  if (LEVELS[level] > currentLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (level === "error") {
    process.stderr.write(JSON.stringify(entry) + "\n");
  } else {
    process.stdout.write(JSON.stringify(entry) + "\n");
  }
};

export const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
};

export const errorHandler = (err, req, res, next) => {
  logger.error("Unhandled error", {
    method: req.method,
    path: req.path,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
};
