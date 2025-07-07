import { jest } from "@jest/globals";
import { logger, requestLogger, errorHandler } from "../middleware/logger.js";

describe("logger", () => {
  let stdoutSpy, stderrSpy;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("writes info log to stdout as JSON", () => {
    logger.info("test message", { key: "value" });
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.key).toBe("value");
    expect(output.timestamp).toBeDefined();
  });

  it("writes error log to stderr as JSON", () => {
    logger.error("something failed", { code: 500 });
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.message).toBe("something failed");
  });
});

describe("requestLogger middleware", () => {
  it("calls next and logs on response finish", () => {
    const req = { method: "GET", path: "/health" };
    const listeners = {};
    const res = {
      on: (event, cb) => { listeners[event] = cb; },
      statusCode: 200,
    };
    const next = jest.fn();
    const stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

    requestLogger(req, res, next);
    expect(next).toHaveBeenCalled();

    listeners["finish"]();
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.method).toBe("GET");
    expect(output.path).toBe("/health");
    expect(output.status).toBe(200);

    stdoutSpy.mockRestore();
  });
});

describe("errorHandler middleware", () => {
  it("returns the error status and message as JSON", () => {
    const err = new Error("Not Found");
    err.status = 404;
    const req = { method: "GET", path: "/missing" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Not Found" });
  });

  it("defaults to 500 when error has no status", () => {
    const err = new Error("crash");
    const req = { method: "POST", path: "/booking" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(process.stderr, "write").mockImplementation(() => true);

    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
