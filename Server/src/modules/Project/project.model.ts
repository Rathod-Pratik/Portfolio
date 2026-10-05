import mongoose, { type HydratedDocument } from "mongoose";
import type { IProject } from './Project.types.ts';
import { is } from "zod/locales";

const projectSchema = new mongoose.Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    difficult: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
    },
    image: {
      type: String,
    },
    content: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
    }
  },
  { timestamps: true }
);

export type ProjectDocument = HydratedDocument<IProject>;

export const Project = mongoose.model<IProject>("Project", projectSchema);
