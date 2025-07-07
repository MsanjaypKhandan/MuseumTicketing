import { jest } from "@jest/globals";

// Mock jsonwebtoken before importing middleware
const mockVerify = jest.fn();
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { verify: mockVerify },
}));

const { default: verifyToken } = await import("../middleware/auth.js");

describe("verifyToken middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.SECRET_KEY = "test_secret";
    jest.clearAllMocks();
  });

  it("returns 401 when no authorization header is present", () => {
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Authorization token required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header has wrong format", () => {
    req.headers.authorization = "Basic abc123";
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    req.headers.authorization = "Bearer invalid_token";
    mockVerify.mockImplementation(() => { throw new Error("invalid signature"); });
    verifyToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and attaches adminId when token is valid", () => {
    req.headers.authorization = "Bearer valid_token";
    mockVerify.mockReturnValue({ id: "admin123" });
    verifyToken(req, res, next);
    expect(req.adminId).toBe("admin123");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
