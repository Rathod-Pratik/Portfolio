import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Auth.model.ts", () => ({
  AdminModel: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(),
  },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.unstable_mockModule("@utils", () => ({
  sendForgotPasswordOtpEmail: jest.fn(),
  sendLoginOtpEmail: jest.fn(),
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  Login,
  verifyLoginOtp,
  signup,
  Logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = await import("./Auth.controller.ts");

const { AdminModel } = await import("./Auth.model.ts");
const { default: jwt } = await import("jsonwebtoken");
const { default: bcrypt } = await import("bcryptjs");
const {
  sendForgotPasswordOtpEmail,
  getCache,
  setCache,
  deleteCache,
} = await import("@utils");

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-key";
  });

  describe("Login", () => {
    it("should return 400 on invalid input validation", async () => {
      const req = createMockRequest({
        body: { email: "invalid-email", password: "" },
      });
      const res = createMockResponse();

      await Login(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it("should return 400 if user account is not found", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", password: "Password123!" },
      });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue(null as never);

      await Login(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Account not found" });
    });

    it("should return 400 if password does not match", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", password: "WrongPassword!" },
      });
      const res = createMockResponse();

      const mockUser = {
        _id: "user-1",
        email: "user@example.com",
        password: "hashed-password",
      };
      jest.mocked(AdminModel.findOne).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await Login(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Please enter valid Password",
      });
    });

    it("should return 500 if JWT_SECRET is missing", async () => {
      delete process.env.JWT_SECRET;

      const req = createMockRequest({
        body: { email: "user@example.com", password: "Password123!" },
      });
      const res = createMockResponse();

      const mockUser = {
        _id: "user-1",
        email: "user@example.com",
        password: "hashed-password",
        role: "admin",
      };
      jest.mocked(AdminModel.findOne).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await Login(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "JWT secret is missing",
      });
    });

    it("should set cookie and return token on successful login", async () => {
      process.env.JWT_SECRET = "mysecret";
      const req = createMockRequest({
        body: { email: "user@example.com", password: "Password123!" },
      });
      const res = createMockResponse();

      const mockUser = {
        _id: "user-123",
        email: "user@example.com",
        password: "hashed-password",
        role: "admin",
        FirstName: "John",
        LastName: "Doe",
      };
      jest.mocked(AdminModel.findOne).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      jest.mocked(jwt.sign).mockReturnValue("fake-jwt-token" as any);

      await Login(req, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        "admin",
        "fake-jwt-token",
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: "fake-jwt-token",
          user: expect.objectContaining({
            id: "user-123",
            email: "user@example.com",
          }),
        })
      );
    });
  });

  describe("verifyLoginOtp", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({
        body: { email: "invalid", otp: "" },
      });
      const res = createMockResponse();

      await verifyLoginOtp(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if user not found", async () => {
      const req = createMockRequest({
        body: { email: "test@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue(null as never);

      await verifyLoginOtp(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Account not found" });
    });

    it("should return 400 if OTP not requested or expired", async () => {
      const req = createMockRequest({
        body: { email: "test@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue({
        _id: "user-1",
        email: "test@example.com",
        loginOtpHash: null,
      } as any);
      jest.mocked(getCache).mockResolvedValue(null as never);

      await verifyLoginOtp(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "OTP not requested or expired",
      });
    });

    it("should verify OTP via cache, set cookie, and return token", async () => {
      const req = createMockRequest({
        body: { email: "test@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      const mockUser = {
        _id: "user-1",
        email: "test@example.com",
        role: "admin",
        loginOtpHash: "hash",
        loginOtpExpiresAt: new Date(Date.now() + 60000),
        save: jest.fn().mockResolvedValue(true as never),
      };
      jest.mocked(AdminModel.findOne).mockResolvedValue(mockUser as any);
      jest.mocked(getCache).mockResolvedValue({
        otpHash: "cachedHash",
        email: "test@example.com",
      } as never);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      jest.mocked(jwt.sign).mockReturnValue("mock-token" as any);

      await verifyLoginOtp(req, res as any);

      expect(deleteCache).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Admin login successful",
          token: "mock-token",
        })
      );
    });
  });

  describe("signup", () => {
    it("should return 400 on invalid input", async () => {
      const req = createMockRequest({
        body: { email: "invalid", password: "123", name: "" },
      });
      const res = createMockResponse();

      await signup(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if user already exists", async () => {
      const req = createMockRequest({
        body: {
          email: "exist@example.com",
          password: "Password123!",
          name: "John Doe",
        },
      });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue({ id: "1" } as any);

      await signup(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "User already exists" });
    });

    it("should create user and return 201 on success", async () => {
      const req = createMockRequest({
        body: {
          email: "new@example.com",
          password: "Password123!",
          name: "Johnathan Doe",
        },
      });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue(null as never);
      jest.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
      jest.mocked(bcrypt.hash).mockResolvedValue("hashedPass" as never);
      jest.mocked(AdminModel.create).mockResolvedValue({
        _id: "user-new",
        email: "new@example.com",
        FirstName: "Johnathan",
        LastName: "Doe",
      } as any);

      await signup(req, res as any);

      expect(AdminModel.create).toHaveBeenCalledWith({
        FirstName: "Johnathan",
        LastName: "Doe",
        email: "new@example.com",
        password: "hashedPass",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Account created successfully",
        })
      );
    });
  });

  describe("Logout", () => {
    it("should clear cookie and return 200", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await Logout(req, res as any);

      expect(res.clearCookie).toHaveBeenCalledWith(
        "admin",
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });
  });

  describe("forgotPassword", () => {
    it("should return 400 on invalid email", async () => {
      const req = createMockRequest({ body: { email: "invalid" } });
      const res = createMockResponse();

      await forgotPassword(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if account does not exist", async () => {
      const req = createMockRequest({ body: { email: "unknown@example.com" } });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue(null as never);

      await forgotPassword(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Account not found" });
    });

    it("should generate OTP, set cache, send email and return 200", async () => {
      const req = createMockRequest({ body: { email: "user@example.com" } });
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue({
        email: "user@example.com",
      } as any);
      jest.mocked(bcrypt.hash).mockResolvedValue("otp-hash" as never);

      await forgotPassword(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(sendForgotPasswordOtpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          otp: expect.any(String),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "OTP sent successfully to your email",
        })
      );
    });
  });

  describe("verifyOtp", () => {
    it("should return 400 if OTP is not in cache", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      jest.mocked(getCache).mockResolvedValue(null as never);

      await verifyOtp(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("expired"),
        })
      );
    });

    it("should return 400 if OTP does not match hash", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      jest.mocked(getCache).mockResolvedValue({
        otpHash: "storedHash",
        email: "user@example.com",
      } as never);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await verifyOtp(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid OTP" });
    });

    it("should set isVerified: true in cache and return 200 on valid OTP", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", otp: "123456" },
      });
      const res = createMockResponse();

      jest.mocked(getCache).mockResolvedValue({
        otpHash: "storedHash",
        email: "user@example.com",
        isVerified: false,
      } as never);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await verifyOtp(req, res as any);

      expect(setCache).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ isVerified: true }),
        expect.any(Number)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OTP verified successfully",
        email: "user@example.com",
      });
    });
  });

  describe("resetPassword", () => {
    it("should return 400 if OTP is not verified", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", password: "NewPassword123!" },
      });
      const res = createMockResponse();

      jest.mocked(getCache).mockResolvedValue({ isVerified: false } as never);

      await resetPassword(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("OTP verification is required"),
        })
      );
    });

    it("should reset password, delete cache, and return 200 on success", async () => {
      const req = createMockRequest({
        body: { email: "user@example.com", password: "NewPassword123!" },
      });
      const res = createMockResponse();

      const mockUser = {
        email: "user@example.com",
        password: "",
        save: jest.fn().mockResolvedValue(true as never),
      };
      jest.mocked(getCache).mockResolvedValue({ isVerified: true } as never);
      jest.mocked(AdminModel.findOne).mockResolvedValue(mockUser as any);
      jest.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
      jest.mocked(bcrypt.hash).mockResolvedValue("newHashedPassword" as never);

      await resetPassword(req, res as any);

      expect(mockUser.password).toBe("newHashedPassword");
      expect(mockUser.save).toHaveBeenCalled();
      expect(deleteCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Password reset successfully",
      });
    });
  });
});
