import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`mx-auto max-w-6xl p-6 ${className}`.trim()}
    >
      {children}
    </main>
  );
}