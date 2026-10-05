import { AdminModel } from '../Auth/Auth.model.ts';
import { blogModel } from '../Blog/blog.model.ts';
import { NoteModel } from '../Note/note.model.ts';
import { Project } from '../Project/project.model.ts';
import { contactModel } from '../Contact/contact.model.ts';
import { SkillsModel } from '../Skill/skills.model.ts';

import type { Request, Response } from 'express';
import { logger } from '@utils';

export const FetchStates = async (
  _req: Request,
  res: Response,
) => {
  try {
    const admin = await AdminModel.findOne();
    const BlogLength = await blogModel.countDocuments();
    const ProjectLength = await Project.countDocuments();
    const NoteLength = await NoteModel.countDocuments();
    const ContactLength = await contactModel.countDocuments();
    const SkillLength = await SkillsModel.countDocuments();

    await logger.info("Fetched dashboard stats successfully", { context: "StatsController" });

    return res.status(200).json({
      BlogLength,
      ProjectLength,
      NoteLength,
      ContactLength,
      SkillLength,
      AdminView: admin ? admin.view : 0,
    });
  } catch (error) {
    await logger.error(
      "FetchStates error",
      error instanceof Error ? error : { context: "StatsController", metadata: { error: String(error) } }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const IncrementView = async (
  _req: Request,
  res: Response,
) => {
  try {
    const admin = await AdminModel.findOneAndUpdate(
      {},
      { $inc: { view: 1 } },
      { new: true, upsert: true },
    );

    if (!admin) {
      await logger.warn("IncrementView: Unable to update view", { context: "StatsController" });
      return res.status(500).json({ message: "Unable to update view" });
    }

    await logger.info(`View count incremented to ${admin.view}`, { context: "StatsController" });

    return res
      .status(200)
      .json({ message: "View incremented successfully", view: admin.view });
  } catch (error) {
    await logger.error(
      "IncrementView error",
      error instanceof Error ? error : { context: "StatsController", metadata: { error: String(error) } }
    );
    return res
      .status(500)
      .json({ message: "Internal server error" });
  }
};

