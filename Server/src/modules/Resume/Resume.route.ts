import express from 'express'
import { AddCV, GetCV, UpdateCV } from './Resume.controller.ts';
import { checkAdminCookie } from '@Middleware/Auth.middleware.ts';
import { updateAdminViews } from '@Middleware/View.middleware.ts';
import { uploadFiles } from '@Middleware/multer.middleware.ts';

const route=express.Router();

route.get('/',updateAdminViews,GetCV);
route.post('/',uploadFiles,checkAdminCookie,AddCV)
route.put('/',uploadFiles,checkAdminCookie,UpdateCV)

export default route;