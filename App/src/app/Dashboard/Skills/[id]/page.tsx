"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import { FiTrash2, FiUpload } from "react-icons/fi";
import { CREATE_SKILL, DELETE_SKILL, GET_SKILL, UPDATE_SKILL } from "@api";
import { apiClient } from "@apiClient";
import { Input, Button, Loading } from "@components";
import type { AdminSkillItem } from "@Type";

type SkillFormValues = {
  language: string;
  percentage: string;
  color: string;
};

const initialValues: SkillFormValues = {
  language: "",
  percentage: "",
  color: "#3b82f6",
};

const validationSchema = yup.object({
  language: yup
    .string()
    .trim()
    .required("Language is required.")
    .min(2, "Language must be at least 2 characters."),
  percentage: yup
    .number()
    .typeError("Percentage must be a number.")
    .required("Percentage is required.")
    .min(0, "Percentage must be between 0 and 100.")
    .max(100, "Percentage must be between 0 and 100."),
  color: yup
    .string()
    .required("Color is required.")
    .matches(/^#[0-9A-Fa-f]{6}$/, "Enter a valid color."),
});

const CreateSkill = () => {
  const router = useRouter();
  const params = useParams();

  const skillId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : null;

  const isEditMode = Boolean(skillId);

  const [skill, setSkill] = useState<AdminSkillItem | null>(null);
  const [isLoadingSkill, setIsLoadingSkill] = useState(isEditMode);
  const [isDeleting, setIsDeleting] = useState(false);

  const formik = useFormik<SkillFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...(skillId && { _id: skillId }),
          language: values.language.trim(),
          percentage: Number(values.percentage),
          color: values.color,
        };

        const response = isEditMode
          ? await apiClient.put(UPDATE_SKILL, payload, {
            withCredentials: true,
          })
          : await apiClient.post(CREATE_SKILL, payload, {
            withCredentials: true,
          });

        if (response.status === 200) {
          toast.success(
            isEditMode
              ? "Skill updated successfully."
              : "Skill created successfully."
          );

          router.push("/admin/skills");
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          toast.error("Access denied. Please login as admin.");
          router.push("/login");
          return;
        }

        console.error(
          isEditMode ? "UpdateSkill Error:" : "CreateSkill Error:",
          error
        );

        toast.error(
          error.response?.data?.message ||
          (isEditMode
            ? "Failed to update skill."
            : "Failed to create skill.")
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!skillId) {
      setSkill(null);
      setIsLoadingSkill(false);
      return;
    }

    const getSkill = async () => {
      try {
        setIsLoadingSkill(true);

        const response = await apiClient.get(GET_SKILL, {
          withCredentials: true,
        });

        const skills = response.data.data as AdminSkillItem[];

        const currentSkill = skills.find(
          (item) => item._id === skillId
        );

        if (!currentSkill) {
          toast.error("Skill not found.");
          router.push("/admin/skills");
          return;
        }

        setSkill(currentSkill);

        formik.setValues({
          language: currentSkill.language ?? "",
          percentage: String(currentSkill.percentage ?? ""),
          color: currentSkill.color ?? "#3b82f6",
        });
      } catch (error: any) {
        if (error.response?.status === 403) {
          toast.error("Access denied. Please login as admin.");
          router.push("/login");
          return;
        }

        console.error("GetSkill Error:", error);
        toast.error("Failed to load skill.");
      } finally {
        setIsLoadingSkill(false);
      }
    };

    getSkill();
  }, [skillId]);

  const handleDeleteSkill = async () => {
    if (!skillId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this skill?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await apiClient.delete(
        `${DELETE_SKILL}/${skillId}`,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        toast.success("Skill deleted successfully.");
        router.push("/admin/skills");
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/login");
        return;
      }

      console.error("DeleteSkill Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Failed to delete skill."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingSkill) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loading />
      </div>
    );
  }

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="p-4 sm:p-6 space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          {isEditMode ? "Edit Skill" : "Create Skill"}
        </h2>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            text="Back"
            varient="secondary"
            onClick={() => router.push("/admin/skills")}
          />

          {isEditMode && (
            <Button
              type="button"
              text="Delete"
              ProcessText="Deleting..."
              Icon={FiTrash2}
              varient="danger"
              isSubmitting={isDeleting}
              isDisabled={formik.isSubmitting}
              onClick={handleDeleteSkill}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          type="text"
          name="language"
          lable="Language"
          placeholder="React, Node.js, TypeScript..."
          value={formik.values.language}
          inputType="input"
          onChange={(value) =>
            formik.setFieldValue("language", value)
          }
          onBlur={() =>
            formik.setFieldTouched("language", true)
          }
          error={
            formik.touched.language
              ? formik.errors.language
              : undefined
          }
        />

        <Input
          type="number"
          name="percentage"
          lable="Percentage"
          placeholder="0 - 100"
          value={formik.values.percentage}
          inputType="input"
          onChange={(value) =>
            formik.setFieldValue("percentage", value)
          }
          onBlur={() =>
            formik.setFieldTouched("percentage", true)
          }
          error={
            formik.touched.percentage
              ? formik.errors.percentage
              : undefined
          }
        />
      </div>

      <div className="w-full md:w-1/2">
        <label className="block mb-2 text-sm font-medium text-gray-300">
          Color
        </label>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={formik.values.color || "#3b82f6"}
            onChange={(event) =>
              formik.setFieldValue("color", event.target.value)
            }
            className="h-10 w-10 cursor-pointer rounded border border-gray-500"
            title="Choose color"
          />

          <Input
            type="text"
            name="color"
            placeholder="#3b82f6"
            value={formik.values.color}
            inputType="input"
            onChange={(value) => {
              if (
                value === "" ||
                /^#[0-9A-Fa-f]{0,6}$/.test(value)
              ) {
                formik.setFieldValue("color", value);
              }
            }}
            onBlur={() =>
              formik.setFieldTouched("color", true)
            }
            error={
              formik.touched.color
                ? formik.errors.color
                : undefined
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
        {isEditMode && (
          <Button
            type="button"
            text="Delete"
            ProcessText="Deleting..."
            Icon={FiTrash2}
            varient="danger"
            isSubmitting={isDeleting}
            isDisabled={formik.isSubmitting}
            onClick={handleDeleteSkill}
          />
        )}

        <Button
          type="submit"
          text={isEditMode ? "Update Skill" : "Create Skill"}
          ProcessText="Processing..."
          Icon={FiUpload}
          varient="primary"
          isSubmitting={formik.isSubmitting}
          isDisabled={isDeleting}
        />
      </div>
    </form>
  );
};

export default CreateSkill;