import {
  SelectHTMLAttributes,
  ReactNode,
} from "react";

type SelectProps =
  SelectHTMLAttributes<HTMLSelectElement> & {
    children: ReactNode;
  };

export default function Select({
  children,
  className = "",
  ...props
}: SelectProps) {
  return (
    <select
      className={`border p-2 rounded bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}