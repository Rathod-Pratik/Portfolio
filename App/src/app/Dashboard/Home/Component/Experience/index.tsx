import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import {
  CREATE_EXPERIENCE,
  DELETE_EXPERIENCE,
  GET_EXPERIENCE,
  UPDATE_EXPERIENCE,
} from "@api";
import { Input, Loading } from "@components";

type ExperienceType = {
  _id?: string;
  year: string;
  title: string;
  duration: string;
  company: string;
  description: string;
};

const Experience = () => {
  const queryClient = useQueryClient();
  const [model, setModel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingItem, setEditingItem] = useState<ExperienceType | null>(null);

  const { data: experiences = [], isLoading } = useQuery<ExperienceType[]>({
    queryKey: ["experience"],
    queryFn: async () => {
      const response = await apiClient.get(GET_EXPERIENCE);
      return response.data;
    },
  });

  const formik = useFormik<ExperienceType>({
    enableReinitialize: true,
    initialValues: {
      _id: editingItem?._id || "",
      year: editingItem?.year || "",
      duration: editingItem?.duration || "",
      title: editingItem?.title || "",
      company: editingItem?.company || "",
      description: editingItem?.description || "",
    },
    validationSchema: Yup.object({
      year: Yup.string().required("Year is required"),
      duration: Yup.string().required("Duration is required"),
      title: Yup.string().required("Title is required"),
      company: Yup.string().required("Company is required"),
      description: Yup.string().required("Description is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {

        const formData = new FormData();
        formData.append("year", values.year);
        formData.append("duration", values.duration);
        formData.append("title", values.title);
        formData.append("company", values.company);
        formData.append("description", values.description);

        let response;
        if (values._id) {
          response = await apiClient.put(
            `${UPDATE_EXPERIENCE}/${values._id}`,
            formData,
            { withCredentials: true }
          );
        } else {
          response = await apiClient.post(CREATE_EXPERIENCE, formData, {
            withCredentials: true,
          });
        }

        if (response.status === 200 || response.status === 201) {
          toast.success(`Experience ${values._id ? "updated" : "added"} successfully`);
          queryClient.invalidateQueries({ queryKey: ["experience"] });
          closeModel();
        }
      } catch (error) {
        toast.error(`Failed to ${values._id ? "update" : "add"} Experience`);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const showModel = (item: ExperienceType | null = null) => {
    setEditingItem(item);
    setModel(true);
  };

  const closeModel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModel(false);
      setIsClosing(false);
      setEditingItem(null);
      formik.resetForm();
    }, 200);
  };

  const handleCustomSubmit = async () => {
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        year: true,
        duration: true,
        title: true,
        company: true,
        description: true,
      });
      toast.error(Object.values(errors)[0] as string);
      return;
    }
    formik.handleSubmit();
  };

  const deleteExperience = async (id: string) => {
    try {
      const response = await apiClient.delete(`${DELETE_EXPERIENCE}/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Experience deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["experience"] });
      }
    } catch (error) {
      toast.error("Failed to delete experience");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-slate-700 h-64 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-slate-700">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
          Experience Details
        </h2>
        <button
          onClick={() => showModel()}
          className="w-auto shrink-0 whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors text-sm font-medium"
        >
          Add New
        </button>
      </div>

      <div className="space-y-4">
        {experiences.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No experiences found.
          </div>
        ) : (
          experiences.map((exp) => (
            <div
              key={exp._id}
              className="bg-gray-700 p-4 sm:p-5 rounded-lg flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start border border-gray-600"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="text-blue-400 font-bold text-sm bg-gray-800 px-2 py-1 rounded w-fit">
                    {exp.year}
                  </span>
                  <h3 className="text-white font-semibold text-base sm:text-lg wrap-break-word">
                    {exp.title}
                  </h3>
                </div>
                {exp.duration && (
                  <p className="text-gray-400 text-xs mb-1 font-medium">
                    {exp.duration}
                  </p>
                )}
                <p className="text-gray-300 text-sm mb-2 wrap-break-word">{exp.company}</p>
                <p className="text-gray-400 text-xs sm:text-sm line-clamp-3 sm:line-clamp-2 wrap-break-word">
                  {exp.description}
                </p>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 sm:shrink-0">
                <button
                  onClick={() => showModel(exp)}
                  className="flex-1 sm:flex-none text-blue-400 hover:text-blue-300 bg-gray-800 px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
                  title="Edit"
                >
                  <FaEdit size={14} />
                  <span className="text-xs font-medium sm:hidden">Edit</span>
                </button>
                <button
                  onClick={() => deleteExperience(exp._id as string)}
                  className="flex-1 sm:flex-none text-red-400 hover:text-red-300 bg-gray-800 px-3 py-2 rounded transition-colors flex items-center justify-center gap-2"
                  title="Delete"
                >
                  <FaTrash size={14} />
                  <span className="text-xs font-medium sm:hidden">Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {model && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 duration-200 ${isClosing ? "animate-out fade-out" : "animate-in fade-in"}`}>
          <div className={`bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-700 duration-200 ease-out ${isClosing ? "animate-out zoom-out-95" : "animate-in zoom-in-95"}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-lg font-semibold text-white">
                {formik.values._id ? "Edit Experience" : "Add Experience"}
              </h3>
              <button
                onClick={closeModel}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Input 
                lable="Year"
                type="text"
                name="year"
                placeholder="e.g. 2021"
                value={formik.values.year}
                onChange={(value) => formik.setFieldValue("year", value)}
                onBlur={() => formik.setFieldTouched("year", true)}
                error={formik.touched.year ? formik.errors.year : undefined}
                inputType="input"
                />
              </div>
              <div>
                <Input
                lable="Duration"
                  type="text"
                  name="duration"
                  placeholder="e.g. Jan 2025 - Feb 2026"
                  value={formik.values.duration}
                  onChange={(value) => formik.setFieldValue("duration", value)}
                  onBlur={() => formik.setFieldTouched("duration", true)}
                  error={formik.touched.duration ? formik.errors.duration : undefined}
                  inputType="input"
                />
              </div>
              <div>
                <Input
                lable="Title"
                  type="text"
                  name="title"  
                  value={formik.values.title}
                  onChange={(value) => formik.setFieldValue("title", value)}
                  onBlur={() => formik.setFieldTouched("title", true)}
                  error={formik.touched.title ? formik.errors.title : undefined}
                  inputType="input"
                  placeholder="e.g. Senior Python Developer"
                />
              </div>
              <div>
                <Input
                lable="Company"
                  type="text"
                  name="company"
                  placeholder="e.g. Scotteck, Toledo"
                  value={formik.values.company}
                  onChange={(value) => formik.setFieldValue("company", value)}
                  onBlur={() => formik.setFieldTouched("company", true)}
                  error={formik.touched.company ? formik.errors.company : undefined}
                  inputType="input"
                />
              </div>
              <div>
                <Input
                lable="Description"
                  type="text"
                  name="description"
                  placeholder="Describe your role..."
                  value={formik.values.description}
                  onChange={(value) => formik.setFieldValue("description", value)}
                  onBlur={() => formik.setFieldTouched("description", true)}
                  error={formik.touched.description ? formik.errors.description : undefined}
                  inputType="textarea"
                />
              </div>
              <button
                onClick={handleCustomSubmit}
                disabled={!formik.dirty || formik.isSubmitting}
                className={`w-full font-medium py-2 rounded-md transition-colors ${
                  !formik.dirty || formik.isSubmitting
                    ? "bg-purple-400 text-gray-100 cursor-not-allowed opacity-70"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {formik.isSubmitting ? "Saving..." : "Save Experience"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Experience;
