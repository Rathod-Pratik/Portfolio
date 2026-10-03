import mongoose, { type HydratedDocument } from "mongoose";
import type { ILogger } from "./Logger.types.ts";

const loggerSchema = new mongoose.Schema<ILogger>(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error", "debug", "http"],
      default: "info",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    context: {
      type: String,
      default: "Application",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    stack: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export type LoggerDocument = HydratedDocument<ILogger>;

export const LoggerModel = mongoose.model<ILogger>("logger", loggerSchema);
