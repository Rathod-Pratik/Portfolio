"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { FiUpload, FiFileText, FiTrash2 } from "react-icons/fi";
import * as yup from "yup";
import { useFormik } from "formik";
import { CREATE_NOTES, DELETE_NOTES, EDIT_NOTES, GET_NOTES } from "@api";
import { apiClient } from "@apiClient";
import { Button, Input, Loading } from "@components";
import type { NoteItem } from "@Type";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const validationSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title must not exceed 150 characters")
    .required("Title is required"),
  description: yup
    .string()
    .trim()
    .min(1, "Description is required")
    .required("Description is required"),
  image: yup
    .mixed<File>()
    .test("imageRequired", "Cover image is required", function (value) {
      if (value instanceof File) return true;
      if (this.parent.imageUrl) return true;
      return false;
    })
    .test(
      "fileType",
      "Only JPG, JPEG, PNG, and WEBP images are allowed",
      (value) => {
        if (!value || !(value instanceof File)) return true;
        return [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ].includes(value.type);
      }
    )
    .test(
      "fileSize",
      "Image size must be less than 5 MB",
      (value) => {
        if (!value || !(value instanceof File)) return true;
        return value.size <= 5 * 1024 * 1024;
      }
    ),
  pdf: yup
    .mixed<File>()
    .test("pdfRequired", "PDF document is required", function (value) {
      if (value instanceof File) return true;
      if (this.parent.pdfUrl) return true;
      return false;
    })
    .test(
      "fileType",
      "Only PDF files are allowed",
      (value) => {
        if (!value || !(value instanceof File)) return true;
        return (
          value.type === "application/pdf" ||
          value.name.toLowerCase().endsWith(".pdf")
        );
      }
    )
    .test(
      "fileSize",
      "PDF size must be less than 25 MB",
      (value) => {
        if (!value || !(value instanceof File)) return true;
        return value.size <= 25 * 1024 * 1024;
      }
    ),
});

