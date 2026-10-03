import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
}).strict();

export const SignupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
}).strict();

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
}).strict();

export const VerifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  otp: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => val.length === 6 && /^\d+$/.test(val), {
      message: "OTP must be a 6-digit number",
    }),
}).strict();

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(6, "New password must be at least 6 characters long"),
}).strict();

export const VerifyLoginOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  otp: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => val.length === 6 && /^\d+$/.test(val), {
      message: "OTP must be a 6-digit number",
    }),
}).strict();
