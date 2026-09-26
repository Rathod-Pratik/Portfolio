import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";
import { Input, Button, Loading } from "@components";
import { LOGIN } from "@api";
import apiClient from "@apiClient";
import type { AxiosError } from "axios";

type LoginFormValues = {
    email: string;
    password: string;
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
        .min(6, "Password must be at least 6 characters."),
});

const Login = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const formik = useFormik<LoginFormValues>({
        initialValues: {
            email: "",
            password: "",
        },
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
                    toast.success("Login successful");
                    router.push("/Dashboard");
                }
            } catch (error) {
                const apiError = error as AxiosError<{ error?: string }>;

                toast.error(
                    apiError.response?.data?.error ||
                    "Invalid email or password."
                );
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center px-2 sm:px-6 lg:px-8">
            <div className="relative shadow-xl rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col lg:flex-row bg-[#111827] border border-gray-800">
                {formik.isSubmitting && <Loading />}

                <div className="lg:w-1/2 hidden md:flex items-center justify-center p-6 sm:p-12">
                    <div className="text-center text-white">
                        <img
                            src="/Login_image.png"
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

                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                lable="Password"
                                placeholder="Enter your password"
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
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-200"
                            >
                                {showPassword ? (
                                    <FaEyeSlash size={18} />
                                ) : (
                                    <FaEye size={18} />
                                )}
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push("/forgot-password")
                                }
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                Forgot password?
                            </button>
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