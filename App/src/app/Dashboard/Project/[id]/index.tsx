"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as yup from "yup";
import { useRouter, useParams } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  EDIT_PROJECT,
  GET_PROJECT,
} from "@api";
import apiClient from "@apiClient";
import { Input, Button, Loading } from "@components";
import type { AxiosError } from "axios";

type ProjectDifficulty = "Easy" | "Medium" | "Hard" | "Intermediate" | "Advanced";

type ProjectItem = {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  images: string;
  image?: string;
  difficult?: ProjectDifficulty;
  liveDemoLink?: string;
  techStack?: string[];
  features?: string[];
  note?: string;
};

type Params = {
  _id?: string;
};

type ProjectFormValues = {
  title: string;
  subtitle: string;
  description: string;
  liveDemoLink: string;
  difficult: "" | ProjectDifficulty;
  techStack: string[];
  features: string[];
  imageFile: File | null;
  images: string;
};

const getInitialValues = (): ProjectFormValues => ({
  title: "",
  subtitle: "",
  description: "",
  liveDemoLink: "",
  difficult: "",
  techStack: [""],
  features: [""],
  imageFile: null,
  images: "",
});

const toFormValues = (project: ProjectItem): ProjectFormValues => ({
  title: project.title,
  subtitle: project.subtitle ?? "",
  description: project.description,
  liveDemoLink: project.liveDemoLink ?? "",
  difficult: project.difficult ?? "",
  techStack: project.techStack?.length
    ? project.techStack
    : [""],
  features: project.features?.length
    ? project.features
    : [""],
  imageFile: null,
  images: project.image || project.images,
});