const CreateNote = ({ params }: PageProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const rawId = resolvedParams?.id;
  const isEdit = Boolean(rawId && rawId !== "create" && rawId !== "new");
  const id = isEdit ? rawId : null;

  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: noteData,
    isLoading: isNoteLoading,
    isError: isNoteError,
  } = useQuery<NoteItem>({
    queryKey: ["admin-note", id],
    enabled: Boolean(isEdit && id),
    queryFn: async () => {
      const response = await apiClient.get(`${GET_NOTES}/${id}`, {
        withCredentials: true,
      });
      const data =
        response.data?.data ??
        response.data?.note ??
        response.data?.blog ??
        response.data;
      if (!data) {
        throw new Error("Note not found");
      }
      return data;
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: noteData?.title || "",
      description: noteData?.description || "",
      image: undefined as File | undefined,
      imageUrl: (noteData?.note_image_url || noteData?.imageUrl || "") as string,
      pdf: undefined as File | undefined,
      pdfUrl: (noteData?.note_pdf_url || noteData?.pdfUrl || noteData?.fileUrl || "") as string,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = new FormData();
        payload.append("title", values.title.trim());
        payload.append("description", values.description.trim());

        if (values.image instanceof File) {
          payload.append("image", values.image);
        }

        if (values.pdf instanceof File) {
          payload.append("pdf", values.pdf);
        }

        if (isEdit && id) {
          payload.append("_id", id);
          const response = await apiClient.put(EDIT_NOTES, payload, {
            withCredentials: true,
          });

          if (response.status === 202) {
            toast.success("Note updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            queryClient.invalidateQueries({ queryKey: ["admin-note", id] });
            router.push("/Dashboard/Notes");
          }
        } else {
          const response = await apiClient.post(CREATE_NOTES, payload, {
            withCredentials: true,
          });

          if (response.status === 202) {
            toast.success("Note added successfully.");
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            router.push("/Dashboard/Notes");
          }
        }
      } catch (error) {
        const apiError = error as AxiosError<{ message?: string }>;

        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          toast.error("Access denied. Please login as admin.");
          router.push("/login");
          return;
        }

        const errorMessage =
          apiError.response?.data?.message ||
          (isEdit ? "Failed to update note." : "Failed to create note.");

        console.error("Save Note Error:", apiError);
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleDelete = async () => {
    if (!id || !isEdit) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const response = await apiClient.delete(`${DELETE_NOTES}/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Note deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        router.push("/Dashboard/Notes");
      }
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/login");
        return;
      }
      console.error("DeleteNote Error:", apiError);
      toast.error(apiError.response?.data?.message || "Failed to delete note.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        title: true,
        description: true,
        image: true,
        pdf: true,
      });
      const firstError = Object.values(errors)[0];
      if (typeof firstError === "string") {
        toast.error(firstError);
      } else if (Array.isArray(firstError)) {
        toast.error(firstError[0]);
      }
      return;
    }
    formik.handleSubmit();
  };

  if (isEdit && isNoteLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loading />
      </div>
    );
  }

  if (isEdit && isNoteError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-400 text-lg">Failed to load note details</p>
        <Button
          varient="secondary"
          text="Back to Notes"
          onClick={() => router.push("/Dashboard/Notes")}
          title="Back to Notes"
        />
      </div>
    );
  }

  const pdfFileName = formik.values.pdf
    ? formik.values.pdf.name
    : formik.values.pdfUrl
    ? formik.values.pdfUrl.split("/").pop() || formik.values.pdfUrl
    : "";

  return (
    <form
      onSubmit={handleFormSubmit}
      className="sm:p-6 space-y-6  mx-auto"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEdit ? "Edit Note" : "Create Note"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            varient="secondary"
            text="Back"
            onClick={() => router.push("/Dashboard/Notes")}
            title="Back to Notes"
          />
        </div>
      </div>

      {/* Cover Image Upload Section */}
      <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-4 sm:p-5 shadow-lg">
        <Input
          name="image"
          lable="Note Cover Image"
          inputType="Image"
          imagePreview={formik.values.imageUrl}
          style="object-contain w-full h-48 rounded-lg border border-gray-600"
          handleImageChange={(file) => {
            formik.setFieldValue("image", file ?? undefined);
            formik.setFieldTouched("image", true);
          }}
          error={
            formik.touched.image && formik.errors.image
              ? (formik.errors.image as string)
              : undefined
          }
        />
      </div>

      {/* Form Fields Section */}
      <div className="grid gap-5">
        {/* Title Input */}
        <div>
          <Input
            type="text"
            name="title"
            lable="Title"
            value={formik.values.title}
            inputType="input"
            onChange={(value) => formik.setFieldValue("title", value)}
            onBlur={() => formik.setFieldTouched("title", true)}
            placeholder="e.g. Next.js 15 App Router Cheatsheet"
            error={
              formik.touched.title && formik.errors.title
                ? (formik.errors.title as string)
                : undefined
            }
          />
        </div>

        {/* PDF File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            PDF Document
          </label>
          <label
            className={`group flex items-center justify-between gap-3 bg-gray-700/70 border ${
              formik.touched.pdf && formik.errors.pdf
                ? "border-red-500"
                : "border-gray-600 hover:border-purple-500"
            } rounded-md px-4 py-3 cursor-pointer transition-colors`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <FiFileText size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm text-white truncate font-medium">
                  {pdfFileName ? formik.values.title+'.pdf' : "Click to choose PDF file"}
                </span>
                <span className="text-xs text-gray-400">
                  {formik.values.pdf
                    ? `${(formik.values.pdf.size / (1024 * 1024)).toFixed(2)} MB`
                    : "PDF documents up to 25 MB"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md group-hover:bg-purple-600 transition-colors shrink-0">
                {pdfFileName ? "Replace PDF" : "Browse"}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                formik.setFieldValue("pdf", file ?? undefined);
                formik.setFieldTouched("pdf", true);
              }}
            />
          </label>
          {formik.touched.pdf && formik.errors.pdf && (
            <p className="text-red-500 text-xs mt-1">
              {formik.errors.pdf as string}
            </p>
          )}
        </div>

        {/* Description Textarea */}
        <div>
          <Input
            name="description"
            lable="Description"
            value={formik.values.description}
            inputType="textarea"
            onChange={(value) => formik.setFieldValue("description", value)}
            onBlur={() => formik.setFieldTouched("description", true)}
            placeholder="Describe what this note covers..."
            error={
              formik.touched.description && formik.errors.description
                ? (formik.errors.description as string)
                : undefined
            }
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">

        {isEdit && (
          <Button
            type="button"
            varient="danger"
            text="Delete"
            Icon={FiTrash2}
            onClick={handleDelete}
            title="Delete Note"
            isSubmitting={isDeleting}
            ProcessText="Deleting..."
          />
        )}

        <Button
          type="submit"
          varient="primary"
          Icon={FiUpload}
          text={isEdit ? "Update Note" : "Create Note"}
          title={isEdit ? "Update Note" : "Create Note"}
          isSubmitting={formik.isSubmitting}
          ProcessText="Saving..."
        />
      </div>
    </form>
  );
};

export default CreateNote;