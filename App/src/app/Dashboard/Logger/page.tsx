"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { FiChevronDown, FiChevronRight, FiTrash2 } from "react-icons/fi";
import { apiClient } from "@apiClient";
import { CLEAR_LOGS, DELETE_LOG, GET_LOGS } from "@api";
import { Loading } from "@components";

type LogLevel = "info" | "warn" | "error" | "debug" | "http";

type LogEntry = {
  _id: string;
  level: LogLevel;
  message: string;
  context: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  createdAt: string;
  updatedAt: string;
};

type LogsResponse = {
  data: {
    logs: LogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  source: "cache" | "database";
};

type ApiError = {
  message?: string;
};

const levelStyles: Record<LogLevel, string> = {
  info: "bg-blue-500/20 text-blue-300",
  warn: "bg-yellow-500/20 text-yellow-300",
  error: "bg-red-500/20 text-red-300",
  debug: "bg-purple-500/20 text-purple-300",
  http: "bg-green-500/20 text-green-300",
};

export default function LoggerPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<"" | LogLevel>("");
  const [context, setContext] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery<LogsResponse["data"]>({
    queryKey: ["logs", page, level, context],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (level) params.set("level", level);
      if (context.trim()) params.set("context", context.trim());

      const response = await apiClient.get<LogsResponse>(
        `${GET_LOGS}?${params.toString()}`,
        { withCredentials: true }
      );
      return response.data.data;
    },
  });

  const handleAuthError = (error: unknown) => {
    const apiError = error as AxiosError<ApiError>;
    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
      toast.error("Access denied. Please login as admin.");
      return true;
    }
    return false;
  };

  const deleteLog = async (id: string) => {
    if (!window.confirm("Delete this log entry?")) return;

    try {
      await apiClient.delete(`${DELETE_LOG}/${id}`, { withCredentials: true });
      toast.success("Log deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    } catch (error) {
      if (!handleAuthError(error)) {
        const apiError = error as AxiosError<ApiError>;
        toast.error(apiError.response?.data?.message || "Failed to delete log.");
      }
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Clear all system logs? This cannot be undone.")) return;

    try {
      await apiClient.delete(CLEAR_LOGS, { withCredentials: true });
      toast.success("All logs cleared successfully.");
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    } catch (error) {
      if (!handleAuthError(error)) {
        const apiError = error as AxiosError<ApiError>;
        toast.error(apiError.response?.data?.message || "Failed to clear logs.");
      }
    }
  };

  const applyFilter = (value: string) => {
    setContext(value);
    setPage(1);
  };

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center"><Loading /></div>;
  }

  if (isError) {
    const apiError = error as AxiosError<ApiError>;
    return (
      <div className="p-6 text-red-400">
        {apiError.response?.data?.message || "Unable to load system logs."}
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <main className="p-4 text-white sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-gray-400">{data?.total ?? 0} total entries</p>
        </div>
        <button
          type="button"
          onClick={clearLogs}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
        >
          <FiTrash2 /> Clear all
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={level}
          onChange={(event) => {
            setLevel(event.target.value as "" | LogLevel);
            setPage(1);
          }}
          className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm"
          aria-label="Filter logs by level"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
          <option value="http">HTTP</option>
        </select>
        <input
          value={context}
          onChange={(event) => applyFilter(event.target.value)}
          placeholder="Filter by context"
          className="rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm"
          aria-label="Filter logs by context"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full bg-gray-800 text-sm">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Context</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No logs found.</td></tr>
            ) : logs.map((log) => (
              <tr key={log._id} className="border-t border-gray-700 align-top">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs uppercase ${levelStyles[log.level]}`}>
                    {log.level}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{log.context}</td>
                <td className="max-w-xl px-4 py-3 text-gray-200">
                  <div className="flex items-start gap-2">
                    {log.stack && (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                        aria-label={expanded === log._id ? "Collapse stack trace" : "Expand stack trace"}
                        className="mt-0.5 text-gray-400 hover:text-white"
                      >
                        {expanded === log._id ? <FiChevronDown /> : <FiChevronRight />}
                      </button>
                    )}
                    <div>
                      <p>{log.message}</p>
                      {expanded === log._id && (
                        <pre className="mt-3 max-w-full overflow-auto rounded bg-gray-950 p-3 text-xs text-red-200">
                          {log.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => deleteLog(log._id)} className="text-red-400 hover:text-red-300" aria-label="Delete log">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-4 py-5">
        <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50">
          Previous
        </button>
        <span className="text-sm text-gray-300">Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded bg-gray-700 px-4 py-2 disabled:opacity-50">
          Next
        </button>
      </div>
    </main>
  );
}
