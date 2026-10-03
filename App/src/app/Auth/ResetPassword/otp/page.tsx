"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { VERIFY_OTP } from "@api";
import apiClient from "@apiClient";
import { Button, Input } from "@components";

type ApiError = { error?: string; message?: string };

export default function VerifyResetOtp() {
    const router = useRouter();
    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const verify = async (event: React.FormEvent) => {
        event.preventDefault();
        const email = sessionStorage.getItem("resetEmail") || "";
        if (!/^\d{6}$/.test(otp)) {
            toast.error("OTP must be a 6-digit number.");
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post(VERIFY_OTP, { email, otp });
            toast.success("OTP verified successfully.");
            router.push("/Auth/ResetPassword/new");
        } catch (error) {
            const apiError = error as AxiosError<ApiError>;
            toast.error(apiError.response?.data?.error || apiError.response?.data?.message || "Failed to verify OTP.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <form onSubmit={verify} className="w-full max-w-md space-y-6 rounded-2xl border border-gray-800 bg-[#111827] p-8">
                <h2 className="text-center text-3xl font-extrabold text-white">Verify OTP</h2>
                <Input type="text" name="otp" lable="6-digit OTP" placeholder="Enter OTP" value={otp} onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} />
                <Button type="submit" text="Verify OTP" ProcessText="Verifying..." isSubmitting={submitting} className="w-full" />
            </form>
        </div>
    );
}
