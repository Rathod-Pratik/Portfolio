import mongoose, { type HydratedDocument } from "mongoose";
import type { IAdmin } from "@type";

const AdminSchema = new mongoose.Schema<IAdmin>(
  {
    FirstName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    LastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    loginOtpHash: {
      type: String,
      default: null,
    },
    loginOtpExpiresAt: {
      type: Date,
      default: null,
    },
    resetOtpHash: {
      type: String,
      default: null,
    },
    resetOtpExpiresAt: {
      type: Date,
      default: null,
    },
    resetOtpVerified: {
      type: Boolean,
      default: false,
    },
    view: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export type AdminDocument = HydratedDocument<IAdmin>;

export const AdminModel = mongoose.model<IAdmin>("user", AdminSchema);
