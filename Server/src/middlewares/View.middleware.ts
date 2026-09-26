import type { NextFunction, Request, Response } from 'express';
import { AdminModel } from '../modules/Auth/Auth.model.ts';

export const updateAdminViews = async (req:Request, res:Response, next:NextFunction) => {
  try {
    await AdminModel.updateOne({}, { $inc: { view: 1 } }, { upsert: true });
    next();
  } catch (err) {
    console.error("Error updating views:", err);
    next();
  }
};
