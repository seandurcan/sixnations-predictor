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
        "bg-[var(--brand-soft-blue)] border-[rgba(0,123,255,0.35)] text-[var(--brand-navy)]",
      title:
        "text-[var(--brand-blue)]",
    },
    success: {
      container:
        "bg-[var(--brand-soft-lime)] border-[rgba(157,255,0,0.75)] text-[var(--brand-navy)]",
      title:
        "text-[var(--brand-navy)]",
    },
    warning: {
      container:
        "bg-[var(--brand-soft-orange)] border-[rgba(255,106,0,0.45)] text-[var(--brand-navy)]",
      title:
        "text-[var(--brand-orange)]",
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