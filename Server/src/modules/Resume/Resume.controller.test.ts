import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Resume.model.ts", () => ({
  CVmodel: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.unstable_mockModule("./Resume.queue.ts", () => ({
  addCreateResumeJob: jest.fn(),
  addUpdateResumeJob: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  Get_Signed_Url: jest.fn(),
  getUploadedFile: jest.fn(),
  uploadFileToS3: jest.fn(),
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { AddCV, UpdateCV, GetCV } = await import("./Resume.controller.ts");
const { CVmodel } = await import("./Resume.model.ts");
const { addCreateResumeJob, addUpdateResumeJob } = await import("./Resume.queue.ts");
const { Get_Signed_Url, getUploadedFile, uploadFileToS3 } = await import("@utils");

describe("Resume Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("AddCV", () => {
    it("should return 400 if file is missing", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(null as any);

      await AddCV(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "CV file is required",
      });
    });

    it("should upload file, queue job and return 202 on success", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const mockFile = {
        buffer: Buffer.from("pdf-data"),
        originalname: "resume.pdf",
        mimetype: "application/pdf",
      };
      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(uploadFileToS3).mockResolvedValue({ key: "resume/resume.pdf" } as any);
      jest.mocked(addCreateResumeJob).mockResolvedValue({ id: "job-cv-1" } as any);

      await AddCV(req, res as any);

      expect(uploadFileToS3).toHaveBeenCalledWith(
        expect.objectContaining({ folderType: "Resume" })
      );
      expect(addCreateResumeJob).toHaveBeenCalledWith({
        CV: "resume/resume.pdf",
      });
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "CV creation job added successfully",
        jobId: "job-cv-1",
      });
    });
  });

  describe("UpdateCV", () => {
    it("should return 400 if _id is missing", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue({} as any);

      await UpdateCV(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "_id is required",
      });
    });

    it("should return 400 if file is missing", async () => {
      const req = createMockRequest({ body: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue(null as any);

      await UpdateCV(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "CV file is required",
      });
    });

    it("should return 404 if CV not found", async () => {
      const req = createMockRequest({ body: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getUploadedFile).mockReturnValue({ originalname: "cv.pdf" } as any);
      jest.mocked(CVmodel.findById).mockResolvedValue(null as never);

      await UpdateCV(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "CV not found",
      });
    });

    it("should upload file, queue update job and return 202 on success", async () => {
      const req = createMockRequest({ body: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockFile = {
        buffer: Buffer.from("pdf-data"),
        originalname: "new-cv.pdf",
        mimetype: "application/pdf",
      };
      const existing = { _id: "507f1f77bcf86cd799439011", CV: "old.pdf" };

      jest.mocked(getUploadedFile).mockReturnValue(mockFile as any);
      jest.mocked(CVmodel.findById).mockResolvedValue(existing as any);
      jest.mocked(uploadFileToS3).mockResolvedValue({ key: "resume/new-cv.pdf" } as any);
      jest.mocked(addUpdateResumeJob).mockResolvedValue({ id: "job-cv-update-1" } as any);

      await UpdateCV(req, res as any);

      expect(addUpdateResumeJob).toHaveBeenCalledWith("507f1f77bcf86cd799439011", {
        CV: "resume/new-cv.pdf",
      });
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "CV update job added successfully",
        jobId: "job-cv-update-1",
      });
    });
  });

  describe("GetCV", () => {
    it("should return 404 if no CV exists", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(CVmodel.findOne).mockResolvedValue(null as never);

      await GetCV(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "CV not found",
      });
    });

    it("should return signed URL for CV on success", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(CVmodel.findOne).mockResolvedValue({ CV: "resume/key.pdf" } as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url/cv.pdf" as never);

      await GetCV(req, res as any);

      expect(Get_Signed_Url).toHaveBeenCalledWith({ key: "resume/key.pdf" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: "https://signed.url/cv.pdf",
      });
    });
  });
});
