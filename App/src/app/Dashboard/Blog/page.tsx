"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@apiClient";
import { DELETE_BLOG, GET_BLOG } from "@api";
import { toast } from "react-toastify";
import { Button, Input, Loading } from "@components";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export type BlogType = {
  _id: string;
  title: string;
  slug: string;
  isPublished?: boolean;
  excerpt?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
};

const Blogs = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery<BlogType[]>({
    queryKey: ["blogs"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(
        `${GET_BLOG}?page=${pageParam}&limit=20`,
      );
      return response.data.blog ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
  });
  const blogs = data?.pages.flat() ?? [];
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const deleteBlog = async (id: string) => {
    const shouldDelete = window.confirm("Delete this blog?");
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await apiClient.delete(`${DELETE_BLOG}/${id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Blog Deleted Successfully");
        queryClient.invalidateQueries({ queryKey: ["blogs"] });
      }
    } catch {
      toast.error("Failed to delete blog");
    }
  };

  const filteredBlogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return blogs;
    }

    return blogs.filter((blog) => blog.title.toLowerCase().includes(keyword));
  }, [blogs, search]);

  return (
    <div className="p-5">
      <div className="flex justify-evenly gap-3 py-5">
        <div className="min-w-0 flex-1">
          <Input
            value={search}
            onChange={(value) => setSearch(value)}
            type="text"
            placeholder="Search Blog"
            textColor="text-gray-500"
            style="border-2 border-gray-500 bg-white px-4 py-2"
          />
          </div>
          <Button
            text="New"
            onClick={() => router.push("/Dashboard/Blog/create")}
            varient="secondary"
            title="New Note"
          />

        
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-[80vh]">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 p-4">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              onClick={() => router.push(`/Dashboard/Blog/${blog._id}`)}
              className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 to-gray-800 border border-gray-700/50 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col"
            >
              {/* Image Section */}
              {blog.image && (
                <div className="relative overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>

                </div>
              )}

              {/* Content */}
              <div className="p-5 flex flex-col grow">
                <h2 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                  {blog.title}
                </h2>

                <p className="text-gray-400 text-sm leading-6 grow line-clamp-3">
                  {blog.excerpt?.split(" ").slice(0, 20).join(" ") ??
                    "No excerpt available"}
                  ...
                </p>

                {/* Bottom Section */}
                <div className="flex items-center justify-between mt-6">
                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => router.push(`/Dashboard/Blog/${blog._id}`)}
                      text="Edit"
                      Icon={FaEdit}
                      varient="secondary"
                      title="Edit Blog"
                    />

                    <Button
                      onClick={() => deleteBlog(blog._id)}
                      text="Delete"
                      Icon={FaTrash}
                      varient="danger"
                      title="Delete Blog"
                    />
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none">
                <div className="absolute -inset-px rounded-2xl border border-purple-500/30"></div>
              </div>
            </div>
          ))}
          <div ref={loadMoreRef} className="col-span-full h-1" />
          {isFetchingNextPage && (
            <div className="col-span-full text-center text-gray-400">
              Loading more blogs...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Blogs;
