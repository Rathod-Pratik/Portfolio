"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { Input, Button, Loading } from "@components";
import { LOGIN } from "@api";
import apiClient from "@apiClient";
import type { AxiosError } from "axios";

type LoginFormValues = {
    email: string;
    password: string;
};

const initialValues: LoginFormValues = {
    email: "",
    password: "",
};

const validationSchema = yup.object({
    email: yup
        .string()
        .trim()
        .email("Please enter a valid email address.")
        .required("Email is required."),

    password: yup
        .string()
        .required("Password is required.")
        .min(1, "Password is required."),
});

const Login = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik<LoginFormValues>({
        initialValues,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const response = await apiClient.post(
                    LOGIN,
                    {
                        email: values.email.toLowerCase().trim(),
                        password: values.password,
                    },
                    {
                        withCredentials: true,
                    }
                );

                if (response.status === 200) {
                    const { token, user } = response.data;

                    if (!token || !user) {
                        throw new Error("The login response was incomplete.");
                    }

                    sessionStorage.setItem("token", token);
                    sessionStorage.setItem("user", JSON.stringify(user));
                    document.cookie = [
                        `admin=${encodeURIComponent(token)}`,
                        "path=/",
                        "max-age=86400",
                        window.location.protocol === "https:" ? "secure" : "",
                        "samesite=lax",
                    ]
                        .filter(Boolean)
                        .join("; ");
                    toast.success("Login successful");
                    router.replace("/Dashboard");
                }
            } catch (error) {
                const apiError = error as AxiosError<{ error?: string }>;

                toast.error(
                    apiError.response?.data?.error || "Some error occurred"
                );

                console.error("Login Error:", apiError);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-2 sm:px-6 lg:px-8">
            <div className="relative shadow-xl rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col lg:flex-row bg-[#111827] border border-gray-800">
                {formik.isSubmitting && (
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center bg-[#111827]/80"
                        aria-live="polite"
                        aria-label="Signing in"
                    >
                        <Loading className="min-h-0" />
                    </div>
                )}

                <div className="lg:w-1/2 hidden md:flex items-center justify-center p-6 sm:p-12">
                    <div className="text-center text-white">
                        <img
                            src="/Image/Login_image.png"
                            alt="Welcome illustration"
                            className="max-w-full h-auto mx-auto mb-8 rounded-lg shadow-lg"
                        />

                        <h3 className="text-2xl font-bold mb-2">
                            Welcome Back!
                        </h3>

                        <p className="opacity-90">
                            Sign in to access your account
                        </p>
                    </div>
                </div>

                <div className="lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-white">
                            Login now
                        </h2>
                    </div>

                    <form
                        onSubmit={formik.handleSubmit}
                        className="space-y-6"
                    >
                        <Input
                            type="email"
                            name="email"
                            lable="Email address"
                            placeholder="Enter your email"
                            value={formik.values.email}
                            inputType="input"
                            onChange={(value) =>
                                formik.setFieldValue("email", value.toLowerCase())
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

                        <div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    lable="Password"
                                    placeholder="••••••••"
                                    value={formik.values.password}
                                    inputType="input"
                                    onChange={(value) =>
                                        formik.setFieldValue("password", value)
                                    }
                                    onBlur={() =>
                                        formik.setFieldTouched("password", true)
                                    }
                                    error={
                                        formik.touched.password
                                            ? formik.errors.password
                                            : undefined
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((value) => !value)
                                    }
                                    className="absolute right-3 top-[38px] flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>

                            <div className="mt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push("/forgot-password")
                                    }
                                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            text="Sign in"
                            ProcessText="Signing in..."
                            varient="primary"
                            isSubmitting={formik.isSubmitting}
                            className="w-full"
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;