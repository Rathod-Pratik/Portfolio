import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Project.model.ts", () => ({
  Project: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule("./Project.queue.ts", () => ({
  addCreateProjectJob: jest.fn(),
  addUpdateProjectJob: jest.fn(),
}));

jest.unstable_mockModule("@modules/Notification/Notification.index.ts", () => ({
  sendInfoNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  Get_Signed_Url: jest.fn(),
  getUploadedFile: jest.fn(),
  uploadFileToS3: jest.fn(),
  incrementCacheVersion: jest.fn(),
  ProjectCacheKeys: {
    listVersion: jest.fn(() => "version:project:list"),
    detailsVersion: jest.fn((id: string) => `version:project:${id}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  CreateProject,
  DeleteProject,
  GetProject,
  EditProject,
  GetProjectData,
} = await import("./Project.controller.ts");

const { Project } = await import("./Project.model.ts");
const { addCreateProjectJob, addUpdateProjectJob } = await import("./Project.queue.ts");
const {
  Get_Signed_Url,
  getUploadedFile,
  uploadFileToS3,
  incrementCacheVersion,
} = await import("@utils");
const { sendInfoNotification } = await import("@modules/Notification/Notification.index.ts");

describe("Project Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CreateProject", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await CreateProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if image file is missing", async () => {
      const req = createMockRequest({
        body: {
          title: "Portfolio",
          subtitle: "Personal web portfolio",
          description: "A full-featured portfolio web application",
          difficult: "Medium",
        },
      });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(undefined as any);

      await CreateProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should upload file, queue job and return 200 on success", async () => {
      const req = createMockRequest({
        body: {
          title: "Portfolio",
          subtitle: "Personal web portfolio",
          description: "A full-featured portfolio web application",
          difficult: "Medium",
        },
      });
      const res = createMockResponse();

      const mockFile = {
        buffer: Buffer.from("data"),
        originalname: "project.png",
        mimetype: "image/png",
      };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(uploadFileToS3).mockResolvedValue({ key: "project/img.png" } as any);
      jest.mocked(addCreateProjectJob).mockResolvedValue({ id: "job-proj-1" } as any);

      await CreateProject(req, res as any);

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(addCreateProjectJob).toHaveBeenCalledWith({
        title: "Portfolio",
        subtitle: "Personal web portfolio",
        difficult: "Medium",
        image: "project/img.png",
      });
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("DeleteProject", () => {
    it("should return 400 if _id param is missing", async () => {
      const req = createMockRequest({ params: {} });
      const res = createMockResponse();

      await DeleteProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if project not found", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(Project.findById).mockResolvedValue(null as never);

      await DeleteProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete project, increment cache versions and return 200", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", title: "Project A" };
      jest.mocked(Project.findById).mockResolvedValue(existing as any);
      jest.mocked(Project.findByIdAndDelete).mockResolvedValue(existing as any);

      await DeleteProject(req, res as any);

      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Project Deleted successfully",
      });
    });
  });

  describe("GetProject", () => {
    it("should return list of projects with signed image URLs", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      const mockProjects = [
        { title: "Proj 1", image: "key1" },
        { title: "Proj 2", image: null },
      ];

      const chain = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockResolvedValue(mockProjects as never),
      };
      jest.mocked(Project.find).mockReturnValue(chain as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed-url" as never);

      await GetProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
      });
    });
  });

  describe("EditProject", () => {
    it("should return 400 on validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await EditProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if _id is empty in body", async () => {
      const req = createMockRequest({
        body: { _id: "", description: "A valid description" },
      });
      const res = createMockResponse();

      await EditProject(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should upload file if present, queue update job and return 202", async () => {
      const req = createMockRequest({
        body: {
          _id: "507f1f77bcf86cd799439011",
          title: "New Title",
          subtitle: "New Subtitle",
          description: "New Description",
          difficult: "Easy",
        },
      });
      const res = createMockResponse();

      const mockFile = {
        buffer: Buffer.from("data"),
        originalname: "new.png",
        mimetype: "image/png",
      };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(uploadFileToS3).mockResolvedValue({ key: "project/new.png" } as any);
      jest.mocked(addUpdateProjectJob).mockResolvedValue({ id: "job-edit-1" } as any);

      await EditProject(req, res as any);

      expect(uploadFileToS3).toHaveBeenCalled();
      expect(addUpdateProjectJob).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          title: "New Title",
          subtitle: "New Subtitle",
          difficult: "Easy",
          description: "New Description",
          image: "project/new.png",
        })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("GetProjectData", () => {
    it("should return 400 if _id param is missing", async () => {
      const req = createMockRequest({ params: {} });
      const res = createMockResponse();

      await GetProjectData(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if project is not found", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(Project.findById).mockResolvedValue(null as never);

      await GetProjectData(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return project data with signed URL on success", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockProject = {
        _id: "507f1f77bcf86cd799439011",
        title: "Project Alpha",
        image: "img.jpg",
      };
      jest.mocked(Project.findById).mockResolvedValue(mockProject as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url/img.jpg" as never);

      await GetProjectData(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({ image: "https://signed.url/img.jpg" }),
        success: true,
      });
    });
  });
});
