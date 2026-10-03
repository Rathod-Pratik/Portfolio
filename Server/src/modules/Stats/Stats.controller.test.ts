import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { createMockRequest, createMockResponse } from "../../test-utils.ts";

jest.unstable_mockModule("../Auth/Auth.model.ts", () => ({
  AdminModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.unstable_mockModule("../Blog/Blog.model.ts", () => ({
  blogModel: {
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("../Note/Note.model.ts", () => ({
  NoteModel: {
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("../Project/Project.model.ts", () => ({
  Project: {
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("../Contact/contact.model.ts", () => ({
  contactModel: {
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("../Skill/Skills.model.ts", () => ({
  SkillsModel: {
    countDocuments: jest.fn(),
  },
}));

jest.unstable_mockModule("@utils", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { FetchStates, IncrementView } = await import("./Stats.controller.ts");
const { AdminModel } = await import("../Auth/Auth.model.ts");
const { blogModel } = await import("../Blog/Blog.model.ts");
const { NoteModel } = await import("../Note/Note.model.ts");
const { Project } = await import("../Project/Project.model.ts");
const { contactModel } = await import("../Contact/contact.model.ts");
const { SkillsModel } = await import("../Skill/Skills.model.ts");

describe("Stats Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FetchStates", () => {
    it("should return aggregated counts and admin views", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue({ view: 150 } as any);
      jest.mocked(blogModel.countDocuments).mockResolvedValue(5 as never);
      jest.mocked(Project.countDocuments).mockResolvedValue(12 as never);
      jest.mocked(NoteModel.countDocuments).mockResolvedValue(8 as never);
      jest.mocked(contactModel.countDocuments).mockResolvedValue(20 as never);
      jest.mocked(SkillsModel.countDocuments).mockResolvedValue(15 as never);

      await FetchStates(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        BlogLength: 5,
        ProjectLength: 12,
        NoteLength: 8,
        ContactLength: 20,
        SkillLength: 15,
        AdminView: 150,
      });
    });

    it("should return 0 for AdminView if no admin document is found", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockResolvedValue(null as never);
      jest.mocked(blogModel.countDocuments).mockResolvedValue(0 as never);
      jest.mocked(Project.countDocuments).mockResolvedValue(0 as never);
      jest.mocked(NoteModel.countDocuments).mockResolvedValue(0 as never);
      jest.mocked(contactModel.countDocuments).mockResolvedValue(0 as never);
      jest.mocked(SkillsModel.countDocuments).mockResolvedValue(0 as never);

      await FetchStates(req, res as any);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ AdminView: 0 })
      );
    });

    it("should return 500 on database error", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOne).mockRejectedValue(new Error("DB error") as never);

      await FetchStates(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe("IncrementView", () => {
    it("should increment view and return updated count", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOneAndUpdate).mockResolvedValue({ view: 151 } as any);

      await IncrementView(req, res as any);

      expect(AdminModel.findOneAndUpdate).toHaveBeenCalledWith(
        {},
        { $inc: { view: 1 } },
        { new: true, upsert: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "View incremented successfully",
        view: 151,
      });
    });

    it("should return 500 if update returns null", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOneAndUpdate).mockResolvedValue(null as never);

      await IncrementView(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Unable to update view" });
    });

    it("should return 500 on exception", async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      jest.mocked(AdminModel.findOneAndUpdate).mockRejectedValue(new Error("Mongo error") as never);

      await IncrementView(req, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });
});
