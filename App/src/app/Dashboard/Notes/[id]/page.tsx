import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { FiUpload, FiFileText, FiImage, FiTrash2 } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { CREATE_NOTES, EDIT_NOTES, DELETE_NOTES } from "@api";
import type { NoteFormData, NoteItem } from "@Type";

const emptyFormData: NoteFormData = {
  _id: null,
  title: "",
  description: "",
  imageFile: null,
  note_image_url: "",
  note_pdf_url: "",
  pdfFile: null,
};

const CreateNote = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<NoteFormData>(emptyFormData);
  const [imagePreview, setImagePreview] = useState("");

  const resolveImagePreview = async (value: string) => {
    if (!value) {
      setImagePreview("");
      return;
    }

    if (value.startsWith("http://") || value.startsWith("https://")) {
      setImagePreview(value);
      return;
    }

    try {
      const response = await apiClient.post<{ url: string }>("/s3/signed-get-url", {
        key: value,
      });
      setImagePreview(response.data.url);
    } catch (error) {
      console.error("Failed to resolve note image preview", error);
      setImagePreview("");
    }
  };

  useEffect(() => {
    if (location.state?.item) {
      const item = location.state.item as NoteItem;
      const existingImage = item.note_image_url || item.imageUrl || "";
      setFormData({
        _id: item._id || null,
        title: item.title,
        description: item.description,
        imageFile: null,
        note_image_url: existingImage,
        note_pdf_url: item.note_pdf_url || item.fileUrl || "",
        pdfFile: null,
      });
      resolveImagePreview(existingImage);
    }
  }, [location.state]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        note_image_url: previewUrl,
      }));
      setImagePreview(previewUrl);
    } else {
      setFormData((prev) => ({
        ...prev,
        pdfFile: file,
        note_pdf_url: file.name,
      }));
    }
  };

  const AddNotes = async () => {
    try {
      if (!formData.title) return toast.error("Title is required.");
      if (!formData.pdfFile) return toast.error("PDF file is required.");
      if (!formData.description) return toast.error("Description is required.");
      if (!formData.imageFile) return toast.error("Image is required.");

      setLoading(true);

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description || "");
      payload.append("file", formData.pdfFile);
      payload.append("image", formData.imageFile);

      const response = await apiClient.post(CREATE_NOTES, payload, {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Note added successfully.");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        navigate("/admin/notes");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        toast.error("Access denied. Please login as admin.");
        return navigate("/login");
      }
      console.error("AddNotes Error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const UpdateNote = async () => {
    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("_id", String(formData._id));
      payload.append("title", formData.title.trim());
      payload.append("description", (formData.description || "").trim());

      if (formData.pdfFile) {
        payload.append("file", formData.pdfFile);
      }

      if (formData.imageFile) {
        payload.append("image", formData.imageFile);
      }

      const response = await apiClient.put(EDIT_NOTES, payload, {
        withCredentials: true,
      });

      if (response.status === 200) {
        toast.success("Note updated successfully.");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        navigate("/admin/notes");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        toast.error("Access denied. Please login as admin.");
        return navigate("/login");
      }
      console.error("UpdateNote Error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const DeleteNote = async () => {
    if (!formData._id) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      const response = await apiClient.delete(`${DELETE_NOTES}/${formData._id}`, {
        withCredentials: true,
      });
      if (response.status === 200) {
        toast.success("Note deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        navigate("/admin/notes");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        toast.error("Access denied. Please login as admin.");
        return navigate("/login");
      }
      console.error("DeleteNote Error:", error);
      toast.error("Failed to delete note.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (formData._id) {
          UpdateNote();
          return;
        }
        AddNotes();
      }}
      className="p-4 sm:p-6 space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">
          {formData._id ? "Edit Note" : "Create Note"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/notes")}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          {formData._id && (
            <button
              type="button"
              onClick={DeleteNote}
              disabled={isDeleting || loading}
              className="px-4 py-2 text-red-300 bg-red-900/40 border border-red-500 rounded-md hover:bg-red-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
        <div className="flex items-center gap-4">
          <label className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-700 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 overflow-hidden transition-colors">
            {formData.note_image_url ? (
              <img src={imagePreview || formData.note_image_url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center p-4 text-gray-400">
                <FiImage size={24} />
                <span className="text-xs mt-2">Click to upload</span>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "image")}
            />
          </label>
          <div className="text-sm text-gray-400">
            {formData.imageFile ? formData.imageFile.name : "Supports: JPG, PNG, WEBP"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Note title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">PDF Document</label>
          <label className="flex items-center gap-3 bg-gray-700 border border-gray-600 rounded-md px-4 py-2 hover:bg-gray-600 cursor-pointer transition-colors">
            <FiFileText className="text-gray-300" size={18} />
            <span className="text-gray-300 truncate">{formData.note_pdf_url || "Choose PDF file"}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, "pdf")}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Describe this note..."
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
        {formData._id && (
          <button
            type="button"
            onClick={DeleteNote}
            disabled={isDeleting || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center min-w-30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiTrash2 className="mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || isDeleting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center min-w-30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <FiUpload className="mr-2" />
              {formData._id ? "Update Note" : "Create Note"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateNote;