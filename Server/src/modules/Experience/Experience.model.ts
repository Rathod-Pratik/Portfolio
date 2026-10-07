import mongoose, { type HydratedDocument } from "mongoose";
import type { IExperience } from './Experience.types.ts';

const experienceSchema = new mongoose.Schema<IExperience>(
  {
    year: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ExperienceDocument = HydratedDocument<IExperience>;

export const ExperienceModel = mongoose.model<IExperience>("experiences", experienceSchema);
