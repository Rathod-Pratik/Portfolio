import express from 'express'
import { CreateSkill, DeleteSkill, EditSkill, GetSkill } from './Skills.controller.ts';
import { checkAdminCookie } from '@Middleware/Auth.middleware.ts';
import { updateAdminViews } from '@Middleware/View.middleware.ts';

const router=express.Router();

router.get('/',updateAdminViews,GetSkill);
router.post('/',checkAdminCookie,CreateSkill)
router.put('/',checkAdminCookie,EditSkill)
router.delete('/:_id',checkAdminCookie,DeleteSkill);

export default router;