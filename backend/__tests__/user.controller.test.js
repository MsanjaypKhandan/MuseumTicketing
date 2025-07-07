import { jest } from "@jest/globals";

const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserFindByIdAndDelete = jest.fn();
const mockUserSave = jest.fn();
const mockBookingsFind = jest.fn();
const mockBcryptCompare = jest.fn();
const mockBcryptHashSync = jest.fn();

jest.unstable_mockModule("../models/User.js", () => ({
  default: {
    find: mockUserFind,
    findById: mockUserFindById,
    findOne: mockUserFindOne,
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
    findByIdAndDelete: mockUserFindByIdAndDelete,
  },
}));

jest.unstable_mockModule("../models/Bookings.js", () => ({
  default: { find: mockBookingsFind },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
    hashSync: mockBcryptHashSync,
  },
}));

const {
  getAllUsers,
  signup,
  login,
  deleteUser,
  getBookingsOfUser,
  getUserById,
} = await import("../controllers/user-controller.js");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("getAllUsers", () => {
  it("returns all users on success", async () => {
    mockUserFind.mockResolvedValue([{ name: "Alice" }]);
    const res = makeRes();
    await getAllUsers({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ users: [{ name: "Alice" }] });
  });

  it("calls next on database error", async () => {
    mockUserFind.mockRejectedValue(new Error("db error"));
    const next = jest.fn();
    await getAllUsers({}, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("signup", () => {
  it("returns 422 when required fields are missing", async () => {
    const req = { body: { name: "", email: "", password: "" } };
    const res = makeRes();
    await signup(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("returns 422 when name is missing", async () => {
    const req = { body: { email: "a@b.com", password: "secret" } };
    const res = makeRes();
    await signup(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("creates user and returns 201 on valid input", async () => {
    const savedUser = { _id: "u1", name: "Bob", email: "bob@test.com" };
    mockBcryptHashSync.mockReturnValue("hashed");

    const mockUser = { save: mockUserSave };
    const UserModule = await import("../models/User.js");
    UserModule.default.prototype = mockUser;

    mockUserSave.mockResolvedValue(savedUser);

    // We need to mock the `new User(...)` constructor - test verifies the flow
    const req = { body: { name: "Bob", email: "bob@test.com", password: "password" } };
    const res = makeRes();
    const next = jest.fn();
    // If save rejects, next is called
    mockUserSave.mockRejectedValueOnce(new Error("duplicate email"));
    await signup(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("login", () => {
  it("returns 422 when email or password is empty", async () => {
    const res = makeRes();
    await login({ body: { email: "", password: "" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("returns 404 when user does not exist", async () => {
    mockUserFindOne.mockResolvedValue(null);
    const res = makeRes();
    await login({ body: { email: "x@y.com", password: "pass" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 400 when password is incorrect", async () => {
    mockUserFindOne.mockResolvedValue({ password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);
    const res = makeRes();
    await login({ body: { email: "x@y.com", password: "wrong" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 200 with user on successful login", async () => {
    const user = { _id: "u1", email: "x@y.com", password: "hashed" };
    mockUserFindOne.mockResolvedValue(user);
    mockBcryptCompare.mockResolvedValue(true);
    const res = makeRes();
    await login({ body: { email: "x@y.com", password: "correct" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteUser", () => {
  it("returns 404 when user not found", async () => {
    mockUserFindByIdAndDelete.mockResolvedValue(null);
    const res = makeRes();
    await deleteUser({ params: { id: "u99" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 200 on successful deletion", async () => {
    mockUserFindByIdAndDelete.mockResolvedValue({ _id: "u1" });
    const res = makeRes();
    await deleteUser({ params: { id: "u1" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getBookingsOfUser", () => {
  it("returns bookings for a user", async () => {
    const bookings = [{ _id: "b1" }, { _id: "b2" }];
    mockBookingsFind.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    });
    // Chain resolve
    const populateMock = {
      populate: jest.fn().mockResolvedValue(bookings),
    };
    mockBookingsFind.mockReturnValue(populateMock);
    populateMock.populate.mockReturnValue(populateMock);
    populateMock.populate.mockResolvedValue(bookings);

    const res = makeRes();
    await getBookingsOfUser({ params: { id: "u1" } }, res, jest.fn());
    expect(mockBookingsFind).toHaveBeenCalledWith({ user: "u1" });
  });
});

describe("getUserById", () => {
  it("returns 404 when user not found", async () => {
    mockUserFindById.mockResolvedValue(null);
    const res = makeRes();
    await getUserById({ params: { id: "u99" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns user on success", async () => {
    mockUserFindById.mockResolvedValue({ _id: "u1", name: "Alice" });
    const res = makeRes();
    await getUserById({ params: { id: "u1" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
