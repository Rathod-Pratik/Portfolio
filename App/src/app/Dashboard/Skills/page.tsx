"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_SKILL, GET_SKILL } from "@api";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Loading, Input, Button } from "@components";
import type { AdminSkillItem } from "@Type";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const useDebounce = <T,>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const Skill = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const ringTrackColor = "#334155";

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery<AdminSkillItem[]>({
    queryKey: ["skills"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`${GET_SKILL}?page=${pageParam}&limit=20`);
      return response.data.data as AdminSkillItem[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
  });
  const skills = data?.pages.flat() ?? [];
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const filteredSkills = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    if (!keyword) {
      return skills;
    }

    return skills.filter((item) =>
      item.language.toLowerCase().includes(keyword)
    );
  }, [debouncedSearch, skills]);

  const handleDeleteSkill = async (_id: string) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this skill?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await apiClient.delete(`${DELETE_SKILL}/${_id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        queryClient.invalidateQueries({
          queryKey: ["skills"],
        });

        toast.success("Skill deleted successfully.");
      }
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      if (
        apiError.response?.status === 401 ||
        apiError.response?.status === 403
      ) {
        toast.error("Access denied. Please login as admin.");
        router.push("/Auth/Login");
        return;
      }

      console.error("DeleteSkill Error:", error);
      toast.error(apiError.response?.data?.message || "Failed to delete skill.");
    }
  };

  return (
    <div>
      <div className="flex  gap-3 py-5">
        <div className="min-w-0 flex-1">
          <Input
            type="text"
            placeholder="Search Skills"
            value={searchTerm}
            inputType="input"
             textColor="text-gray-500"
            onChange={(value) => setSearchTerm(value)}
            style="border-2 border-gray-500 bg-white"
          />
        </div>

        <Button
          type="button"
          text="New"
          varient="secondary"
          onClick={() => router.push("/Dashboard/Skills/create")}
        />
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-[80vh]">
            <Loading />
          </div>
        ) : skills.length === 0 ? (
          <div className="flex justify-center items-center h-[80vh]">
            <span className="text-gray-400">No skills found</span>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="flex justify-center items-center h-[80vh]">
            <span className="text-gray-400">
              No skills match your search
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
            {filteredSkills.map((item) => (
              <div
                key={item._id}
                className="w-64 mx-auto rounded-[20px]  py-4 hover:scale-110 transition-all duration-300 flex flex-col justify-between bg-slate-800 border-black border shadow-lg shadow-black/20"
              >
                <div className="flex flex-col items-center text-center my-4.5">
                  <div
                    className="w-30 h-30 flex items-center mt-4 justify-center relative rounded-full"
                    style={{
                      background: `conic-gradient(
                        ${item.color} ${Number(item.percentage) * 3.6}deg,
                        ${ringTrackColor} 0deg
                      )`,
                    }}
                  >
                    <div className="w-22.5 h-22.5 sm:w-25 sm:h-25  md:w-27.5 md:h-27.5 bg-slate-950 rounded-full flex items-center justify-center">
                      <div
                        className="absolute text-[20px] sm:text-[22px] md:text-[24px] font-bold"
                        style={{ color: item.color }}
                      >
                        {item.percentage}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-[1rem] sm:text-[1.1rem] md:text-[1.2rem] lg:text-[1.4rem] font-medium text-white">
                    {item.language}
                  </div>
                </div>

                <div className="py-4 px-6">
                  <div className="flex justify-between gap-2">
                    <Button
                      type="button"
                      text="  Edit  "
                      Icon={FaEdit}
                      varient="secondary"
                      onClick={() =>
                        router.push(`/Dashboard/Skills/${item._id}`)
                      }
                    />

                    <Button
                      type="button"
                      text="Delete"
                      Icon={FaTrash}
                      varient="danger"
                      onClick={() => handleDeleteSkill(item._id!)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div ref={loadMoreRef} className="col-span-full h-1" />
            {isFetchingNextPage && (
              <div className="col-span-full text-center text-gray-400">
                Loading more skills...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Skill;