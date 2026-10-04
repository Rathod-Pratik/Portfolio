"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { useState } from "react";
import { CREATE_CV, GET_CV, UPDATE_CV } from "@api";
import { apiClient } from "@apiClient";
import { Button, Input } from "@components";

type ResumeItem = {
    _id?: string;
    CV?: string;
};

const Resume = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [showModel, setShowModel] = useState(false);

    const {
        data: resumeFile = null,
    } = useQuery<ResumeItem | null>({
        queryKey: ["resume"],
        queryFn: async () => {
            const response = await apiClient.get(GET_CV, {
                withCredentials: true,
            });

            const data = response.data.data;
            if (typeof data === "string") {
                return { CV: data };
            }

            return data ?? null;
        },
    });

    const validationSchema = yup.object({
        file: yup
            .mixed<File>()
            .required("Resume PDF is required")
            .test(
                "fileType",
                "Only PDF files are allowed",
                (value) => {
                    if (!value) return true;

                    return value.type === "application/pdf";
                }
            )
            .test(
                "fileSize",
                "PDF size must be less than 5 MB",
                (value) => {
                    if (!value) return true;

                    return value.size <= 5 * 1024 * 1024;
                }
            ),
    });

    const formik = useFormik({
        enableReinitialize: true,

        initialValues: {
            file: undefined as File | undefined,
        },

        validationSchema,

        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!values.file) {
                    return;
                }

                if (resumeFile && !resumeFile._id) {
                    toast.error(
                        "The CV record ID is unavailable, so it cannot be replaced."
                    );
                    return;
                }

                const formData = new FormData();

                formData.append("file", values.file);

                let response;

                if (resumeFile?._id) {
                    formData.append("_id", resumeFile._id);

                    response = await apiClient.put(
                        UPDATE_CV,
                        formData,
                        {
                            withCredentials: true,
                        }
                    );
                } else {
                    response = await apiClient.post(
                        CREATE_CV,
                        formData,
                        {
                            withCredentials: true,
                        }
                    );
                }

                if (response.status === 202) {
                    toast.success(
                        resumeFile?._id
                            ? "Resume updated successfully"
                            : "Resume uploaded successfully"
                    );

                    queryClient.invalidateQueries({
                        queryKey: ["resume"],
                    });

                    resetForm();
                    setShowModel(false);
                }
            } catch (error) {
                const apiError =
                    error as AxiosError<{ message?: string }>;

                if (
                    apiError.response?.status === 401 ||
                    apiError.response?.status === 403
                ) {
                    toast.error(
                        "Access denied. Please login as admin."
                    );

                    router.push("/Auth/Login");
                    return;
                }

                toast.error(
                    apiError.response?.data?.message ||
                    "Something went wrong"
                );
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div>


            {showModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-700 p-4">
                            <h3 className="text-xl font-semibold text-white">
                                {resumeFile
                                    ? "Update Resume"
                                    : "Add New Resume"}
                            </h3>

                            <Button
                                type="button"
                                varient="secondary"
                                text="×"
                                onClick={() => setShowModel(false)}
                            />
                        </div>

                        <div className="p-4">
                            <Input
                                name="file"
                                lable="Resume PDF"
                                inputType="PDF"
                                pdfFile={formik.values.file}
                                pdfName={
                                    resumeFile?.CV
                                        ? "Resume.pdf"
                                        : undefined
                                }
                                handlePdfChange={(file) => {
                                    formik.setFieldValue(
                                        "file",
                                        file
                                    );

                                    formik.setFieldTouched(
                                        "file",
                                        true
                                    );
                                }}
                                error={
                                    formik.touched.file &&
                                        formik.errors.file
                                        ? formik.errors.file
                                        : undefined
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-700 p-4">
                            <Button
                                type="button"
                                varient="secondary"
                                text="Cancel"
                                onClick={() =>
                                    setShowModel(false)
                                }
                            />

                            <Button
                                type="submit"
                                text={
                                    resumeFile
                                        ? "Update"
                                        : "Upload"
                                }
                                ProcessText="Processing..."
                                isSubmitting={
                                    formik.isSubmitting
                                }
                                onClick={() =>
                                    formik.submitForm()
                                }
                            />
                        </div>
                    </div>
                </div>
            )}

            {resumeFile?.CV && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">

                        <h2 className="mb-4 text-2xl font-bold text-white">
                            Resume
                        </h2>
                        <Button
                            type="button"
                            text={resumeFile ? "Update" : "Add"}
                            onClick={() => {
                                formik.resetForm();
                                setShowModel(true);
                            }}
                        />
                    </div>


                    <iframe
                        src={resumeFile.CV}
                        width="100%"
                        height="800px"
                        title="Resume PDF"
                    />
                </div>
            )}
        </div>
    );
};

export default Resume;