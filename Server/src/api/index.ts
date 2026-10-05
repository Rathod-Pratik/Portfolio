import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

import contactroutes from '@modules/Contact/Contact.route.ts';
import NoteRoutes from '@modules/Note/Note.route.ts';
import ProjectRoutes from '@modules/Project/Project.route.ts';
import SkillsRoutes from '@modules/Skill/Skill.route.ts';
import AuthRoutes from '@modules/Auth/Auth.route.ts';
import CVRoutes from '@modules/Resume/Resume.route.ts';
import BlogRoutes from '@modules/Blog/blog.routes.ts';
import StateRoutes from '@modules/Stats/States.routes.ts';
import ExperienceRoutes from '@modules/Experience/experience.route.ts';
import HeroRoutes from '@modules/Hero/hero.route.ts';
import ExpertiseRoutes from '@modules/Expertice/expertise.route.ts';
import AboutRoutes from '@modules/About/About.routes.ts';
import LoggerRoutes from '@modules/Logger/Logger.routes.ts';
import NotificationRoutes from '@modules/Notification/Notification.route.ts';

// Import workers for their startup side effects so every queue is processed.
import '@modules/About/About.worker.ts';
import '@modules/Blog/Blog.worker.ts';
import '@modules/Contact/Contact.worker.ts';
import '@modules/Experience/Experience.worker.ts';
import '@modules/Expertice/Expertise.worker.ts';
import '@modules/Hero/Hero.worker.ts';
import '@modules/Logger/Logger.worker.ts';
import '@modules/Notification/Notification.worker.ts';
import '@modules/Note/Note.worker.ts';
import '@modules/Project/Project.worker.ts';
import '@modules/Resume/Resume.worker.ts';
import '@modules/Skill/Skill.worker.ts';

import cookieParser from "cookie-parser";

import { ConnectToMongoDB } from '@utils';
import { connectRedis } from "@config/redis.ts";

const app = express();
app.use(cookieParser());
app.use(
  (() => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTED,
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    return cors({
      origin: allowedOrigins,
      methods: ["POST", "PUT", "DELETE", "GET"],
      credentials: true,
    });
  })(),
);

const databaseUri = process.env.Database;
if (!databaseUri) {
  throw new Error("Database connection string is missing");
}

ConnectToMongoDB(databaseUri);
connectRedis();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Backend is up");
});

app.use("/contact", contactroutes);
app.use("/note", NoteRoutes);
app.use("/auth", AuthRoutes);
app.use("/CV", CVRoutes);
app.use("/project", ProjectRoutes);
app.use("/skills", SkillsRoutes);
app.use("/blogs", BlogRoutes);
app.use("/states", StateRoutes);
app.use("/experiences", ExperienceRoutes);
app.use("/hero", HeroRoutes);
app.use("/expertise", ExpertiseRoutes);
app.use("/about", AboutRoutes);
app.use("/logger", LoggerRoutes);
app.use("/notifications", NotificationRoutes);

app.get("/auth/check", (req, res) => {
  const token = req.cookies.admin;
  const jwtSecret = process.env.JWT_SECRET;

  if (!token) return res.status(401).json({ authenticated: false });
  if (!jwtSecret) {
    return res.status(500).json({ authenticated: false, message: "JWT secret is missing" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ authenticated: true, user: decoded });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("JWT verify failed:", errorMessage);
    res.status(401).json({ authenticated: false });
  }
});

export default app;
