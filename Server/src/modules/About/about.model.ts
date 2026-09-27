import mongoose, { type HydratedDocument } from "mongoose";
import type { IAbout } from './About.types.ts';

const aboutSchema = new mongoose.Schema<IAbout>(
  {
    content: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
  },
);

export type AboutDocument = HydratedDocument<IAbout>;

export const AboutModel = mongoose.model<IAbout>("about", aboutSchema);
