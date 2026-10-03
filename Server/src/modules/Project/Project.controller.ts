import { Project } from './Project.model.ts';
import { Get_Signed_Url, getUploadedFile, uploadFileToS3, logger, incrementCacheVersion, ProjectCacheKeys } from '@utils';
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
    await logger.warn("Create project validation failed", {
      context: "ProjectController",
      metadata: { errors: validation.error.flatten().fieldErrors },
    });
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
      description,
      difficult
    } = validation.data;
    const file = getUploadedFile(req);

    if (!file) {
      await logger.warn("Create project image missing", { context: "ProjectController" });
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
      });
    }

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

    await logger.info(`Project creation queued: ${title}`, {
      context: "ProjectController",
      metadata: { jobId: job.id, title },
    });

    return res.status(200).json({ success: true, message: 'Project created successfully', jobId: job.id });
  } catch (error) {
    await logger.error(
      "Create project error",
      error instanceof Error ? error : { context: "ProjectController", metadata: { error: String(error) } }
    );
    return res.status(500).json({
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
      await logger.warn("Delete project missing _id param", { context: "ProjectController" });
      return res.status(400).json({ success: false, message: "_id is required" });
    }
    const projectData = await Project.findById(_id);
    if (!projectData) {
      await logger.warn(`Delete project: Not found for ID: ${_id}`, { context: "ProjectController" });
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = await Project.findByIdAndDelete(_id);

    if (project) {
      await incrementCacheVersion(ProjectCacheKeys.listVersion());
      await incrementCacheVersion(ProjectCacheKeys.detailsVersion(_id as string));
      await logger.info(`Project deleted successfully: ${projectData.title} (ID: ${_id})`, { context: "ProjectController" });
      return res
        .status(200)
        .json({ success: true, message: "Project Deleted successfully" });
    }

    return res.status(404).json({ success: false, message: "Project not found" });
  } catch (error) {
    await logger.error(
      "Delete project error",
      error instanceof Error ? error : { context: "ProjectController", metadata: { error: String(error) } }
    );
    return res.status(500).json({
      success: false,
      message: 'Some error occurred',
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
      await logger.warn("No projects found in database", { context: "ProjectController" });
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

    await logger.info(`Fetched ${signedProjects.length} projects from database`, { context: "ProjectController" });
    return res.status(200).json({ success: true, data: signedProjects });

  } catch (error) {
    await logger.error(
      "GetProject error",
      error instanceof Error ? error : { context: "ProjectController", metadata: { error: String(error) } }
    );
    return res.status(500).json({
      success: false,
      message: 'Some error occurred',
    });
  }
};

export const EditProject = async (
  req: Request,
  res: Response,
) => {
  const validation = EditProjectSchema.safeParse(req.body);

  if (!validation.success) {
    await logger.warn("Edit project validation failed", {
      context: "ProjectController",
      metadata: { errors: validation.error.flatten().fieldErrors },
    });
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
      description,
    } = validation.data;
    const file = getUploadedFile(req);

    if (!_id) {
      await logger.warn("Edit project missing _id", { context: "ProjectController" });
      return res.status(400).json({ success: false, message: "_id is required" });
    }

    const EditData: Record<string, string> = {};

    if (title) EditData.title = title;
    if (difficult) EditData.difficult = difficult;
    if (subtitle) EditData.subtitle = subtitle;
    if (description) EditData.description = description;

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

    await logger.info(`Project update queued for ID: ${_id}`, {
      context: "ProjectController",
      metadata: { jobId: job.id, projectId: _id },
    });

    return res.status(202).json({
      success: true,
      message: "Project update job added successfully",
      jobId: job.id,
    });

  } catch (error) {
    await logger.error(
      "Edit project error",
      error instanceof Error ? error : { context: "ProjectController", metadata: { error: String(error) } }
    );
    return res.status(500).json({
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
      await logger.warn("GetProjectData missing _id param", { context: "ProjectController" });
      return res.status(400).json({ success: false, message: "_id is required" });
    }

    let projectData = await Project.findById(_id);
    if (!projectData) {
      await logger.warn(`GetProjectData: Not found for ID: ${_id}`, { context: "ProjectController" });
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (projectData.image) {
      projectData.image = await Get_Signed_Url({ key: projectData.image });
    }

    await logger.info(`Fetched project details for ID: ${_id}`, { context: "ProjectController" });

    return res.status(200).json({ data: projectData, success: true });
  } catch (error) {
    await logger.error(
      "GetProjectData error",
      error instanceof Error ? error : { context: "ProjectController", metadata: { error: String(error) } }
    );
    return res.status(500).json({ success: false, message: "Some error occurred" });
  }
};
