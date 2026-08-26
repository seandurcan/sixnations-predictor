import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  id?: string;
};

export default function Card({
  children,
  title,
  className = "",
  id,
}: CardProps) {
  return (
    <div
      id={id}
      className={`bg-white border border-[var(--brand-border)] rounded-xl shadow-sm p-6 transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {title && (
        <h2 className="text-xl font-bold mb-4 text-[var(--brand-navy)]">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}
