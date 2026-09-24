import { useEffect, useState } from "react";

type InputProps = {
    type?: string;
    name?: string;
    lable?: string;
    placeholder?: string;
    value?: string;
    inputType?: "input" | "textarea" | "Image";
    onChange?: (value: string) => void;
    onBlur?: (value: boolean) => void;
    error?: string;
    imagePreview?: string;
    imageFile?: File | null;
    handleImageChange?: (file: File | null) => void;
    style?: React.CSSProperties;
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
    handleImageChange,
    imagePreview: initialImagePreview,
}: InputProps) => {
    const [imagePreview, setImagePreview] = useState<string | null>(initialImagePreview || null);

    useEffect(() => {
        if (initialImagePreview !== undefined) {
            setImagePreview(initialImagePreview || null);
        }
    }, [initialImagePreview]);

    const handleImage = (e: File | null) => {
        if (e) {
            setImagePreview(URL.createObjectURL(e));
        } else {
            setImagePreview(initialImagePreview || null);
        }
        handleImageChange && handleImageChange(e);
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
                    onChange={(e) => onChange && onChange(e.target.value)}
                    onBlur={() => onBlur && onBlur(true)}
                    className={`w-full bg-gray-700 border ${error
                        ? "border-red-500"
                        : "border-gray-600"
                        } rounded-md p-2 text-white focus:outline-none focus:border-purple-500`}
                    placeholder={placeholder}
                ></textarea>
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
                <label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-600 bg-gray-900/40 p-4 text-center transition-all hover:border-purple-500 hover:bg-gray-900/70">
                    {imagePreview ? (
                        <div className="flex w-full flex-col items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Cover preview"
                                className="h-48 w-full max-w-3xl rounded-xl object-cover shadow-lg"
                            />
                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                                    Click to replace the image
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
                                    <path d="M12 16V4" />
                                    <path d="m8 8 4-4 4 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Drop or click to upload</p>
                                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5 MB</p>
                            </div>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => handleImage(e.target.files ? e.target.files[0] : null)}
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
                onChange={(e) => onChange && onChange(e.target.value)}
                onBlur={() => onBlur && onBlur(true)}
                className={`w-full bg-gray-700 border ${error
                    ? "border-red-500"
                    : "border-gray-600"
                    } rounded-md p-2 text-white focus:outline-none focus:border-purple-500 ${style || ""}`}
            />
            {error && (
                <p className="text-red-500 text-xs mt-1">{error as string}</p>
            )}
        </div>
    );
};

export default Input;