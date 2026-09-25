import { AdminModel } from './Admin.model.ts';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { sendForgotPasswordOtpEmail, sendLoginOtpEmail } from '@utils';
import type { CookieOptions, Response, Request } from 'express';
import type {
  ForgotPasswordRequestBody,
  JwtTokenPayload,
  LoginRequestBody,
  ResetPasswordRequestBody,
  SignupRequestBody,
  VerifyLoginOtpRequestBody,
  VerifyOtpRequestBody,
} from '@type';

type TypedRequest<TBody> = Request<Record<string, never>, unknown, TBody>;

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const Login = async (
  req: TypedRequest<LoginRequestBody>,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await AdminModel.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        error: "Account not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: "Please enter valid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", toErrorMessage(error));

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const verifyLoginOtp = async (req: TypedRequest<VerifyLoginOtpRequestBody>, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user || !user.loginOtpHash || !user.loginOtpExpiresAt) {
      return res.status(400).json({ error: "OTP not requested" });
    }

    if (user.loginOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(String(otp), user.loginOtpHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.loginOtpHash = null;
    user.loginOtpExpiresAt = null;
    await user.save();

    const tokenPayload: JwtTokenPayload = user.role
      ? { id: user.id, role: user.role }
      : { id: user.id };
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
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

    return res.status(200).json({
      userInfo: user,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Login OTP verification error:", toErrorMessage(error));
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const signup = async (req: TypedRequest<SignupRequestBody>, res: Response) => {
  try {
    const { email, password, name } = req.body;

    //Check if email and password are provided
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Please fill all the fields" });
    }
    //Check if user already exists
    const existUser = await AdminModel.findOne({ email });
    if (existUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const solt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, solt);
    const [firstName, ...rest] = name.split(" ");
    const lastName = rest.join(" ");
    const user = await AdminModel.create({
      FirstName: firstName,
      LastName: lastName,
      email: email.toLowerCase(),
      password: hashPassword,
    });

    return res.status(201).send({ user });
  } catch (error) {
    res.status(403).json({ error: toErrorMessage(error) });
  }
};

export const Logout = async (req: Request, res: Response) => {
  try {
    console.log("Cookies:", req.cookies);
    res.clearCookie("admin", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

export const forgotPassword = async (req: TypedRequest<ForgotPasswordRequestBody>, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    const otp = String(randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtpHash = otpHash;
    user.resetOtpExpiresAt = otpExpiresAt;
    user.resetOtpVerified = false;
    await user.save();

    await sendForgotPasswordOtpEmail({ to: normalizedEmail, otp });

    return res.status(200).json({
      message: "OTP sent successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Forgot password error:", toErrorMessage(error));
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req: TypedRequest<VerifyOtpRequestBody>, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
      return res.status(400).json({ error: "OTP not requested" });
    }

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const isMatch = await bcrypt.compare(String(otp), user.resetOtpHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.resetOtpVerified = true;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("OTP verification error:", toErrorMessage(error));
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const resetPassword = async (req: TypedRequest<ResetPasswordRequestBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await AdminModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (!user.resetOtpVerified) {
      return res.status(400).json({ error: "OTP verification is required" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    user.resetOtpVerified = false;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", toErrorMessage(error));
    return res.status(500).json({ error: "Failed to reset password" });
  }
};
