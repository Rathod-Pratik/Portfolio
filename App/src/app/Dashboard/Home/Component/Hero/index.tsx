"use client";

import React from "react";
import { FiImage } from "react-icons/fi";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { GET_HERO, UPDATE_HERO } from "@api";
import { Input, Loading } from "@components";
import type { AxiosError } from "axios";

type HeroResponse = {
  data: {
    greeting: string;
    name: string;
    roles: string[];
    description: string;
    image: string;
  };
  source: "cache" | "database";
};

type ApiError = {
  message?: string;
};

const Hero = () => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetching } = useQuery<HeroResponse["data"]>({
    queryKey: ["hero"],
    queryFn: async () => {
      const response = await apiClient.get<HeroResponse>(GET_HERO);
      return response.data.data;
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      greeting: data?.greeting || "",
      name: data?.name || "",
      roles: data?.roles ? data.roles.join(", ") : "",
      description: data?.description || "",
      image: data?.image || "",
      imageFile: undefined as File | undefined,
    },
    validationSchema: Yup.object({
      greeting: Yup.string().min(1, "Greeting is required").required("Greeting is required"),
      name: Yup.string().min(1, "Name is required").required("Name is required"),
      roles: Yup.string().min(1, "At least one role is required").required("At least one role is required"),
      description: Yup.string().min(1, "Description is required").required("Description is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        formData.append("greeting", values.greeting);
        formData.append("name", values.name);
        formData.append(
          "roles",
          JSON.stringify(
            values.roles
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          ),
        );
        formData.append("description", values.description);

        if (values.imageFile) {
          formData.append("file", values.imageFile);
        }

        const response = await apiClient.put(UPDATE_HERO, formData, {
          withCredentials: true,
        });


        if (response.status === 202) {
          queryClient.invalidateQueries({ queryKey: ["hero"] });
          toast.success("Hero section updated successfully!");
          formik.setFieldValue("imageFile", undefined);
        }
      } catch (error) {
        const apiError = error as AxiosError<ApiError>;
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          toast.error("Access denied. Please login as admin.");
        } else {
          toast.error(
            apiError.response?.data?.message ||
            "Failed to update Hero section"
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      formik.setFieldValue("imageFile", file);
      formik.setFieldValue("image", URL.createObjectURL(file));
    }
  };

  const handleCustomSubmit = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        greeting: true,
        name: true,
        roles: true,
        description: true,
      });
      toast.error(Object.values(errors)[0] as string);
      return;
    }
    formik.handleSubmit();
  };

  if (fetching) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-slate-700 h-64 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-slate-700 col-span-1 lg:col-span-2 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Hero</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Input
              lable="Top Greeting"
              name="greeting"
              type="text"
              value={formik.values.greeting}
              onChange={(value) => formik.setFieldValue('greeting', value)}
              onBlur={() => formik.setFieldTouched('greeting', true)}
              error={formik.touched.greeting ? formik.errors.greeting as string : undefined}
              placeholder="e.g. Hello! I Am"
            />
          </div>

          <div>
            <Input
              lable="Main Name"
              name="name"
              type="text"
              value={formik.values.name}
              onChange={(value) => formik.setFieldValue("name", value)}
              onBlur={() => formik.setFieldTouched("name", true)}
              error={formik.touched.name ? (formik.errors.name as string) : undefined}
              placeholder="e.g. Rathod Pratik"
            />
          </div>

          <div>
            <Input
              name="roles"
              type="text"
              value={formik.values.roles}
              onChange={(value) => formik.setFieldValue("roles", value)}
              onBlur={() => formik.setFieldTouched("roles", true)}
              error={formik.touched.roles ? (formik.errors.roles as string) : "Enter multiple roles separated by commas"}
              placeholder="e.g. MERN Developer, Web Developer"
              lable="Typewriter Roles (Comma separated)"
            />
          </div>

          <div>
            <Input
              lable="Description"
              name="description"
              type="text"
              value={formik.values.description}
              onChange={(value) => formik.setFieldValue("description", value)}
              onBlur={() => formik.setFieldTouched("description", true)}
              error={formik.touched.description ? (formik.errors.description as string) : undefined}
              placeholder="I'm a Web Developer having experience..."
            />
          </div>
        </div>

        {/* Right Col: Image */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Image
          </label>
          <div className="flex-1 flex flex-col justify-center items-center p-6 border-2 border-dashed border-gray-600 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            {formik.values.image ? (
              <img
                src={formik.values.image}
                alt="Profile Preview"
                className="max-h-50 object-cover rounded-md mb-2"
              />
            ) : (
              <FiImage size={40} className="text-gray-400 mb-2" />
            )}
            <p className="text-sm text-gray-300">
              {formik.values.imageFile
                ? formik.values.imageFile.name
                : "Click or Drag to Upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPG, PNG, WEBP (Max 5MB)
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleCustomSubmit}
          disabled={!formik.dirty || formik.isSubmitting}
          className={`font-medium px-8 py-2.5 rounded-md transition-colors ${!formik.dirty || formik.isSubmitting
            ? "bg-purple-400 text-gray-100 cursor-not-allowed opacity-70"
            : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
        >
          {formik.isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default Hero;
