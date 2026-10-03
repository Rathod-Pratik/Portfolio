"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaEdit, FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { DELETE_PROJECT, GET_PROJECT } from "@api";
import apiClient from "@apiClient";
import { Loading } from "@components";
import type { AxiosError } from "axios";

const Projects = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiClient.get(`${GET_PROJECT}?page=1&limit=100`, {
        withCredentials: true,
      });
      return response.data.data ?? [];
    },
  });

  const filteredProjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return projects;
    }

    return projects.filter((item) => item.title.toLowerCase().includes(keyword));
  }, [projects, searchTerm]);

  const handleDeleteProject = async (projectId: string) => {
    const shouldDelete = window.confirm("Delete this project?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(projectId);
      const response = await apiClient.delete(`${DELETE_PROJECT}/${projectId}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Project deleted successfully");
      }
    } catch (error) {
      const apiError = error as AxiosError;
      if (apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/Auth/Login");
        return;
      }

      toast.error("Failed to delete project");
      console.error(apiError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-evenly gap-3 py-5">
        <input
          type="text"
          placeholder="Search Project"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="border-2 text-gray-500 outline-none rounded-md px-4 py-2 w-[90%]"
        />
        <button
          onClick={() => router.push("/Dashboard/Project/create")}
          className="text-white bg-blue-500 px-5 py-2 rounded-md cursor-pointer"
        >
          New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 p-4">
          {filteredProjects.map((item) => (
            <div
              data-aos="fade-up"
              key={item._id}
              className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-md dark:bg-slate-800 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-center p-4 bg-gray-100 dark:bg-slate-700">
                <img
                  src={item.image || item.images}
                  className="w-full h-48 object-contain rounded-t-lg"
                  alt={item.title}
                />
              </div>

              <div className="flex flex-col flex-grow p-6">
                <h5 className="mb-2 text-xl font-bold text-gray-900 dark:text-white text-center">
                  {item.title}
                </h5>

                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {(item.techStack ?? []).map((lang, index) => (
                    <span
                      key={`${item._id}-${index}`}
                      className="px-2 py-1 rounded-md text-xs border border-gray-500 text-gray-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                <div className="mb-4 flex-grow">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex justify-center space-x-3 mb-4">
                  {item.liveDemoLink && (
                    <a
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                      href={item.liveDemoLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaExternalLinkAlt className="mr-2" />
                      Demo
                    </a>
                  )}
                </div>

                <div className="flex justify-center space-x-3 border-t pt-4">
                  <button
                    onClick={() => router.push(`/Dashboard/Project/${item._id}`)}
                    className="flex items-center px-4 py-2 border border-blue-500 text-blue-500 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit"
                  >
                    <FaEdit className="mr-2" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(item._id)}
                    disabled={deletingId === item._id}
                    className="flex items-center px-4 py-2 border border-red-500 text-red-500 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <FaTrash className="mr-2" />
                    <span>{deletingId === item._id ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
