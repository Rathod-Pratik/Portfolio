import express from 'express'
import { CreateProject, DeleteProject, EditProject, GetProject, GetProjectData } from './Project.controller.ts';
import { checkAdminCookie } from '@Middleware/Auth.middleware.ts';
import { updateAdminViews } from '@Middleware/View.middleware.ts';
import { uploadFiles } from '@Middleware/multer.middleware.ts';
const router=express.Router();

router.get('/',updateAdminViews,GetProject);
router.get('/:_id',updateAdminViews,GetProjectData);
router.post('/',uploadFiles,checkAdminCookie,CreateProject)
router.put('/:_id',uploadFiles,checkAdminCookie,EditProject)
router.delete('/:_id',checkAdminCookie,DeleteProject);

export default router;