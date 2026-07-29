import {
  InputHTMLAttributes,
} from "react";

type InputProps =
  InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--brand-border)] bg-white px-4 py-2 text-[var(--brand-navy)] placeholder:text-[rgba(10,31,77,0.45)] outline-none transition-colors duration-200 focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[rgba(0,123,255,0.18)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${className}`}
      {...props}
    />
  );
}