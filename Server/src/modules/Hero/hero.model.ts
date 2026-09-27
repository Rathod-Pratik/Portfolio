import mongoose, { type HydratedDocument } from "mongoose";
import type { IHero } from "./Hero.types.ts";

const heroSchema = new mongoose.Schema<IHero>(
  {
    greeting: {
      type: String,
    },
    name: {
      type: String,
    },
    roles: {
      type: [String],
    },
    description: {
      type: String
    },
    image: {
      type: String
    },
  },
  {
    timestamps: true,
  },
);

export type HeroDocument = HydratedDocument<IHero>;

export const HeroModel = mongoose.model<IHero>("hero", heroSchema);
