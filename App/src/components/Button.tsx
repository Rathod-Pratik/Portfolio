import React from "react";
import { IconType } from "react-icons";

type ButtonProps = {
  text: string;
  ProcessText?: string;
  title?: string;
  varient?: "primary" | "secondary" | "danger";
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  Icon?: IconType;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;

};

const Button: React.FC<ButtonProps> = ({
  text,
  varient = "primary",
  onClick,
  Icon,
  title,
  isSubmitting,
  isDisabled,
  ProcessText,
  type = "button",
  className = "",
}) => {
  const disabled = isDisabled || isSubmitting;

  if (varient === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`font-medium py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          isSubmitting
            ? "bg-purple-400 text-gray-100 cursor-not-allowed opacity-70"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        } ${className}`}
      >
        {Icon && <Icon size={16} />}
        <span>{ProcessText ? (isSubmitting ? ProcessText : text) : text}</span>
      </button>
    );
  }

  if (varient === "secondary") {
    return (
      <button
        type={type}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`font-medium py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          isSubmitting
            ? "bg-blue-600 text-blue-100 cursor-not-allowed opacity-70"
            : "bg-blue-500 hover:bg-blue-700 text-gray-200 hover:text-white"
        } ${className}`}
      >
        {Icon && <Icon size={16} />}
        <span>{ProcessText ? (isSubmitting ? ProcessText : text) : text}</span>
      </button>
    );
  }

  if (varient === "danger") {
    return (
      <button
        type={type}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`font-medium py-2 px-5 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          isSubmitting
            ? "bg-red-400 text-gray-100 cursor-not-allowed opacity-70"
            : "bg-red-600 hover:bg-red-700 text-white"
        } ${className}`}
      >
        {Icon && <Icon size={16} />}
        <span>{ProcessText ? (isSubmitting ? ProcessText : text) : text}</span>
      </button>
    );
  }

  return (
    <a
      href="mailto:rathodpratik1928@gmail.com"
      className="inline-block bg-[#fca61f] text-white px-6 py-3 text-lg font-medium rounded-full shadow-lg transition-all duration-300 hover:bg-purple-700 hover:scale-105"
    >
      {text}
    </a>
  );
};

export default Button;
