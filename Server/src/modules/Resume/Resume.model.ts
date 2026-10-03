import mongoose from 'mongoose'
import type { HydratedDocument } from 'mongoose';
import type { IResume } from "./Resume.types.ts";

const ResumeSchema = new mongoose.Schema<IResume>({
    CV:{
        type:String,
        required:true
    }
})

export type ResumeDocument = HydratedDocument<IResume>;

export const CVmodel = mongoose.model<IResume>('CV', ResumeSchema)