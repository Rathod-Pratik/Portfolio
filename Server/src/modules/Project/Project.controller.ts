import { Project } from './Project.model.ts';
import { Get_Signed_Url, getUploadedFile, uploadFileToS3 } from '@utils';
import type { Request, Response } from 'express';
import { CreateProjectSchema, EditProjectSchema } from './Project.validation.ts';
import { addCreateProjectJob, addUpdateProjectJob } from './Project.queue.ts';
import { sendInfoNotification } from '@modules/Notification/Notification.index.ts';

export const CreateProject = async (
  req: Request,
  res: Response,
) => {
  const validation = CreateProjectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const {
      title,
      subtitle,
      difficult
    } = validation.data;
    const file = getUploadedFile(req);

    const uploadedFile = await uploadFileToS3({
      buffer: file.buffer,
      fileName: file.originalname,
      fileType: file.mimetype,
      folderType: 'Project',
    });

    const job = await addCreateProjectJob({
      title,
      subtitle,
      difficult,
      image: uploadedFile.key,
    });

    await sendInfoNotification(
      "Project Created",
      `Project "${title}" was added to the queue and is being processed.`,
    );

    return res.status(200).json({ success: true, message: 'Project created successfully', jobId: job.id });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

export const DeleteProject = async (
  req: Request,
  res: Response,
) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      return res.status(200).send("_id is required");
    }
    const projectData = await Project.findById(_id);
    if (!projectData) {
      return res.status(400).send("Project not found");
    }

    const project = await Project.findByIdAndDelete(_id);

    if (project) {
      return res
        .status(200)
        .send({ success: true, message: "Project Deleted successfully" });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Some error is occured',
    });
  }
};

export const GetProject = async (req: Request, res: Response) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const project = await Project.find().limit(limit).skip((page - 1) * limit);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "No projects found",
      });
    }

    const signedProjects = await Promise.all(
      project.map(async (item) => {
        if (item.image) {
          item.image = await Get_Signed_Url({ key: item.image });
        }

        return item;
      })
    );
    return res.status(200).json({ success: true, data: signedProjects });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Some error is occured',
    });
  }
};

export const EditProject = async (
  req: Request,
  res: Response,
) => {
  const validation = EditProjectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const {
      difficult,
      _id,
      title,
      subtitle,
    } = validation.data;
    const file = getUploadedFile(req);

    if (!_id) {
      return res.status(400).send("_id is required");
    }

    const EditData: Record<string, string> = {};

    if (title) EditData.title = title;
    if (difficult) EditData.difficult = difficult;
    if (subtitle) EditData.subtitle = subtitle;

    if (file) {
      const uploadedFile = await uploadFileToS3({
        buffer: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype,
        folderType: 'Project',
      });

      EditData.image = uploadedFile.key;
    }

    const job = await addUpdateProjectJob(_id, EditData);

    return res.status(202).json({
      success: true,
      message: "Project update job added successfully",
      jobId: job.id,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const GetProjectData = async (
  req: Request,
  res: Response,
) => {
  try {
    const { _id } = req.params;

    if (!_id) {
      return res.status(400).send("_id is required")
    }

    let projectData = await Project.findById(_id);
    if (!projectData) {
      return res.status(404).send("Project not found")
    }

    if (projectData.image) {
      projectData.image = await Get_Signed_Url({ key: projectData.image });
    }

    return res.status(200).json({ data: projectData, success: true })
  } catch (error) {
    console.log(error)
    return res.status(400).send("Some error is occured")
  }
}