"use client";

import { useFormik } from "formik";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { FORGOT_PASSWORD } from "@api";
import apiClient from "@apiClient";
import { Input, Button } from "@components";

type Values = { email: string };
type ApiError = { error?: string; message?: string };

const schema = yup.object({
    email: yup.string().trim().email("Please enter a valid email address.").required("Email is required."),
});

export default function ForgotPassword() {
    const router = useRouter();
    const formik = useFormik<Values>({
        initialValues: { email: "" },
        validationSchema: schema,
        onSubmit: async ({ email }, { setSubmitting }) => {
            const normalizedEmail = email.toLowerCase().trim();

            try {
                await apiClient.post(FORGOT_PASSWORD, { email: normalizedEmail });
                sessionStorage.setItem("resetEmail", normalizedEmail);
                toast.success("OTP sent to your email.");
                router.push("/Auth/ResetPassword/otp");
            } catch (error) {
                const apiError = error as AxiosError<ApiError>;
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
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111827] p-8">
                <h2 className="mb-2 text-center text-3xl font-extrabold text-white">Forgot Password</h2>
                <p className="mb-8 text-center text-gray-400">Enter your email to receive a one-time password.</p>
                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <Input
                        type="email"
                        name="email"
                        lable="Email address"
                        placeholder="Enter your email"
                        value={formik.values.email}
                        onChange={(value) => formik.setFieldValue("email", value.toLowerCase())}
                        onBlur={() => formik.setFieldTouched("email", true)}
                        error={formik.touched.email ? formik.errors.email : undefined}
                    />
                    <Button type="submit" text="Send OTP" ProcessText="Sending OTP..." isSubmitting={formik.isSubmitting} className="w-full" />
                </form>
            </div>
        </div>
    );
}
