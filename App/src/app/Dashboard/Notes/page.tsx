"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_NOTES, GET_NOTES } from "@api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Button, Input, Loading } from "@components";
import type { GetNotesResponse, NoteItem } from "@Type";
import type { AxiosError } from "axios";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const Notes = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");

    const {
        data,
        isLoading: loading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage = false,
    } = useInfiniteQuery<NoteItem[]>({
        queryKey: ["notes"],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const response = await apiClient.get<GetNotesResponse>(`${GET_NOTES}?page=${pageParam}&limit=20`, {
                withCredentials: true,
            });
            const payload = response.data.data;
            return Array.isArray(payload) ? payload : payload.notes;
        },
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length === 20 ? allPages.length + 1 : undefined,
    });
    const Note = data?.pages.flat() ?? [];
    const loadMoreRef = useInfiniteScroll({
        hasNextPage,
        isLoading: isFetchingNextPage,
        onLoadMore: fetchNextPage,
    });

    const DeleteNote = async (_id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this note?");
        if (!confirmDelete) return;

        try {
            const response = await apiClient.delete(`${DELETE_NOTES}/${_id}`, {
                withCredentials: true,
            });
            if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ["notes"] });
                toast.success("Note deleted successfully.");
            }
        } catch (error) {
            const apiError = error as AxiosError<{ message?: string }>;
            if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                toast.error("Access denied. Please login as admin.");
                return router.push("/Auth/Login");
            }
            console.error("DeleteNote Error:", error);
            toast.error(apiError.response?.data?.message || "Failed to delete note.");
        }
    };

    const FilterData = useMemo(() => {
        const lowerValue = searchTerm.toLowerCase();
        if (!lowerValue) return Note;
        return Note.filter((item) => item.title.toLowerCase().includes(lowerValue));
    }, [Note, searchTerm]);
    return (
        <div>
            <div className="flex justify-evenly gap-3 py-5">
                <div className="min-w-0 flex-1">
                    <Input
                        onChange={(value) => setSearchTerm(value)}
                        type="text"
                        value={searchTerm}
                        placeholder="Search Notes"
                        textColor="text-gray-500"
                        style="border-2 border-gray-500 bg-white px-4 py-2"
                    />
                </div>
                <Button
                    text="New"
                    onClick={() => router.push('/Dashboard/Notes/create')}
                    varient="secondary"
                    title="New Note"
                />
            </div>

            <div>
                {loading ? (
                    <div className="flex justify-center items-center h-[80vh]">
                        <Loading />
                    </div>
                ) : Note.length === 0 ? (
                    <div className="flex justify-center items-center h-[80vh]">
                        <span className="text-gray-400">No notes found</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
                        {FilterData.map((item, index) => (
                            <div
                                key={index}
                                className="w-full h-77.5 rounded-lg border shadow-md bg-slate-800 border-black flex flex-col items-center p-6 overflow-hidden"
                                data-aos="zoom-in"
                            >
                                <img
                                    src={item.note_image_url || item.imageUrl}
                                    className="mb-4 w-28 h-28 object-cover"
                                    alt="note"
                                />
                                <h5 className="mb-1 text-xl font-medium text-white text-center">
                                    {item.title}
                                </h5>
                                <span className="text-sm text-gray-400 text-center w-full line-clamp-3 overflow-hidden">
                                    {item.description}
                                </span>
                                <div className="mt-5 w-full">
                                    <div className="flex justify-evenly space-x-3 w-full">
                                        <Button
                                            onClick={() => router.push(`/Dashboard/Notes/${item._id}`)}
                                            text="Edit"
                                            varient="secondary"
                                            Icon={FaEdit}
                                            title="Edit"
                                        />

                                        <Button
                                            text="Delete"
                                            varient="danger"
                                            onClick={() => DeleteNote(item._id!)}
                                            title="Delete"
                                            Icon={FaTrash}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={loadMoreRef} className="col-span-full h-1" />
                        {isFetchingNextPage && (
                            <div className="col-span-full text-center text-gray-400">
                                Loading more notes...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
