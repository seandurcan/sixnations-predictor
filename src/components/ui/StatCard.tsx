type StatCardProps = {
  label: string;
  value: string | number;
};

export default function StatCard({
  label,
  value,
}: StatCardProps) {
  return (
    <div
      className="
        bg-white
        rounded-xl
        border
        border-slate-200
        shadow-sm
        p-6
      "
    >
      <div
        className="
          text-sm
          font-medium
          text-slate-500
        "
      >
        {label}
      </div>

      <div
        className="
          mt-3
          text-4xl
          font-bold
          text-[#012169]
        "
      >
        {value}
      </div>
    </div>
  );
}