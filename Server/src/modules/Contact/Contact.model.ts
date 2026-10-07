import mongoose, { type HydratedDocument } from "mongoose";
import type { IContact } from "./Contact.types.ts";

const ContactSchema = new mongoose.Schema<IContact>({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    mobile:{
        type:String,
        required:true,
    },
    projectType:{
        type:String,
        required:true,
    },
    budget:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        required:true,
        enum:["new", "contacted", "inProgress", "closed"],
        default:"new",
    },
    message:{
        type:String,
        required:true,
    },
    isDeleted:{
        type:Boolean,
        default:false,
    }
})

export type ContactDocument = HydratedDocument<IContact>;

export const contactModel = mongoose.model<IContact>('contact', ContactSchema);