import express from "express";
import {
  Login,
  Logout,
  forgotPassword,
  resetPassword,
  signup,
  verifyLoginOtp,
  verifyOtp,
} from "./Auth.controller.ts";
import { Validate } from "@Middleware/Validation.middleware.ts";
import {
  LoginSchema,
  SignupSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResetPasswordSchema,
  VerifyLoginOtpSchema,
} from "./Auth.validation.ts";

const route = express.Router();

route.post("/login", Validate(LoginSchema), Login);
route.post("/login-verify", Validate(VerifyLoginOtpSchema), verifyLoginOtp);
route.post("/signup", Validate(SignupSchema), signup);
route.get("/logout", Logout);
route.post("/forgot-password", Validate(ForgotPasswordSchema), forgotPassword);
route.post("/verify-otp", Validate(VerifyOtpSchema), verifyOtp);
route.post("/reset-password", Validate(ResetPasswordSchema), resetPassword);

export default route;