import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_NOTES, GET_NOTES } from "@api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Button, Input, Loading } from "@components";
import type { NoteItem } from "@Type";

const Notes = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");

    const { data: Note = [], isLoading: loading } = useQuery({
        queryKey: ["notes"],
        queryFn: async () => {
            const response = await apiClient.get(GET_NOTES);
            return response.data.data as NoteItem[];
        },
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
        } catch (error: any) {
            if (error.response && error.response.status === 403) {
                toast.error("Access denied. Please login as admin.");
                return router.push("/login");
            }
            console.error("DeleteNote Error:", error);
            toast.error("Failed to delete note.");
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
                <Input
                    onChange={(value) => setSearchTerm(value)}
                    type="text"
                    placeholder="Search Notes"
                />
                <Button
                    onClick={() => router.push('/Dashboard/Notes/create')}
                    text="New"
                    varient="primary"
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
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 p-4">
                        {FilterData.map((item, index) => (
                            <div
                                key={index}
                                className="w-full h-77.5 rounded-lg border shadow-md bg-slate-800 border-black flex flex-col items-center p-6 overflow-hidden"
                                data-aos="zoom-in"
                            >
                                <img
                                    src={item.note_image_url}
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notes;
