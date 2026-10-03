import { AdminModel } from "./Auth.model.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import {
  sendForgotPasswordOtpEmail,
  sendLoginOtpEmail,
  getCache,
  setCache,
  deleteCache,
  logger,
} from "@utils";
import type { CookieOptions, Response, Request } from "express";
import {
  LoginSchema,
  SignupSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResetPasswordSchema,
  VerifyLoginOtpSchema,
} from "./Auth.validation.ts";
import type {
  IOtpCacheData,
  JwtTokenPayload,
} from "./Auth.types.ts";

const OTP_TTL_SECONDS = 600; // 10 minutes

const getForgotOtpCacheKey = (email: string): string =>
  `otp:forgot-password:${email.toLowerCase().trim()}`;

const getLoginOtpCacheKey = (email: string): string =>
  `otp:login:${email.toLowerCase().trim()}`;

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const Login = async (req: Request, res: Response) => {
  const validation = LoginSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Login validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Invalid credentials",
    });
  }

  try {
    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await AdminModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      await logger.warn(`Login failed: Account not found for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({
        error: "Account not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await logger.warn(`Login failed: Invalid password for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({
        error: "Please enter valid Password",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      await logger.error("JWT_SECRET is not configured", { context: "AuthController" });
      return res.status(500).json({ error: "JWT secret is missing" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "1d",
      }
    );

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("admin", token, cookieOptions);

    await logger.info(`User logged in successfully: ${normalizedEmail}`, {
      context: "AuthController",
      metadata: { userId: user._id.toString() },
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        FirstName: user.FirstName,
        LastName: user.LastName,
      },
    });
  } catch (error) {
    await logger.error(
      "Error during login",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  const validation = VerifyLoginOtpSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Verify login OTP validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Email and OTP are required",
    });
  }

  try {
    const { email, otp } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user) {
      await logger.warn(`Login OTP verification: Account not found for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(404).json({ error: "Account not found" });
    }

    const cacheKey = getLoginOtpCacheKey(normalizedEmail);
    const cachedOtpData = await getCache<IOtpCacheData>(cacheKey);

    let isMatch = false;

    if (cachedOtpData) {
      isMatch = await bcrypt.compare(otp, cachedOtpData.otpHash);
    } else if (user.loginOtpHash && user.loginOtpExpiresAt) {
      if (user.loginOtpExpiresAt.getTime() >= Date.now()) {
        isMatch = await bcrypt.compare(otp, user.loginOtpHash);
      }
    }

    if (!cachedOtpData && (!user.loginOtpHash || !user.loginOtpExpiresAt)) {
      await logger.warn(`Login OTP verification: OTP not requested for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({ error: "OTP not requested or expired" });
    }

    if (!isMatch) {
      await logger.warn(`Login OTP verification: Invalid OTP for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await deleteCache(cacheKey);
    user.loginOtpHash = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    const tokenPayload: JwtTokenPayload = {
      id: user._id?.toString() || "",
      email: user.email,
      role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      await logger.error("JWT_SECRET is not configured", { context: "AuthController" });
      return res.status(500).json({ error: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "1d" });

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("admin", token, cookieOptions);

    await logger.info(`Admin login verified with OTP: ${normalizedEmail}`, {
      context: "AuthController",
    });

    return res.status(200).json({
      userInfo: user,
      token,
      message: "Admin login successful",
    });
  } catch (error) {
    await logger.error(
      "Login OTP verification error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const signup = async (req: Request, res: Response) => {
  const validation = SignupSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Signup validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Please fill all fields properly",
    });
  }

  try {
    const { email, password, name } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existUser = await AdminModel.findOne({ email: normalizedEmail });
    if (existUser) {
      await logger.warn(`Signup failed: User already exists (${normalizedEmail})`, {
        context: "AuthController",
      });
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const [firstName, ...rest] = name.split(" ");
    const lastName = rest.join(" ") || "";

    const user = await AdminModel.create({
      FirstName: firstName,
      LastName: lastName,
      email: normalizedEmail,
      password: hashPassword,
    });

    await logger.info(`New user registered: ${normalizedEmail}`, {
      context: "AuthController",
      metadata: { userId: user._id.toString() },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        email: user.email,
        FirstName: user.FirstName,
        LastName: user.LastName,
      },
    });
  } catch (error) {
    await logger.error(
      "Signup error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: toErrorMessage(error) });
  }
};

export const Logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    await logger.info("Admin logged out successfully", { context: "AuthController" });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    await logger.error(
      "Logout error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: "Logout failed" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const validation = ForgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Forgot password validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Valid email is required",
    });
  }

  try {
    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user) {
      await logger.warn(`Forgot password: Account not found for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(404).json({ error: "Account not found" });
    }

    // 1. Generate 6-digit random OTP
    const otp = String(randomInt(100000, 1000000));

    // 2. Hash OTP for secure storage
    const otpHash = await bcrypt.hash(otp, 10);

    // 3. Cache OTP in Redis with 10 minutes TTL
    const cacheKey = getForgotOtpCacheKey(normalizedEmail);
    await setCache<IOtpCacheData>(
      cacheKey,
      {
        email: normalizedEmail,
        otpHash,
        isVerified: false,
        createdAt: Date.now(),
      },
      OTP_TTL_SECONDS
    );

    // 4. Send OTP email to user
    await sendForgotPasswordOtpEmail({ to: normalizedEmail, otp });

    await logger.info(`Forgot password OTP sent to email and cached in Redis: ${normalizedEmail}`, {
      context: "AuthController",
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      email: normalizedEmail,
    });
  } catch (error) {
    await logger.error(
      "Forgot password error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const validation = VerifyOtpSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Verify OTP validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Email and OTP are required",
    });
  }

  try {
    const { email, otp } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const cacheKey = getForgotOtpCacheKey(normalizedEmail);
    const cachedData = await getCache<IOtpCacheData>(cacheKey);

    if (!cachedData || !cachedData.otpHash) {
      await logger.warn(`Verify OTP: OTP expired or not requested for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({
        error: "OTP has expired or was not requested. Please request a new OTP.",
      });
    }

    const isMatch = await bcrypt.compare(otp, cachedData.otpHash);

    if (!isMatch) {
      await logger.warn(`Verify OTP: Invalid OTP entered for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark OTP as verified in Redis cache with remaining TTL
    await setCache<IOtpCacheData>(
      cacheKey,
      {
        ...cachedData,
        isVerified: true,
      },
      OTP_TTL_SECONDS
    );

    await logger.info(`OTP verified successfully in Redis for ${normalizedEmail}`, {
      context: "AuthController",
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    await logger.error(
      "OTP verification error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const validation = ResetPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Reset password validation failed", {
      context: "AuthController",
      metadata: { errors: validation.error.issues },
    });
    return res.status(400).json({
      error: validation.error.issues[0]?.message || "Valid email and password are required",
    });
  }

  try {
    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const cacheKey = getForgotOtpCacheKey(normalizedEmail);
    const cachedData = await getCache<IOtpCacheData>(cacheKey);

    if (!cachedData || !cachedData.isVerified) {
      await logger.warn(`Reset password rejected: OTP not verified for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(400).json({
        error: "OTP verification is required or has expired. Please verify OTP first.",
      });
    }

    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user) {
      await logger.warn(`Reset password: User not found for ${normalizedEmail}`, {
        context: "AuthController",
      });
      return res.status(404).json({ error: "Account not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Invalidate Redis OTP cache after successful reset
    await deleteCache(cacheKey);

    await logger.info(`Password reset successfully and Redis cache invalidated for ${normalizedEmail}`, {
      context: "AuthController",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    await logger.error(
      "Reset password error",
      error instanceof Error ? error : { context: "AuthController", metadata: { error: toErrorMessage(error) } }
    );
    return res.status(500).json({ error: "Failed to reset password" });
  }
};
