type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div>
      <h1
        className="
          text-4xl
          font-bold
          text-[#012169]
        "
      >
        {title}
      </h1>

      {description && (
        <p
          className="
            mt-2
            text-slate-500
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}