import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_CONTACT, GET_CONTACT } from "@api";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { Loading } from "@components";

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

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: contacts = [],
    isLoading,
    isError,
    error,
  } = useQuery<ContactUsItem[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const response = await apiClient.get(GET_CONTACT, {
        withCredentials: true,
      });

      if (!response.data.success) {
        throw new Error("Please login again");
      }

      return response.data.data ?? [];
    },
  });

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

    if (apiError.response?.status === 403) {
      toast.error("Access denied. Please login as admin.");
      router.push("/login");
      return;
    }

    toast.error("Some error occurred while fetching contacts.");
  }, [isError, error, router]);

  const deleteContact = async (_id: string) => {
    if (deletingId) {
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

      if (apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        router.push("/login");
        return;
      }

      toast.error("Some error occurred while deleting the contact.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-center py-5">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[90%] rounded-md border-2 px-4 py-2 text-gray-500 outline-none"
          placeholder="Search contacts..."
        />
      </div>

      {isLoading ? (
        <div className="flex h-[70vh] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                      <span
                        className={`rounded-md px-3 py-1 text-sm ${contact.status === "new"
                          ? "bg-blue-500/20 text-blue-400"
                          : contact.status === "contacted"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : contact.status === "inProgress"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                      >
                        {contact.status === "inProgress"
                          ? "In Progress"
                          : contact.status.charAt(0).toUpperCase() +
                          contact.status.slice(1)}
                      </span>
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
        </div>
      )}
    </div>
  );
};

export default ContactUs;