type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  let styles =
    "bg-blue-100 text-blue-700";

  if (status === "OPEN") {
    styles =
      "bg-green-100 text-green-700";
  }

  if (status === "LOCKED") {
    styles =
      "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`
        inline-flex
        px-3
        py-1
        rounded-full
        text-sm
        font-semibold
        ${styles}
      `}
    >
      {status}
    </span>
  );
}