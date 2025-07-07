import { jest } from "@jest/globals";

const mockAdminFindOne = jest.fn();
const mockAdminFindById = jest.fn();
const mockAdminSave = jest.fn();
const mockBcryptCompare = jest.fn();
const mockBcryptHashSync = jest.fn();
const mockJwtSign = jest.fn();

jest.unstable_mockModule("../models/Admin.js", () => ({
  default: {
    findOne: mockAdminFindOne,
    findById: mockAdminFindById,
    find: jest.fn().mockResolvedValue([]),
  },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: { compare: mockBcryptCompare, hashSync: mockBcryptHashSync },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign: mockJwtSign },
}));

const { adminLogin, getadminById, getadmins } = await import("../controllers/admin-controller.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("adminLogin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 422 when inputs are empty", async () => {
    const res = makeRes();
    await adminLogin({ body: { email: "", password: "" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("returns 404 when admin does not exist", async () => {
    mockAdminFindOne.mockResolvedValue(null);
    const res = makeRes();
    await adminLogin({ body: { email: "a@a.com", password: "pass" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 400 when password is incorrect", async () => {
    mockAdminFindOne.mockResolvedValue({ password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);
    const res = makeRes();
    await adminLogin({ body: { email: "a@a.com", password: "wrong" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 200 with token on successful login", async () => {
    mockAdminFindOne.mockResolvedValue({ _id: "admin1", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(true);
    mockJwtSign.mockReturnValue("jwt_token_value");
    const res = makeRes();
    await adminLogin({ body: { email: "a@a.com", password: "correct" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt_token_value", id: "admin1" })
    );
  });
});

describe("getadminById", () => {
  it("returns 404 when admin not found", async () => {
    mockAdminFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const res = makeRes();
    await getadminById({ params: { id: "x" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns admin on success", async () => {
    const admin = { _id: "a1", email: "a@a.com", addedMuseum: [] };
    mockAdminFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(admin) });
    const res = makeRes();
    await getadminById({ params: { id: "a1" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ admin });
  });
});

describe("getadmins", () => {
  it("returns all admins", async () => {
    const AdminModule = await import("../models/Admin.js");
    AdminModule.default.find.mockResolvedValue([{ _id: "a1" }]);
    const res = makeRes();
    await getadmins({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
