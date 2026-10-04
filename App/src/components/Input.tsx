"use client";

import { useEffect, useState } from "react";

type InputProps = {
    type?: string;
    name?: string;
    lable?: string;
    placeholder?: string;
    value?: string;
    inputType?: "input" | "textarea" | "Image" | "PDF";
    onChange?: (value: string) => void;
    onBlur?: (value: boolean) => void;
    error?: string;
    imagePreview?: string;
    imageFile?: File | null;
    handleImageChange?: (file: File | null) => void;
    pdfFile?: File | null;
    pdfName?: string;
    handlePdfChange?: (file: File | null) => void;
    style?: string;
    className?: string;
    textColor?: string;
};

const Input = ({
    lable,
    type = "text",
    name,
    placeholder,
    value,
    onChange,
    error,
    inputType = "input",
    onBlur,
    style,
    textColor,
    handleImageChange,
    imagePreview: initialImagePreview,
    pdfFile,
    pdfName,
    className,
    handlePdfChange,
}: InputProps) => {
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialImagePreview || null
    );

    useEffect(() => {
        if (initialImagePreview !== undefined) {
            setImagePreview(initialImagePreview || null);
        }
    }, [initialImagePreview]);

    const handleImage = (file: File | null) => {
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(initialImagePreview || null);
        }

        handleImageChange?.(file);
    };

    if (inputType === "textarea") {
        return (
            <div>
                {lable && (
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        {lable}
                    </label>
                )}

                <textarea
                    name={name}
                    rows={4}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    onBlur={() => onBlur?.(true)}
                    className={`w-full bg-gray-700 border ${error ? "border-red-500" : "border-gray-600"
                        } rounded-md p-2 text-white focus:outline-none focus:border-purple-500 ${className}`}
                    placeholder={placeholder}
                />

                {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
            </div>
        );
    }

    if (inputType === "Image") {
        return (
            <div className="w-full">
                {lable && (
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {lable}
                    </label>
                )}

                <label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900/40 p-4 text-center hover:border-purple-500">
                    {imagePreview ? (
                        <div className="flex w-full flex-col items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Cover preview"
                                className="h-48 w-full max-w-3xl rounded-xl object-cover"
                            />

                            <p className="text-xs text-gray-400">
                                Click to replace the image
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <p className="text-sm font-medium text-white">
                                Drop or click to upload
                            </p>

                            <p className="text-xs text-gray-400">
                                PNG, JPG, WEBP up to 5 MB
                            </p>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) =>
                            handleImage(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                    />
                </label>

                {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
            </div>
        );
    }

    if (inputType === "PDF") {
        return (
            <div className="w-full">
                {lable && (
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {lable}
                    </label>
                )}

                <label className="flex items-center justify-between gap-3 rounded-md border border-gray-600 bg-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-600">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-red-400 text-xl">PDF</span>

                        <span className="text-gray-300 truncate">
                            {pdfFile?.name || pdfName || "Choose PDF file"}
                        </span>
                    </div>

                    <span className="text-sm text-purple-400">
                        Choose
                    </span>

                    <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) =>
                            handlePdfChange?.(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                    />
                </label>

                {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div>
            {(lable || name) && (
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    {lable || name}
                </label>
            )}

            <input
                type={type}
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value)}
                onBlur={() => onBlur?.(true)}
                className={`w-full bg-gray-700 border ${error ? "border-red-500" : "border-gray-600"
                    } rounded-md p-2 ${textColor || "text-white"} focus:outline-none focus:border-purple-500 ${style || ""
                    }`}
            />

            {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

export default Input;