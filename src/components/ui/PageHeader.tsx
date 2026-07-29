type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`mb-8 animate-[fadeInUp_0.35s_ease-out] ${className}`}
    >
      <h1 className="text-4xl font-bold text-slate-900 transition-all duration-200 ease-out hover:translate-x-1">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-slate-500 transition-all duration-200 ease-out hover:text-slate-700">
          {subtitle}
        </p>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}