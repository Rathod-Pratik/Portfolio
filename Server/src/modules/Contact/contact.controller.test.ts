import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./contact.model.ts", () => ({
  contactModel: {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("./Contact.queue.ts", () => ({
  CreateContactJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
  sendDangerNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  getCache: jest.fn(),
  incrementCacheVersion: jest.fn(),
  getCacheVersion: jest.fn(),
  setCache: jest.fn(),
  ContactCacheKeys: {
    listVersion: jest.fn(() => "version:contact:list"),
    list: jest.fn((v: number, p: number, l: number) => `contact:list:${v}:${p}:${l}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  createContact,
  GetContact,
  UpdateContactStatus,
  DeleteContact,
} = await import("./Contact.controller.ts");

const { contactModel } = await import("./Contact.model.ts");
const { CreateContactJob } = await import("./Contact.queue.ts");
const {
  getCache,
  incrementCacheVersion,
  getCacheVersion,
  setCache,
} = await import("@utils");
const {
  sendInfoNotification,
  sendDangerNotification,
} = await import("@modules/Notification/Notification.service.ts");

describe("Contact Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createContact", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({
        body: { name: "", email: "invalid", mobile: "", message: "" },
      });
      const res = createMockResponse();

      await createContact(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(Array) })
      );
    });

    it("should queue contact creation and return 201 on success", async () => {
      const req = createMockRequest({
        body: {
          name: "John Doe",
          email: "johndoe@example.com",
          mobile: "9876543210",
          projectType: "Web App",
          budget: "$5000",
          message: "Hello there, love your work!",
        },
      });
      const res = createMockResponse();

      jest.mocked(CreateContactJob).mockResolvedValue({ id: "job-1" } as any);

      await createContact(req, res as any);

      expect(CreateContactJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Doe",
          email: "johndoe@example.com",
          mobile: "9876543210",
          message: "Hello there, love your work!",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contact created successfully",
      });
    });

    it("should return 500 when queue throws error", async () => {
      const req = createMockRequest({
        body: {
          name: "John Doe",
          email: "johndoe@example.com",
          mobile: "9876543210",
          projectType: "Web App",
          budget: "$5000",
          message: "Hello there, love your work!",
        },
      });
      const res = createMockResponse();

      jest.mocked(CreateContactJob).mockRejectedValue(new Error("Queue error") as never);

      await createContact(req, res as any);

      expect(sendDangerNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to create contact",
        error: "Queue error",
      });
    });
  });

  describe("GetContact", () => {
    it("should return cached contacts if available", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue([{ name: "Cached Contact" }] as never);

      await GetContact(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ name: "Cached Contact" }],
        source: "cache",
      });
    });

    it("should query database and set cache on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockContacts = [{ _id: "1", name: "Alice" }];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockContacts as never),
      };
      jest.mocked(contactModel.find).mockReturnValue(chain as any);

      await GetContact(req, res as any);

      expect(setCache).toHaveBeenCalledWith("contact:list:1:1:10", mockContacts, 3600);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockContacts,
        source: "database",
      });
    });

    it("should return 500 on database error", async () => {
      const req = createMockRequest({ query: {} });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockRejectedValue(new Error("Database error") as never);

      await GetContact(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("UpdateContactStatus", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: { _id: "", status: "unknown" } });
      const res = createMockResponse();

      await UpdateContactStatus(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if contact not found", async () => {
      const req = createMockRequest({
        body: { _id: "507f1f77bcf86cd799439011", status: "contacted" },
      });
      const res = createMockResponse();

      jest.mocked(contactModel.findByIdAndUpdate).mockResolvedValue(null as never);

      await UpdateContactStatus(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Contact not found",
      });
    });

    it("should update status, increment cache version and return 200 on success", async () => {
      const req = createMockRequest({
        body: { _id: "507f1f77bcf86cd799439011", status: "contacted" },
      });
      const res = createMockResponse();

      const updated = { _id: "507f1f77bcf86cd799439011", status: "contacted" };
      jest.mocked(contactModel.findByIdAndUpdate).mockResolvedValue(updated as any);

      await UpdateContactStatus(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalled();
      expect(sendInfoNotification).toHaveBeenCalledWith(
        "Contact Status Updated",
        "Contact status changed to contacted."
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updated,
      });
    });
  });

  describe("DeleteContact", () => {
    it("should return 400 on invalid params", async () => {
      const req = createMockRequest({ params: { _id: "" } });
      const res = createMockResponse();

      await DeleteContact(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if contact not found to delete", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(contactModel.findByIdAndUpdate).mockResolvedValue(null as never);

      await DeleteContact(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should soft delete contact and return 200", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(contactModel.findByIdAndUpdate).mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        isDeleted: true,
      } as any);

      await DeleteContact(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalled();
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Contact Deleted successfully",
      });
    });
  });
});
