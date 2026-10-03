export interface IAdmin {
  _id?: string;
  FirstName: string;
  LastName: string;
  email: string;
  password: string;
  role?: string | undefined;
  loginOtpHash?: string | null | undefined;
  loginOtpExpiresAt?: Date | null | undefined;
  resetOtpHash?: string | null | undefined;
  resetOtpExpiresAt?: Date | null | undefined;
  resetOtpVerified?: boolean | undefined;
  view?: number | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IOtpCacheData {
  email: string;
  otpHash: string;
  isVerified?: boolean | undefined;
  createdAt?: number | undefined;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface VerifyLoginOtpRequestBody {
  email: string;
  otp: string;
}

export interface SignupRequestBody {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordRequestBody {
  email: string;
}

export interface VerifyOtpRequestBody {
  email: string;
  otp: string;
}

export interface ResetPasswordRequestBody {
  email: string;
  password: string;
}

export interface JwtTokenPayload {
  id: string;
  email?: string | undefined;
  role?: string | undefined;
}

export type LoginInput = LoginRequestBody;
export type SignupInput = SignupRequestBody;
export type ForgotPasswordInput = ForgotPasswordRequestBody;
export type VerifyOtpInput = VerifyOtpRequestBody;
export type ResetPasswordInput = ResetPasswordRequestBody;
export type VerifyLoginOtpInput = VerifyLoginOtpRequestBody;
