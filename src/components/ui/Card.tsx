import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  title?: string;
  className?: string;
};

export default function Card({
  children,
  title,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {title && (
        <h2 className="text-xl font-bold mb-4">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}
