import {
  ButtonHTMLAttributes,
  forwardRef,
  ReactNode,
} from "react";

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: "primary" | "secondary";
    fullWidth?: boolean;
  };

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
    ...props
  },
  ref
) {
  const baseClasses =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses =
    variant === "primary"
      ? "bg-[var(--brand-blue)] text-white hover:bg-[var(--brand-blue-bright)] focus:ring-[var(--brand-blue)]"
      : "bg-white text-[var(--brand-navy)] border border-[var(--brand-border)] hover:bg-[var(--brand-soft-lime)] focus:ring-[var(--brand-blue)]";

  const widthClass = fullWidth
    ? "w-full"
    : "";

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
