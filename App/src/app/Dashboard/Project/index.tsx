"use client";
import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { DELETE_PROJECT, GET_PROJECT } from "@api";
import apiClient from "@apiClient";
import { Button, Input, Loading } from "@components";
import type { AxiosError } from "axios";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const Projects = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery({
    queryKey: ["projects"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`${GET_PROJECT}?page=${pageParam}&limit=20`, {
        withCredentials: true,
      });
      return response.data.data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
  });
  const projects = data?.pages.flat() ?? [];
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const filteredProjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return projects;
    }

    return projects.filter((item:any) => item.title.toLowerCase().includes(keyword));
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
      <div className="flex  gap-3 py-5">
        <div className="min-w-0 flex-1">
          <Input
            type="text"
            placeholder="Search Project"
            value={searchTerm}
            onChange={setSearchTerm}
            textColor="text-gray-500"
            style="border-2 border-gray-500 bg-white px-4 py-2"
          />
        </div>
        <Button
          text="New"
          title="New Project"
          onClick={() => router.push("/Dashboard/Project/create")}
          varient="secondary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <Loading />
        </div>
      ) : (
        <div className="min-h-[80vh] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 ">
          {filteredProjects.map((item :any) => (
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

              <div className="flex flex-col grow p-6">
                <h5 className="mb-2 text-xl font-bold text-gray-900 dark:text-white text-center">
                  {item.title}
                </h5>

  

                <div className="mb-4 grow">
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-left">
                    {item.description.length > 70 ? `${item.description.slice(0, 125)}...` : item.description}
                  </p>
                </div>

                <div className="flex justify-center space-x-3 border-t pt-4">
                  <Button
                    text="Edit"
                    varient="secondary"
                    Icon={FaEdit}
                    onClick={() => router.push(`/Dashboard/Project/${item._id}`)}
                    title="Edit"
                  />
                  <Button
                    text="Delete"
                    ProcessText="Deleting..."
                    Icon={FaTrash}
                    varient="danger"
                    onClick={() => handleDeleteProject(item._id)}
                    isSubmitting={deletingId === item._id}
                    title="Delete"
                  />
                </div>
              </div>
            </div>
          ))}
          <div ref={loadMoreRef} className="col-span-full h-1" />
          {isFetchingNextPage && (
            <div className="col-span-full text-center text-gray-400">
              Loading more projects...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
