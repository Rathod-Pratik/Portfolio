import { z } from "zod";

export const CreateLoggerSchema = z.object({
  level: z.enum(["info", "warn", "error", "debug", "http"]).default("info"),
  message: z.string().min(1, "Message is required"),
  context: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
}).strict();

export const LoggerIdSchema = z.object({
  id: z.string().min(1, "Log ID is required"),
}).strict();

export const LoggerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  level: z.enum(["info", "warn", "error", "debug", "http"]).optional(),
  context: z.string().optional(),
});
