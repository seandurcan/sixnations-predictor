import { ReactNode } from "react";

type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "error";

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  className?: string;
};

export default function Alert({
  children,
  variant = "info",
  title,
  className = "",
}: AlertProps) {
  const variants = {
    info: {
      container:
        "bg-blue-50 border-blue-200 text-blue-800",
      title:
        "text-blue-900",
    },
    success: {
      container:
        "bg-green-50 border-green-200 text-green-800",
      title:
        "text-green-900",
    },
    warning: {
      container:
        "bg-amber-50 border-amber-200 text-amber-800",
      title:
        "text-amber-900",
    },
    error: {
      container:
        "bg-red-50 border-red-200 text-red-800",
      title:
        "text-red-900",
    },
  };

  return (
    <div
      className={`border rounded-lg p-4 ${variants[variant].container} ${className}`}
    >
      {title && (
        <div
          className={`font-semibold mb-2 ${variants[variant].title}`}
        >
          {title}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}