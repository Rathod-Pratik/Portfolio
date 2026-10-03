import { addLogJob } from "./Logger.queue.ts";
import type { LogLevel, ILoggerJob } from "./Logger.types.ts";

export const logMessage = async (logData: ILoggerJob) => {
  return await addLogJob(logData);
};

export const logger = {
  info: async (
    message: string,
    options?: { context?: string; metadata?: Record<string, unknown> }
  ) => {
    console.log(`[INFO] [${options?.context || "Application"}]: ${message}`);
    return await addLogJob({
      level: "info",
      message,
      context: options?.context,
      metadata: options?.metadata,
    });
  },

  warn: async (
    message: string,
    options?: { context?: string; metadata?: Record<string, unknown> }
  ) => {
    console.warn(`[WARN] [${options?.context || "Application"}]: ${message}`);
    return await addLogJob({
      level: "warn",
      message,
      context: options?.context,
      metadata: options?.metadata,
    });
  },

  error: async (
    message: string,
    errorOrOptions?: Error | { context?: string; metadata?: Record<string, unknown>; stack?: string }
  ) => {
    let stack: string | undefined;
    let context: string | undefined;
    let metadata: Record<string, unknown> | undefined;

    if (errorOrOptions instanceof Error) {
      stack = errorOrOptions.stack;
      metadata = { errorMessage: errorOrOptions.message };
    } else if (errorOrOptions) {
      stack = errorOrOptions.stack;
      context = errorOrOptions.context;
      metadata = errorOrOptions.metadata;
    }

    console.error(`[ERROR] [${context || "Application"}]: ${message}`, stack || "");
    return await addLogJob({
      level: "error",
      message,
      context,
      metadata,
      stack,
    });
  },

  debug: async (
    message: string,
    options?: { context?: string; metadata?: Record<string, unknown> }
  ) => {
    console.debug(`[DEBUG] [${options?.context || "Application"}]: ${message}`);
    return await addLogJob({
      level: "debug",
      message,
      context: options?.context,
      metadata: options?.metadata,
    });
  },

  http: async (
    message: string,
    options?: { context?: string; metadata?: Record<string, unknown> }
  ) => {
    console.log(`[HTTP] [${options?.context || "Application"}]: ${message}`);
    return await addLogJob({
      level: "http",
      message,
      context: options?.context,
      metadata: options?.metadata,
    });
  },
};
