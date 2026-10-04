"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_CONTACT, GET_CONTACT, UPDATE_CONTACT_STATUS } from "@api";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { Input, Loading } from "@components";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type ContactUsItem = {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  projectType: string;
  budget: string;
  status: "new" | "contacted" | "inProgress" | "closed";
  message: string;
};

const useDebounce = <T,>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ContactUs = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage = false,
  } = useInfiniteQuery<ContactUsItem[]>({
    queryKey: ["contacts"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`${GET_CONTACT}?page=${pageParam}&limit=${limit}`, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error("Please login again");
      }

      return response.data.data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === limit ? allPages.length + 1 : undefined,
  });
  const contacts = data?.pages.flat() ?? [];
  const loadMoreRef = useInfiniteScroll({
    hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  const updateStatus = async (
    contact: ContactUsItem,
    status: ContactUsItem["status"]
  ) => {
    try {
      await apiClient.put(
        `${UPDATE_CONTACT_STATUS}/${contact._id}`,
        { _id: contact._id, status },
        { withCredentials: true }
      );
      toast.success("Contact status updated.");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        toast.error("Your admin session is invalid. Please login again.");
        router.push("/Auth/Login");
        return;
      }
      toast.error(apiError.response?.data?.message || "Failed to update contact status.");
    }
  };

  const filteredContacts = useMemo(() => {
    const value = debouncedSearch.trim().toLowerCase();

    if (!value) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(value) ||
        contact.email.toLowerCase().includes(value) ||
        contact.mobile.toLowerCase().includes(value) ||
        contact.projectType.toLowerCase().includes(value) ||
        contact.budget.toLowerCase().includes(value) ||
        contact.status.toLowerCase().includes(value) ||
        contact.message.toLowerCase().includes(value)
      );
    });
  }, [contacts, debouncedSearch]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const apiError = error as AxiosError;

    if (apiError.response?.status === 401 || apiError.response?.status === 403) {
      toast.error("Access denied. Please login as admin.");
      router.push("/Auth/Login");
      return;
    }

    toast.error("Some error occurred while fetching contacts.");
  }, [isError, error, router]);

  const deleteContact = async (_id: string) => {
    if (deletingId) {
      return;
    }

    if (!window.confirm("Delete this contact message?")) {
      return;
    }

    try {
      setDeletingId(_id);

      const response = await apiClient.delete(`${DELETE_CONTACT}/${_id}`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Contact deleted successfully.");

        queryClient.invalidateQueries({
          queryKey: ["contacts"],
        });
      }
    } catch (error) {
      const apiError = error as AxiosError;

      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/Auth/Login");
        return;
      }

      toast.error("Some error occurred while deleting the contact.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="min-w-0 flex-1 pb-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
          inputType="input"
          placeholder="Search contacts..."
          textColor="text-gray-500"
          style="border-2 border-gray-500 bg-white"
        />
        </div>

      {isLoading ? (
        <div className="flex h-[70vh] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <div className="min-h-[90vh]">
          <table className="min-w-full rounded-lg bg-gray-800 shadow-md">
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="px-4 py-2 text-center">#</th>
                <th className="px-4 py-2 text-center">Name</th>
                <th className="px-4 py-2 text-center">Email</th>
                <th className="px-4 py-2 text-center">Mobile</th>
                <th className="px-4 py-2 text-center">Project</th>
                <th className="px-4 py-2 text-center">Budget</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Message</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact, index) => (
                  <tr
                    key={contact._id}
                    className="text-gray-300 hover:bg-gray-700"
                  >
                    <td className="px-4 py-2 text-center">
                      {index + 1}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {contact.name}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {contact.email}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {contact.mobile}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {contact.projectType}
                    </td>

                    <td className="px-4 py-2 text-center">
                      {contact.budget}
                    </td>

                    <td className="px-4 py-2 text-center">
                      <select
                        value={contact.status}
                        onChange={(event) =>
                          updateStatus(
                            contact,
                            event.target.value as ContactUsItem["status"]
                          )
                        }
                        className={`rounded-md px-3 py-1 text-sm ${contact.status === "new"
                          ? "bg-blue-500/20 text-blue-400"
                          : contact.status === "contacted"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : contact.status === "inProgress"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="inProgress">In Progress</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>

                    <td className="max-w-xs px-4 py-2 text-center">
                      <div
                        className="truncate"
                        title={contact.message}
                      >
                        {contact.message}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        disabled={deletingId === contact._id}
                        onClick={() => deleteContact(contact._id)}
                        className="text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="py-6 text-center text-gray-400"
                  >
                    {debouncedSearch
                      ? "No contacts found for your search."
                      : "No contacts found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div ref={loadMoreRef} className="h-1" />
          {isFetchingNextPage && (
            <p className="py-5 text-center text-gray-400">
              Loading more contacts...
            </p>
          )}
          {!hasNextPage && contacts.length > 0 && (
            <p className="py-5 text-center text-gray-500">
              No more contacts.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactUs;