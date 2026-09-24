import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { GET_ADMIN_DETAIL } from "@api";
import { Loading } from "@components";
import { DashboardStatsResponse, DataStat } from "@Type";
import { Experience, Expertise, Hero } from "./Component";

const Dashboard = () => {

    const FetchData = async (): Promise<DataStat[]> => {
        const response = await apiClient.get<DashboardStatsResponse>(GET_ADMIN_DETAIL, {
            withCredentials: true,
        });
        if (response.status === 200) {
            return [
                {
                    label: "Blog Posts",
                    value: response.data.BlogLength,
                },
                {
                    label: "Projects",
                    value: response.data.ProjectLength,
                },
                {
                    label: "Notes",
                    value: response.data.NoteLength,
                },
                {
                    label: "Contacts",
                    value: response.data.ContactLength,
                },
                {
                    label: "Skills",
                    value: response.data.SkillLength,
                },
                {
                    label: "Views",
                    value: response.data.AdminView,
                },
            ];
        }
        return [];
    };


  const { data: dataStats = [], isLoading } = useQuery<DataStat[]>({
    queryKey: ["adminStats"],
    queryFn: FetchData,
    staleTime: 1000 * 60 * 5, 
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-72px)] text-white p-6 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div
        data-aos="zoom-in"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-6 mb-10"
      >
        {dataStats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl sm:rounded-3xl p-3 sm:p-6 flex flex-col items-center justify-center transition duration-200 shadow-xl bg-blue-500 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-2xl"
          >
            <h2 className="text-[10px] sm:text-md font-medium mb-1 sm:mb-2 text-slate-100 tracking-wide opacity-80 text-center leading-tight">
              {label}
            </h2>
            <p className="text-2xl sm:text-4xl font-black text-white drop-shadow-md">
              {value}
            </p>
          </div>
        ))}
      </div>
      <Hero />
      <Expertise />
      <div className="mt-6">
        <Experience />
      </div>
   
    </div>
  );
};

export default Dashboard;
