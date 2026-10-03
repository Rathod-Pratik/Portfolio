import type { Request, Response } from "express";
import { LoggerModel } from "./Logger.model.ts";
import { addLogJob } from "./Logger.queue.ts";
import { CreateLoggerSchema, LoggerIdSchema, LoggerQuerySchema } from "./Logger.validation.ts";
import { getCache, setCache, getCacheVersion, LoggerCacheKeys, incrementCacheVersion } from "@utils";

export const getLogs = async (req: Request, res: Response) => {
  try {
    const queryValidation = LoggerQuerySchema.safeParse(req.query);

    const page = queryValidation.success ? queryValidation.data.page : 1;
    const limit = queryValidation.success ? queryValidation.data.limit : 10;
    const level = queryValidation.success ? queryValidation.data.level : undefined;
    const context = queryValidation.success ? queryValidation.data.context : undefined;

    const version = await getCacheVersion(LoggerCacheKeys.listVersion());
    const filterKey = `${level || "all"}:${context || "all"}`;
    const cacheKey = `${LoggerCacheKeys.list(version, page, limit, filterKey)}`;

    const cachedLogs = await getCache(cacheKey);
    if (cachedLogs) {
      return res.status(200).json({
        data: cachedLogs,
        source: "cache",
      });
    }

    const filter: Record<string, unknown> = {};
    if (level) filter.level = level;
    if (context) filter.context = context;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      LoggerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoggerModel.countDocuments(filter),
    ]);

    const result = {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, result, 300);

    return res.status(200).json({
      data: result,
      source: "database",
    });
  } catch (error) {
    console.error("Get Logs error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getLogById = async (req: Request, res: Response) => {
  try {
    const validation = LoggerIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues,
      });
    }

    const { id } = validation.data;
    const version = await getCacheVersion(LoggerCacheKeys.detailsVersion(id));
    const cacheKey = `${LoggerCacheKeys.details(id, version)}`;

    const cachedLog = await getCache(cacheKey);
    if (cachedLog) {
      return res.status(200).json({
        data: cachedLog,
        source: "cache",
      });
    }

    const log = await LoggerModel.findById(id).lean();
    if (!log) {
      return res.status(404).json({
        message: "Log entry not found",
      });
    }

    await setCache(cacheKey, log, 600);

    return res.status(200).json({
      data: log,
      source: "database",
    });
  } catch (error) {
    console.error("Get Log by ID error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const createLog = async (req: Request, res: Response) => {
  const validate = CreateLoggerSchema.safeParse(req.body);

  if (!validate.success) {
    return res.status(400).json({
      message: validate.error.issues,
    });
  }

  const { level, message, context, metadata, stack } = validate.data;

  try {
    const job = await addLogJob({
      level,
      message,
      context,
      metadata,
      stack,
    });

    return res.status(202).json({
      message: "Log queued successfully",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Create Log error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const deleteLog = async (req: Request, res: Response) => {
  try {
    const validation = LoggerIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues,
      });
    }

    const { id } = validation.data;
    const log = await LoggerModel.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({
        message: "Log entry not found",
      });
    }

    await incrementCacheVersion(LoggerCacheKeys.listVersion());
    await incrementCacheVersion(LoggerCacheKeys.detailsVersion(id));

    return res.status(200).json({
      message: "Log deleted successfully",
    });
  } catch (error) {
    console.error("Delete Log error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const clearLogs = async (req: Request, res: Response) => {
  try {
    await LoggerModel.deleteMany({});
    await incrementCacheVersion(LoggerCacheKeys.listVersion());

    return res.status(200).json({
      message: "All logs cleared successfully",
    });
  } catch (error) {
    console.error("Clear Logs error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
