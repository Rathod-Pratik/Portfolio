import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { DELETE_CONTACT, GET_CONTACT, UPDATE_CONTACT_STATUS } from "@api";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { Loading } from "@component";

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

const ContactUs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

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

  const filterData = useMemo(() => {
    const lowerValue = searchTerm.trim().toLowerCase();
    if (!lowerValue) {
      return contacts;
    }

    return contacts.filter((item) => item.name.toLowerCase().includes(lowerValue));
  }, [contacts, searchTerm]);

  useEffect(() => {
    if (!isError) {
      return;
    }

    const apiError = error as AxiosError;
    if (apiError.response?.status === 403) {
      toast.error("Access denied. Please login as admin.");
      navigate("/login");
      return;
    }

    toast.error("Some error occured while fetching contacts");
  }, [isError, error, navigate]);

  const DeleteContact = async (_id: string) => {
    try {
      const response = await apiClient.delete(`${DELETE_CONTACT}/${_id}`, {
        withCredentials: true,
      });
      if (response.status === 200) {
        toast.success("Contact Deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }
    } catch (error) {
      const apiError = error as AxiosError;
      if (apiError.response && apiError.response.status === 403) {
        toast.error("Access denied. Please login as admin.");
        return navigate("/login");
      }
      console.log(apiError);
      toast.error("Some error occured while fetching contacts");
    }
  };

  const UpdateStatus = async (_id: string, status: ContactUsItem["status"]) => {
    try {
      const response = await apiClient.put(
        `${UPDATE_CONTACT_STATUS}/${_id}`,
        { status },
        { withCredentials: true },
      );

      if (response.status === 200) {
        toast.success("Contact status updated");
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }
    } catch (error) {
      const apiError = error as AxiosError;
      if (apiError.response?.status === 403) {
        toast.error("Access denied. Please login as admin.");
        return navigate("/login");
      }
      toast.error("Some error occured while updating contact status");
    }
  };
  return (
    <div>
      <div className="flex justify-evenly gap-3 py-5">
        <input
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-2 text-gray-500 outline-none rounded-md px-4 py-2 w-[90%]"
          type="text"
          placeholder="Search Contacts"
        />
        <button className="text-white bg-blue-500 px-5 cursor-pointer py-2 rounded-md">
          Search
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-[70vh]">
          <Loading />
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="py-2 px-4 text-center">#</th>
              <th className="py-2 px-4 text-center">Name</th>
              <th className="py-2 px-4 text-center">Email</th>
              <th className="py-2 px-4 text-center">Mobile</th>
              <th className="py-2 px-4 text-center">Status</th>
              <th className="py-2 px-4 text-center">Message</th>
              <th className="py-2 px-4 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {filterData.length > 0 ? (
              filterData.map((contact, index) => (
                <tr
                  key={contact._id}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  <td className="py-2 px-4 text-center">{index + 1}</td>
                  <td className="py-2 px-4 text-center">{contact.name}</td>
                  <td className="py-2 px-4 text-center">{contact.email}</td>
                  <td className="py-2 px-4 text-center">{contact.mobile}</td>
                  <td className="py-2 px-4 text-center">
                    <select
                      value={contact.status}
                      onChange={(e) => UpdateStatus(contact._id, e.target.value as ContactUsItem["status"])}
                      className="w-full min-w-40 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="inProgress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-2 px-4 text-center">{contact.message}</td>
                  <td className="py-2 px-4 text-center">
                    {/* ✅ Delete Button */}
                    <button
                      onClick={() => DeleteContact(contact._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-4 text-center text-gray-400">
                  No contacts found.
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
