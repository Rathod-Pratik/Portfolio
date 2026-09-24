import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@apiClient";
import { DELETE_BLOG, GET_BLOG } from "@api";
import { toast } from "react-toastify";
import { Button, Input, Loading } from "@components";

export type BlogType = {
  _id: string;
  title: string;
  slug: string;
  isPublished?: boolean;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
};

const Blogs = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: blogs = [], isLoading: loading } = useQuery<BlogType[]>({
    queryKey: ["blogs"],
    queryFn: async () => {
      const response = await apiClient.get(GET_BLOG);
      return response.data.blog ?? [];
    },
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
    } catch (error) {
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
        <Input
          value={search}
          onChange={(value) => setSearch(value)}
          onBlur={() => setSearch(search.trim())}
          type="text"
          placeholder="Search Blog"
        />
        {/* <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border-2 text-gray-500 outline-none rounded-md px-4 py-2 w-[90%]"
          type="text"
          placeholder="Search Blog"
        /> */}
        <button
          onClick={() => router.push("/Dashboard/Blog/create")}
          className="text-white bg-blue-500 px-5 cursor-pointer py-2 rounded-md"
        >
          New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[70vh]">
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
              {blog.coverImage && (
                <div className="relative overflow-hidden">
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-purple-600/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      Blog
                    </span>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-5 flex flex-col grow">
                <h2 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                  {blog.title}
                </h2>

                <p className="text-gray-400 text-sm leading-6 grow line-clamp-3">
                  {blog.slug?.split(" ").slice(0, 20).join(" ") ??
                    "No slug available"}
                  ...
                </p>

                {/* Bottom Section */}
                <div className="flex items-center justify-between mt-6">
                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => router.push(`/Dashboard/Blog/${blog._id}`)}
                      text="Edit"
                      varient="primary"
                      title="Edit Blog"
                    />

                    <Button
                      onClick={() => deleteBlog(blog._id)}
                      text="Delete"
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
        </div>
      )}
    </div>
  );
};

export default Blogs;
