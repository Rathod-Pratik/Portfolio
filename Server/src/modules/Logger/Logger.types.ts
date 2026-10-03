export type LogLevel = "info" | "warn" | "error" | "debug" | "http";

export interface ILogger {
    level: LogLevel;
    message: string;
    context?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    stack?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}

export interface ILoggerJob {
    level: LogLevel;
    message: string;
    context?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    stack?: string | undefined;
}

export interface ILoggerQuery {
    page?: number | undefined;
    limit?: number | undefined;
    level?: LogLevel | undefined;
    context?: string | undefined;
}
