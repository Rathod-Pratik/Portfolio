import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@apiClient";
import { GET_ABOUT, UPDATE_ABOUT } from "@api";
import { Input, Loading } from "@components";
import { useFormik } from "formik";
import * as Yup from "yup";

type AboutType = {
    content: string
}

const About = () => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);

    const FetchAbout = async () => {
        const response = await apiClient.get(GET_ABOUT);
        return response.data;
    }

    const { data, isLoading } = useQuery({
        queryKey: ["about"],
        queryFn: FetchAbout,
    });

    useEffect(() => {
        if (data) {
            setContent(data.content || "");
        }
    }, [data]);

    const formik = useFormik<AboutType>({
        enableReinitialize: true,
        initialValues: {
            content: content
        },
        validationSchema: Yup.object({
            content: Yup.string().required("Content is required"),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                await apiClient.put(UPDATE_ABOUT, { content }, { withCredentials: true });
                queryClient.invalidateQueries({ queryKey: ["about"] });
                toast.success("About section updated successfully!");
            } catch (error: any) {
                if (error.response?.status === 403) {
                    toast.error("Access denied. Please login as admin.");
                } else {
                    toast.error("Failed to update About section.");
                }
                console.error(error);
            } finally {
                setSubmitting(false);
            }
        }
    })

    const handleSubmit = async () => {
        const errors = await formik.validateForm();

        if (Object.keys(errors).length > 0) {
            formik.setTouched({
                content: true
            })
            toast.error(Object.values(errors)[0])
            return;
        }

        formik.handleSubmit();

    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-6  mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">About</h2>
                <button
                    onClick={handleSubmit}
                    disabled={formik.isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                    {formik.isSubmitting ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
                <Input
                    type="text"
                    name="Content"
                    lable=" About Content (Markdown supported)"
                    value={content}
                    onChange={(value) => formik.setFieldValue('content', value)}
                    onBlur={() => formik.setFieldTouched('content', true)}
                    inputType='textarea'
                    placeholder="Please Enter Content"
                />
                <div className="mt-4 text-sm text-gray-400 flex justify-between">
                    <span>You can use markdown formatting: **bold**, *italic*, [links](url), etc.</span>
                    <span>{content.length} characters</span>
                </div>
            </div>
        </div>
    );
};

export default About;