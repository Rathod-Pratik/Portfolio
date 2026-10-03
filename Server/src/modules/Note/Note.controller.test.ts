import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("./Note.model.ts", () => ({
  NoteModel: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.unstable_mockModule("./Note.queue.ts", () => ({
  addCreateNoteJob: jest.fn(),
  addUpdateNoteJob: jest.fn(),
}));

jest.unstable_mockModule("../Notification/Notification.service.ts", () => ({
  sendInfoNotification: jest.fn(),
}));

jest.unstable_mockModule("@utils", () => ({
  Get_Signed_Url: jest.fn(),
  getCache: jest.fn(),
  getCacheVersion: jest.fn(),
  setCache: jest.fn(),
  uploadFileToS3: jest.fn(),
  incrementCacheVersion: jest.fn(),
  getFiles: jest.fn(),
  uploadWithRetry: jest.fn(),
  ImageFileSchema: {
    safeParse: jest.fn((file) => {
      if (!file) return { success: false, error: { issues: [{ message: "Image required" }] } };
      return { success: true, data: file };
    }),
  },
  PdfFileSchema: {
    safeParse: jest.fn((file) => {
      if (!file) return { success: false, error: { issues: [{ message: "PDF required" }] } };
      return { success: true, data: file };
    }),
  },
  NoteCacheKeys: {
    listVersion: jest.fn(() => "version:note:list"),
    list: jest.fn((v: number, p: number, l: number) => `note:list:${v}:${p}:${l}`),
    detailsVersion: jest.fn((id: string) => `version:note:${id}`),
    details: jest.fn((id: string, v: number) => `note:${id}:${v}`),
  },
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const {
  CreateNote,
  GetNote,
  GetNoteById,
  EditNote,
  DeleteNote,
} = await import("./Note.controller.ts");

const { NoteModel } = await import("./Note.model.ts");
const { addCreateNoteJob, addUpdateNoteJob } = await import("./Note.queue.ts");
const {
  Get_Signed_Url,
  getCache,
  getCacheVersion,
  setCache,
  uploadFileToS3,
  incrementCacheVersion,
  getFiles,
  uploadWithRetry,
} = await import("@utils");
const { sendInfoNotification } = await import("../Notification/Notification.service.ts");

describe("Note Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CreateNote", () => {
    it("should return 400 on body validation failure", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await CreateNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if image file is invalid or missing", async () => {
      const req = createMockRequest({
        body: { title: "Math Notes", description: "Calculus notes" },
      });
      const res = createMockResponse();

      jest.mocked(getFiles).mockReturnValue({ image: undefined, pdf: {} as any });

      await CreateNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 if PDF file is invalid or missing", async () => {
      const req = createMockRequest({
        body: { title: "Math Notes", description: "Calculus notes" },
      });
      const res = createMockResponse();

      jest.mocked(getFiles).mockReturnValue({ image: {} as any, pdf: undefined });

      await CreateNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should upload image and pdf, queue note creation and return 202", async () => {
      const req = createMockRequest({
        body: { title: "Math Notes", description: "Calculus notes" },
      });
      const res = createMockResponse();

      const mockImage = { originalname: "img.jpg" };
      const mockPdf = { originalname: "note.pdf" };
      jest.mocked(getFiles).mockReturnValue({ image: mockImage as any, pdf: mockPdf as any });
      jest.mocked(uploadWithRetry)
        .mockResolvedValueOnce({ key: "note/image.jpg" } as any)
        .mockResolvedValueOnce({ key: "note/file.pdf" } as any);
      jest.mocked(addCreateNoteJob).mockResolvedValue({ id: "job-note-1" } as any);

      await CreateNote(req, res as any);

      expect(uploadWithRetry).toHaveBeenCalledTimes(2);
      expect(addCreateNoteJob).toHaveBeenCalledWith({
        title: "Math Notes",
        description: "Calculus notes",
        note_image_url: "note/image.jpg",
        note_pdf_url: "note/file.pdf",
      });
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining("was added to the queue"),
        jobId: "job-note-1",
      });
    });
  });

  describe("GetNote", () => {
    it("should return cached notes if available", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue({ notes: [{ title: "Cached" }] } as never);

      await GetNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { notes: [{ title: "Cached" }] },
      });
    });

    it("should query database and generate signed URLs on cache miss", async () => {
      const req = createMockRequest({ query: { page: "1", limit: "10" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);

      const mockNotes = [
        { title: "Note 1", note_image_url: "key1.png", note_pdf_url: "key1.pdf" },
      ];
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotes as never),
      };
      jest.mocked(NoteModel.find).mockReturnValue(chain as any);
      jest.mocked(NoteModel.countDocuments).mockResolvedValue(1 as never);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url" as never);

      await GetNote(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          notes: expect.any(Array),
          total: 1,
        }),
      });
    });
  });

  describe("GetNoteById", () => {
    it("should return 400 on invalid note ID param", async () => {
      const req = createMockRequest({ params: { _id: "" } });
      const res = createMockResponse();

      await GetNoteById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if note not found in database", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(NoteModel.findById).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null as never),
      } as any);

      await GetNoteById(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Note not found",
      });
    });

    it("should return signed URLs for note on DB hit", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const mockNote = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Note",
        note_image_url: "img.jpg",
        note_pdf_url: "doc.pdf",
      };

      jest.mocked(getCacheVersion).mockResolvedValue(1 as never);
      jest.mocked(getCache).mockResolvedValue(null as never);
      jest.mocked(NoteModel.findById).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockNote as never),
      } as any);
      jest.mocked(Get_Signed_Url).mockResolvedValue("https://signed.url" as never);

      await GetNoteById(req, res as any);

      expect(setCache).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          note_image_url: "https://signed.url",
          note_pdf_url: "https://signed.url",
        }),
      });
    });
  });

  describe("EditNote", () => {
    it("should return 400 on invalid body validation", async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();

      await EditNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if note does not exist", async () => {
      const req = createMockRequest({
        body: { _id: "507f1f77bcf86cd799439011", title: "Updated" },
      });
      const res = createMockResponse();

      jest.mocked(getFiles).mockReturnValue({ image: undefined, pdf: undefined });
      jest.mocked(NoteModel.findById).mockResolvedValue(null as never);

      await EditNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should upload new files, queue update job and return 202 on success", async () => {
      const req = createMockRequest({
        body: { _id: "507f1f77bcf86cd799439011", title: "Updated Title" },
      });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", title: "Old Title" };
      const mockPdf = { buffer: Buffer.from("pdf"), originalname: "n.pdf", mimetype: "application/pdf" };
      const mockImg = { buffer: Buffer.from("img"), originalname: "i.png", mimetype: "image/png" };

      jest.mocked(getFiles).mockReturnValue({ image: mockImg as any, pdf: mockPdf as any });
      jest.mocked(NoteModel.findById).mockResolvedValue(existing as any);
      jest.mocked(uploadFileToS3)
        .mockResolvedValueOnce({ key: "note/pdf.pdf" } as any)
        .mockResolvedValueOnce({ key: "note/img.png" } as any);
      jest.mocked(addUpdateNoteJob).mockResolvedValue({ id: "job-update-1" } as any);

      await EditNote(req, res as any);

      expect(uploadFileToS3).toHaveBeenCalledTimes(2);
      expect(addUpdateNoteJob).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          title: "Updated Title",
          note_pdf_url: "note/pdf.pdf",
          note_image_url: "note/img.png",
        })
      );
      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe("DeleteNote", () => {
    it("should return 400 on invalid params", async () => {
      const req = createMockRequest({ params: { _id: "" } });
      const res = createMockResponse();

      await DeleteNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if note not found", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      jest.mocked(NoteModel.findById).mockResolvedValue(null as never);

      await DeleteNote(req, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete note, increment cache and return 200", async () => {
      const req = createMockRequest({ params: { _id: "507f1f77bcf86cd799439011" } });
      const res = createMockResponse();

      const existing = { _id: "507f1f77bcf86cd799439011", title: "Note" };
      jest.mocked(NoteModel.findById).mockResolvedValue(existing as any);
      jest.mocked(NoteModel.findByIdAndDelete).mockResolvedValue(existing as any);

      await DeleteNote(req, res as any);

      expect(NoteModel.findByIdAndDelete).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
      expect(incrementCacheVersion).toHaveBeenCalledTimes(2);
      expect(sendInfoNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Note deleted successfully",
      });
    });
  });
});
