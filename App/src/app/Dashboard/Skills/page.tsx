"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_SKILL, GET_SKILL } from "@api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { Loading, Input, Button } from "@components";
import type { AdminSkillItem } from "@Type";

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
    data: skills = [],
    isLoading,
  } = useQuery<AdminSkillItem[]>({
    queryKey: ["skills"],
    queryFn: async () => {
      const response = await apiClient.get(GET_SKILL);
      return response.data.data as AdminSkillItem[];
    },
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
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/login");
        return;
      }

      console.error("DeleteSkill Error:", error);
      toast.error("Failed to delete skill.");
    }
  };

  return (
    <div>
      <div className="flex justify-evenly items-center gap-3 py-5">
        <div className="w-[90%]">
          <Input
            type="text"
            name="search"
            placeholder="Search Skills"
            value={searchTerm}
            inputType="input"
            onChange={(value) => setSearchTerm(value)}
          />
        </div>

        <Button
          type="button"
          text="New"
          Icon={FaPlus}
          varient="primary"
          onClick={() => router.push("/admin/skills/create")}
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 p-4">
            {filteredSkills.map((item) => (
              <div
                key={item._id}
                className="w-full max-w-[250px] mx-auto rounded-[20px] py-4 hover:scale-110 transition-all duration-300 flex flex-col justify-between bg-slate-900 border border-white/10 shadow-lg shadow-black/20"
              >
                <div className="flex flex-col items-center text-center my-[18px]">
                  <div
                    className="w-[120px] h-[120px] flex items-center mt-4 justify-center relative rounded-full"
                    style={{
                      background: `conic-gradient(
                        ${item.color} ${Number(item.percentage) * 3.6}deg,
                        ${ringTrackColor} 0deg
                      )`,
                    }}
                  >
                    <div className="w-[90px] sm:w-[100px] md:w-[110px] h-[90px] sm:h-[100px] md:h-[110px] bg-slate-950 rounded-full flex items-center justify-center">
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

                <div className="px-6 py-4">
                  <div className="flex justify-evenly space-x-3">
                    <Button
                      type="button"
                      text="Edit"
                      Icon={FaEdit}
                      varient="secondary"
                      onClick={() =>
                        router.push(`/admin/skills/edit/${item._id}`)
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Skill;