"use client";

import { useFormik } from "formik";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { FORGOT_PASSWORD } from "@api";
import apiClient from "@apiClient";
import { Input, Button } from "@components";

type ForgotPasswordValues = {
    email: string;
};

const validationSchema = yup.object({
    email: yup
        .string()
        .trim()
        .email("Please enter a valid email address.")
        .required("Email is required."),
});

const ForgotPassword = () => {
    const router = useRouter();

    const formik = useFormik<ForgotPasswordValues>({
        initialValues: {
            email: "",
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            const normalizedEmail = values.email.toLowerCase().trim();

            try {
                const response = await apiClient.post(
                    FORGOT_PASSWORD,
                    {
                        email: normalizedEmail,
                    },
                    {
                        withCredentials: true,
                    }
                );

                if (response.status === 200) {
                    sessionStorage.setItem(
                        "resetEmail",
                        normalizedEmail
                    );

                    toast.success("OTP sent to your email.");

                    router.push("/reset-password/otp");
                }
            } catch (error) {
                const apiError = error as AxiosError<{
                    error?: string;
                    message?: string;
                }>;

                toast.error(
                    apiError.response?.data?.error ||
                    apiError.response?.data?.message ||
                    "Failed to send OTP."
                );
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="relative shadow-xl rounded-2xl overflow-hidden w-full max-w-md sm:max-w-2xl lg:max-w-4xl bg-[#111827] border border-gray-800 p-6 sm:p-10 lg:p-12">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Forgot Password
                    </h2>

                    <p className="mt-2 text-sm sm:text-base text-gray-400">
                        Enter your email address and we will send you a
                        one-time password.
                    </p>
                </div>

                <form
                    onSubmit={formik.handleSubmit}
                    className="space-y-8 max-w-lg mx-auto"
                >
                    <Input
                        type="email"
                        name="email"
                        lable="Email address"
                        placeholder="Enter your email"
                        value={formik.values.email}
                        inputType="input"
                        onChange={(value) =>
                            formik.setFieldValue(
                                "email",
                                value.toLowerCase()
                            )
                        }
                        onBlur={() =>
                            formik.setFieldTouched("email", true)
                        }
                        error={
                            formik.touched.email
                                ? formik.errors.email
                                : undefined
                        }
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            type="submit"
                            text="Send OTP"
                            ProcessText="Sending OTP..."
                            varient="primary"
                            isSubmitting={formik.isSubmitting}
                            className="w-full"
                        />

                        <Button
                            type="button"
                            text="Back to Login"
                            varient="secondary"
                            isDisabled={formik.isSubmitting}
                            onClick={() => router.push("/login")}
                            className="w-full"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;