"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { RESET_PASSWORD } from "@api";
import apiClient from "@apiClient";
import { Button, Input } from "@components";

type ApiError = { error?: string; message?: string };

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = async (event: React.FormEvent) => {
        event.preventDefault();
        const email = sessionStorage.getItem("resetEmail") || "";
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post(RESET_PASSWORD, { email, password });
            sessionStorage.removeItem("resetEmail");
            toast.success("Password reset successfully.");
            router.push("/Auth/Login");
        } catch (error) {
            const apiError = error as AxiosError<ApiError>;
            toast.error(apiError.response?.data?.error || apiError.response?.data?.message || "Failed to reset password.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <form onSubmit={reset} className="w-full max-w-md space-y-6 rounded-2xl border border-gray-800 bg-[#111827] p-8">
                <h2 className="text-center text-3xl font-extrabold text-white">Reset Password</h2>
                <Input type="password" name="password" lable="New password" value={password} onChange={setPassword} />
                <Input type="password" name="confirmPassword" lable="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
                <Button type="submit" text="Reset Password" ProcessText="Resetting..." isSubmitting={submitting} className="w-full" />
            </form>
        </div>
    );
}