const CreateProject = () => {
  const router = useRouter();
  const params = useParams<Params>();
  const _id = params?._id;

  const [deleting, setDeleting] = useState(false);

  const isEditMode = Boolean(_id && _id !== "create");

  const {
    data: project,
    isLoading: loadingProject,
    isError,
  } = useQuery<ProjectItem>({
    queryKey: ["project", _id],
    enabled: isEditMode && Boolean(_id),
    queryFn: async () => {
      const response =
        await apiClient.get(
          `${GET_PROJECT}/${_id}`,
          {
            withCredentials: true,
          },
        );

      const projectData = response.data.data;

      if (!projectData) {
        throw new Error("Project not found");
      }

      return projectData;
    },
  });

  useEffect(() => {
    if (isError && isEditMode) {
      toast.error("Failed to load project");
      router.push("/Dashboard/Project");
    }
  }, [isError, isEditMode, router]);

  const validationSchema = useMemo(
    () =>
      yup.object({
        title: yup
          .string()
          .trim()
          .min(1, "Title is required")
          .required("Title is required"),

        subtitle: yup
          .string()
          .trim()
          .min(1, "Subtitle is required")
          .required("Subtitle is required"),

        description: yup
          .string()
          .trim()
          .min(1, "Description is required")
          .required("Description is required"),

        difficult: yup
          .mixed<ProjectDifficulty>()
          .required("Difficulty is required"),

        imageFile: yup
          .mixed<File>()
          .nullable()
          .test(
            "imageRequired",
            "Project image is required",
            function (value) {
              if (isEditMode) {
                return true;
              }

              return value instanceof File;
            },
          )
          .test(
            "imageType",
            "Only JPG, PNG and WEBP images are allowed",
            (value) => {
              if (!value) {
                return true;
              }

              return [
                "image/jpeg",
                "image/png",
                "image/webp",
              ].includes(value.type);
            },
          )
          .test(
            "imageSize",
            "Image size must be less than 5 MB",
            (value) => {
              if (!value) {
                return true;
              }

              return value.size <= 5 * 1024 * 1024;
            },
          ),
      }),
    [isEditMode],
  );

  const formik = useFormik<ProjectFormValues>({
    enableReinitialize: true,
    initialValues: project
      ? toFormValues(project)
      : getInitialValues(),
    validationSchema,

    onSubmit: async (
      values,
      { setSubmitting, resetForm },
    ) => {
      try {
        const payload = new FormData();

        if (isEditMode && _id) {
          payload.append("_id", _id);
        }

        payload.append("title", values.title.trim());
        payload.append("subtitle", values.subtitle.trim());
        payload.append(
          "description",
          values.description.trim(),
        );

        payload.append("difficult", values.difficult);

        if (values.imageFile instanceof File) {
          payload.append("file", values.imageFile);
        }

        if (isEditMode) {
          const response = await apiClient.put(
            `${EDIT_PROJECT}/${_id}`,
            payload,
            {
              withCredentials: true,
            },
          );

          if (response.status === 202) {
            toast.success("Project updated successfully");
            router.push("/Dashboard/Project");
          }
        } else {
          const response = await apiClient.post(
            CREATE_PROJECT,
            payload,
            {
              withCredentials: true,
            },
          );

          if (response.status === 200) {
            toast.success("Project created successfully");
            resetForm();
            router.push("/Dashboard/Project");
          }
        }
      } catch (error) {
        const apiError = error as AxiosError;

        if (apiError.response?.status === 403) {
          toast.error(
            "Access denied. Please login as admin.",
          );
          router.push("/Auth/Login");
          return;
        }

        toast.error(
          isEditMode
            ? "Failed to update project"
            : "Failed to create project",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const selectedImageInfo = useMemo(() => {
    if (!formik.values.imageFile) {
      return null;
    }

    return {
      name: formik.values.imageFile.name,
      sizeMb: (
        formik.values.imageFile.size /
        1024 /
        1024
      ).toFixed(2),
    };
  }, [formik.values.imageFile]);

  const updateFeature = (
    index: number,
    value: string,
  ) => {
    const features = [...formik.values.features];
    features[index] = value;

    formik.setFieldValue("features", features);
  };

  const updateTechStack = (
    index: number,
    value: string,
  ) => {
    const techStack = [...formik.values.techStack];
    techStack[index] = value;

    formik.setFieldValue("techStack", techStack);
  };

  const addFeature = () => {
    formik.setFieldValue("features", [
      ...formik.values.features,
      "",
    ]);
  };

  const addTechStack = () => {
    formik.setFieldValue("techStack", [
      ...formik.values.techStack,
      "",
    ]);
  };

  const handleDelete = async () => {
    if (!_id) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this project?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeleting(true);

      const response = await apiClient.delete(
        `${DELETE_PROJECT}/${_id}`,
        {
          withCredentials: true,
        },
      );

      if (response.status === 200) {
        toast.success(
          "Project deleted successfully",
        );

        router.push("/Dashboard/Project");
      }
    } catch (error) {
      const apiError = error as AxiosError;

      if (apiError.response?.status === 403) {
        toast.error(
          "Access denied. Please login as admin.",
        );
        router.push("/Auth/Login");
        return;
      }

      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="space-y-6 p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          {isEditMode
            ? "Edit Project"
            : "Create Project"}
        </h2>

        <Button
          type="button"
          text="Back"
          varient="secondary"
          onClick={() =>
            router.push("/Dashboard/Project")
          }
        />
      </div>

      <Input
        name="imageFile"
        lable="Project Image"
        inputType="Image"
        imagePreview={formik.values.images}
        imageFile={formik.values.imageFile}
        handleImageChange={(file) => {
          formik.setFieldValue("imageFile", file);
          formik.setFieldTouched(
            "imageFile",
            true,
          );

          if (file) {
            formik.setFieldValue(
              "images",
              URL.createObjectURL(file),
            );
          }
        }}
        error={
          formik.touched.imageFile &&
            typeof formik.errors.imageFile === "string"
            ? formik.errors.imageFile
            : undefined
        }
      />

      {selectedImageInfo && (
        <div className="text-sm text-gray-400">
          <p className="font-medium text-gray-300">
            {selectedImageInfo.name}
          </p>

          <p className="text-xs">
            {selectedImageInfo.sizeMb} MB
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          type="text"
          name="title"
          lable="Title"
          placeholder="Project title"
          value={formik.values.title}
          onChange={(value) =>
            formik.setFieldValue("title", value)
          }
          onBlur={() =>
            formik.setFieldTouched("title", true)
          }
          error={
            formik.touched.title
              ? formik.errors.title
              : undefined
          }
        />

        <Input
          type="text"
          name="subtitle"
          lable="Subtitle"
          placeholder="Brief project subtitle"
          value={formik.values.subtitle}
          onChange={(value) =>
            formik.setFieldValue("subtitle", value)
          }
          onBlur={() =>
            formik.setFieldTouched(
              "subtitle",
              true,
            )
          }
          error={
            formik.touched.subtitle
              ? formik.errors.subtitle
              : undefined
          }
        />

        <Input
          type="url"
          name="liveDemoLink"
          lable="Live Demo URL"
          placeholder="https://example.com"
          value={formik.values.liveDemoLink}
          onChange={(value) =>
            formik.setFieldValue(
              "liveDemoLink",
              value,
            )
          }
          onBlur={() =>
            formik.setFieldTouched(
              "liveDemoLink",
              true,
            )
          }
          error={
            formik.touched.liveDemoLink
              ? formik.errors.liveDemoLink
              : undefined
          }
        />
      </div>

      <div className="w-full md:w-1/2">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Difficulty Level
        </label>

        <select
          name="difficult"
          value={formik.values.difficult}
          onChange={(event) =>
            formik.setFieldValue(
              "difficult",
              event.target.value,
            )
          }
          onBlur={() =>
            formik.setFieldTouched(
              "difficult",
              true,
            )
          }
          className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {formik.touched.difficult &&
          formik.errors.difficult && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.difficult}
            </p>
          )}
      </div>

      <Input
        type="text"
        name="description"
        lable="Description"
        placeholder="Describe your project in detail..."
        value={formik.values.description}
        inputType="textarea"
        onChange={(value) =>
          formik.setFieldValue(
            "description",
            value,
          )
        }
        onBlur={() =>
          formik.setFieldTouched(
            "description",
            true,
          )
        }
        error={
          formik.touched.description
            ? formik.errors.description
            : undefined
        }
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Key Features
        </label>

        <div className="space-y-3">
          {formik.values.features.map(
            (feature, index) => (
              <Input
                key={`feature-${index}`}
                type="text"
                name={`feature-${index}`}
                placeholder={`Feature ${index + 1}`}
                value={feature}
                onChange={(value) =>
                  updateFeature(index, value)
                }
              />
            ),
          )}
        </div>

        <div className="mt-3">
          <Button
            type="button"
            text="Add Feature"
            varient="secondary"
            onClick={addFeature}
          />
        </div>

        {formik.touched.features &&
          typeof formik.errors.features ===
          "string" && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.features}
            </p>
          )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Tech Stack
        </label>

        <div className="space-y-3">
          {formik.values.techStack.map(
            (tech, index) => (
              <Input
                key={`tech-${index}`}
                type="text"
                name={`tech-${index}`}
                placeholder={`Tech ${index + 1}`}
                value={tech}
                onChange={(value) =>
                  updateTechStack(index, value)
                }
              />
            ),
          )}
        </div>

        <div className="mt-3">
          <Button
            type="button"
            text="Add Tech Stack"
            varient="secondary"
            onClick={addTechStack}
          />
        </div>

        {formik.touched.techStack &&
          typeof formik.errors.techStack ===
          "string" && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.techStack}
            </p>
          )}
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
        {isEditMode && (
          <Button
            type="button"
            text="Delete"
            ProcessText="Deleting..."
            varient="danger"
            isSubmitting={deleting}
            onClick={handleDelete}
            Icon={FiTrash2}
          />
        )}

        <Button
          type="submit"
          text={
            isEditMode
              ? "Update Project"
              : "Create Project"
          }
          ProcessText="Processing..."
          isSubmitting={formik.isSubmitting}
        />
      </div>
    </form>
  );
};

export default CreateProject;
