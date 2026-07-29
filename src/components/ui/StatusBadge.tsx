type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalizedStatus =
    status.toUpperCase();

  const statusClasses = {
    OPEN: "bg-green-100 text-green-700",
    LOCKED:
      "bg-amber-100 text-amber-700",
    COMPLETE:
      "bg-blue-100 text-blue-700",
    VERIFIED:
      "bg-green-100 text-green-700",
    PAID: "bg-green-100 text-green-700",
    UNPAID:
      "bg-red-100 text-red-700",
  };

  const className =
    statusClasses[
      normalizedStatus as keyof typeof statusClasses
    ] ??
    "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${className}`}
    >
      {status}
    </span>
  );
}