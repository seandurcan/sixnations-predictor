import {
  SelectHTMLAttributes,
} from "react";

type SelectProps =
  SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={`w-full rounded-lg border border-[var(--brand-border)] bg-white px-4 py-2 text-[var(--brand-navy)] outline-none transition-colors duration-200 focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[rgba(0,123,255,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}