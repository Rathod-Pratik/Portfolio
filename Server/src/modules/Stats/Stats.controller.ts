import { AdminModel } from '../Auth/Admin.model.ts';
import blogModel from '../Blog/Blog.model.ts';
import { NoteModel } from '../Note/Note.model.ts';
import { Project } from '../Project/project.model.ts';
import { contactModel } from '../Contact/contact.model.ts';
import { SkillsModel } from '../Skill/skills.model.ts';
import type { Request, Response } from 'express';
import type { FetchStatesResponse, IncrementViewResponse } from '@type';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const FetchStates = async (
  _req: Request,
  res: Response<FetchStatesResponse | { message: string }>,
) => {
  try {
    const admin = await AdminModel.findOne();
    const BlogLength = await blogModel.countDocuments();
    const ProjectLength = await Project.countDocuments();
    const NoteLength = await NoteModel.countDocuments();
    const ContactLength = await contactModel.countDocuments();
    const SkillLength = await SkillsModel.countDocuments();

    return res.status(200).json({
      BlogLength,
      ProjectLength,
      NoteLength,
      ContactLength,
      SkillLength,
      AdminView: admin ? admin.view : 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const IncrementView = async (
  _req: Request,
  res: Response<IncrementViewResponse | { message: string; error?: string }>,
) => {
  try {
    const admin = await AdminModel.findOneAndUpdate(
      {},
      { $inc: { view: 1 } },
      { new: true, upsert: true },
    );

    if (!admin) {
      return res.status(500).json({ message: "Unable to update view" });
    }

    return res
      .status(200)
      .json({ message: "View incremented successfully", view: admin.view });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: toErrorMessage(error) });
  }
};
