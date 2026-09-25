import mongoose, {
  type HydratedDocument,
} from "mongoose";
import type { IBlog } from "@type";

const blogSchema = new mongoose.Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    coverImage: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    author: {
      type: String,
      default: "Admin",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export type BlogDocument =
  HydratedDocument<IBlog>;

const blogModel =
  mongoose.model<IBlog>(
    "Blog",
    blogSchema
  );

export default blogModel;