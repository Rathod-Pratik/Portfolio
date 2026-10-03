import type { Request } from "express";
import { jest } from "@jest/globals";

export interface MockResponse {
  status: ReturnType<typeof jest.fn>;
  json: ReturnType<typeof jest.fn>;
  send: ReturnType<typeof jest.fn>;
  cookie: ReturnType<typeof jest.fn>;
  clearCookie: ReturnType<typeof jest.fn>;
}

export const createMockRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as Request;
};

export const createMockResponse = (): MockResponse => {
  const res: Partial<MockResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as MockResponse;
};
