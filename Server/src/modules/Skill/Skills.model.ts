import mongoose, { type HydratedDocument } from "mongoose";
import type { ISkill } from './Skill.types.ts';

const skillSchema = new mongoose.Schema<ISkill>({
    language: {
        type: String,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

export type SkillDocument = HydratedDocument<ISkill>;

export const SkillsModel = mongoose.model<ISkill>('skills', skillSchema);

