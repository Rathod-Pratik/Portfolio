import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@modules/Logger/Logger.service.ts";

import dotenv from "dotenv";
import type { Request } from "express";
dotenv.config();

const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const awsBucket = process.env.S3_BUCKET_NAME;

if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !awsBucket) {
  throw new Error("Missing required AWS configuration environment variables");
}

const awsConfig = {
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
  region: awsRegion,
  bucket: awsBucket,
};

const s3 = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export interface GetSignedUrlType {
  key: string;
  downloadFileName?: string;
  expiresIn?: number;
}

export const DEFAULT_SIGNED_URL_EXPIRES_IN = 3600;

export type UploadImageType = {
  buffer: Buffer;
  fileName: string;
  fileType: string;
  folderType: string;
}

const isSafeS3Key = (key: string): boolean => {
  return Boolean(key) && !key.includes("..") && !key.startsWith("/") && !key.startsWith("\\");
};

export const Delete_S3_File = async (
  key: string
) => {
  if (!key) {
    throw new Error("S3 key is required");
  }

  if (!isSafeS3Key(key)) {
    throw new Error("Invalid S3 key");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
    })
  );
};

export const uploadFileToS3 = async ({
  buffer,
  fileName,
  fileType,
  folderType,
}: UploadImageType) => {
  const key = `${folderType.replace(/\s+/g, "_")}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      Body: buffer,
      ContentType: fileType,
      ACL: "private",
    }),
  );

  const uploadedFileUrl = `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;

  return {
    url: uploadedFileUrl,
    key,
    fileName,
    fileType,
  };
};



export const Get_Signed_Url = async ({
  key,
  downloadFileName,
  expiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN,
}: GetSignedUrlType) => {
  if (!key) {
    throw new Error("key is required");
  }

  if (!isSafeS3Key(key)) {
    throw new Error("Invalid key format");
  }

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      ...(downloadFileName
        ? {
          ResponseContentDisposition: `attachment; filename="${downloadFileName}"`,
        }
        : {}),
    }),
    {
      expiresIn,
    },
  );
  const url = signedUrl;
  return url;
};

export const getUploadedFile = (
  req: Request,
): Express.Multer.File | undefined => {
  if (req.file) {
    return req.file;
  }

  const files = req.files as
    | {
      file?: Express.Multer.File[];
      image?: Express.Multer.File[];
    }
    | undefined;

  return files?.file?.[0] ?? files?.image?.[0];
}

export const getFiles = (req: Request) => {
  const files = req.files as
    {
      file?: Express.Multer.File[];
      image?: Express.Multer.File[];
    }
    ;

  return {
    image: files.image?.[0],
    pdf: files.file?.[0],
  };
};

export const getMultipleUploadedFiles = (req: Request): Express.Multer.File[] => {
  const files = req.files as Express.Multer.File[];
  return files;
};

export const uploadWithRetry = async (
  file: Express.Multer.File,
  retries = 3,
  Directory: string = "Hotel"
) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFileToS3({
        buffer: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype,
        folderType: Directory,
      });
    } catch (error) {
      lastError = error;

      logger.warn("S3 upload failed", {
        context: 'S3 Upload',
        metadata: {
          fileName: file.originalname,
          attempt,
        },
      });

      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 2000)
        );
      }
    }
  }

  throw lastError;
};

import { z } from "zod";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ImageFileSchema = z.object({
  buffer: z.instanceof(Buffer, {
    message: "Image is required",
  }),

  mimetype: z
    .string()
    .refine(
      (type) => allowedImageTypes.includes(type),
      {
        message:
          "Only JPEG, PNG, and WEBP images are allowed",
      }
    ),

  size: z
    .number()
    .max(
      MAX_IMAGE_SIZE,
      "Image size must be less than 5MB"
    ),
});

export const PdfFileSchema = z.object({
  buffer: z.instanceof(Buffer, {
    message: "PDF is required",
  }),

  mimetype: z
    .string()
    .refine(
      (type) => type === "application/pdf",
      {
        message: "Only PDF files are allowed",
      }
    ),

  size: z
    .number()
    .max(
      MAX_PDF_SIZE,
      "PDF size must be less than 10MB"
    ),
});