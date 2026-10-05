import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiImage, FiPlus, FiTrash2, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { CREATE_PROJECT, DELETE_PROJECT, EDIT_PROJECT, GET_PROJECT_DATA } from "@api";
import apiClient from "@apiClient";
import { InputField, Loading } from "@component";
import type { AxiosError } from "axios";
import type {
  CreateOrUpdateProjectPayload,
  ProjectDifficultyOption,
  ProjectFormData,
  ProjectItem,
} from "@Type";

type Params = {
  _id?: string;
};

type GetProjectDataResponse = {
  data: ProjectItem;
};

const getInitialFormData = (): ProjectFormData => ({
  title: "",
  subtitle: "",
  techStack: [""],
  description: "",
  liveDemoLink: "",
  images: "",
  imageFile: null,
  features: [""],
  difficult: "",
});

const toFormData = (project: ProjectItem): ProjectFormData => ({
  _id: project._id,
  title: project.title,
  subtitle: project.subtitle ?? "",
  techStack: project.techStack?.length ? project.techStack : [""],
  description: project.description,
  liveDemoLink: project.liveDemoLink ?? "",
  images: project.images,
  imageFile: null,
  features: project.features?.length ? project.features : [""],
  difficult: project.difficult ?? "",
});

const CreateProject = () => {
  const navigate = useNavigate();
  const { _id } = useParams<Params>();
  const [formData, setFormData] = useState<ProjectFormData>(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditMode = Boolean(_id);

  const {
    data: project,
    isLoading: loadingProject,
    isError,
  } = useQuery<ProjectItem>({
    queryKey: ["project", _id],
    enabled: isEditMode && Boolean(_id),
    queryFn: async () => {
      const response = await apiClient.put<GetProjectDataResponse>(
        `${GET_PROJECT_DATA}/${_id}`,
        {},
        { withCredentials: true }
      );

      const projectData = response.data.data;
      if (!projectData) {
        throw new Error("Project not found");
      }

      return projectData;
    },
  });

  useEffect(() => {
    if (project) {
      setFormData(toFormData(project));
    }
  }, [project]);

  useEffect(() => {
    if (isError && isEditMode) {
      toast.error("Failed to load project");
      navigate("/admin/project");
    }
  }, [isEditMode, isError, navigate]);

  const selectedImageInfo = useMemo(() => {
    if (!formData.imageFile) {
      return null;
    }

    return {
      name: formData.imageFile.name,
      sizeMb: (formData.imageFile.size / 1024 / 1024).toFixed(2),
    };
  }, [formData.imageFile]);

  const validateForm = (): boolean => {
    if (formData.title.trim().length < 5) {
      toast.error("Title length must be at least 5 characters");
      return false;
    }
    if (formData.description.trim().length < 15) {
      toast.error("Description length must be at least 15 characters");
      return false;
    }
    if (formData.subtitle.trim().length < 10) {
      toast.error("Subtitle length must be at least 10 characters");
      return false;
    }
    if (!formData.difficult) {
      toast.error("Difficulty is required");
      return false;
    }
    if (!formData.liveDemoLink.trim()) {
      toast.error("Live demo link is required");
      return false;
    }
    if (formData.features.filter((item) => item.trim()).length < 1) {
      toast.error("At least one feature is required");
      return false;
    }
    if (formData.techStack.filter((item) => item.trim()).length < 1) {
      toast.error("At least one tech stack item is required");
      return false;
    }
    if (!formData.images && !formData.imageFile) {
      toast.error("Please select an image");
      return false;
    }

    return true;
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      images: URL.createObjectURL(file),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.features];
      next[index] = value;
      return { ...prev, features: next };
    });
  };

  const updateTechStack = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.techStack];
      next[index] = value;
      return { ...prev, techStack: next };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();
      if (formData._id) {
        payload.append("_id", formData._id);
      }
      payload.append("title", formData.title);
      payload.append("subtitle", formData.subtitle);
      payload.append("content", formData.description);
      payload.append("techStack", JSON.stringify(formData.techStack.filter((item) => item.trim() !== "")));
      payload.append("liveDemoLink", formData.liveDemoLink);
      payload.append("features", JSON.stringify(formData.features.filter((item) => item.trim() !== "")));
      payload.append("difficult", formData.difficult);

      if (formData.imageFile) {
        payload.append("file", formData.imageFile);
      }

      if (isEditMode) {
        const response = await apiClient.put(EDIT_PROJECT, payload, {
          withCredentials: true,
        });
        if (response.status === 200) {
          toast.success("Project updated successfully");
          navigate("/admin/project");
        }
      } else {
        const response = await apiClient.post(CREATE_PROJECT, payload, {
          withCredentials: true,
        });
        if (response.status === 200) {
          toast.success("Project created successfully");
          setFormData(getInitialFormData());
          navigate("/admin/project");
        }
      }
    } catch (error) {
      const apiError = error as AxiosError;
      if (apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        navigate("/login");
        return;
      }
      toast.error(isEditMode ? "Failed to update project" : "Failed to create project");
      console.error(apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData._id) {
      return;
    }

    const shouldDelete = window.confirm("Delete this project?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiClient.delete(`${DELETE_PROJECT}/${formData._id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Project deleted successfully");
        navigate("/admin/project");
      }
    } catch (error) {
      const apiError = error as AxiosError;
      if (apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        navigate("/login");
        return;
      }
      toast.error("Failed to delete project");
      console.error(apiError);
    } finally {
      setDeleting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loading />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          {isEditMode ? "Edit Project" : "Create Project"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/project")}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-red-300 bg-red-900/40 border border-red-500 rounded-md hover:bg-red-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Project Image</label>
        <div className="flex items-center gap-4">
          <label className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-700 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 overflow-hidden transition-colors">
            {formData.images ? (
              <img src={formData.images} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center p-4 text-gray-400">
                <FiImage size={24} />
                <span className="text-xs mt-2">Click to upload</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
          <div className="text-sm text-gray-400">
            {selectedImageInfo ? (
              <>
                <p className="font-medium text-gray-300">{selectedImageInfo.name}</p>
                <p className="text-xs">{selectedImageInfo.sizeMb} MB</p>
              </>
            ) : (
              "Supports: JPG, PNG, WEBP"
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Title"
          value={formData.title}
          onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Project title"
          required
        />

        <InputField
          label="Subtitle"
          value={formData.subtitle}
          onChange={(event) => setFormData((prev) => ({ ...prev, subtitle: event.target.value }))}
          placeholder="Brief project subtitle"
          required
        />

        <InputField
          label="Live Demo URL"
          value={formData.liveDemoLink}
          onChange={(event) => setFormData((prev) => ({ ...prev, liveDemoLink: event.target.value }))}
          placeholder="https://example.com"
          type="url"
          required
        />
      </div>

      <div className="w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
        <select
          value={formData.difficult}
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              difficult: event.target.value as ProjectDifficultyOption,
            }))
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
          rows={5}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your project in detail..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Key Features</label>
        <div className="space-y-2">
          {formData.features.map((feature, index) => (
            <input
              key={`feature-${index}`}
              value={feature}
              onChange={(event) => updateFeature(index, event.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Feature ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, features: [...prev.features, ""] }))}
          className="mt-3 flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <FiPlus className="mr-1" size={14} />
          Add Feature
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tech Stack</label>
        <div className="space-y-2">
          {formData.techStack.map((tech, index) => (
            <input
              key={`tech-${index}`}
              value={tech}
              onChange={(event) => updateTechStack(index, event.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Tech ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, techStack: [...prev.techStack, ""] }))}
          className="mt-3 flex items-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          <FiPlus className="mr-1" size={14} />
          Add Tech Stack
        </button>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
        {isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiTrash2 className="mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <FiUpload className="mr-2" />
              {isEditMode ? "Update Project" : "Create Project"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateProject;
