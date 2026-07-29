type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const normalizedStatus =
    status?.toUpperCase?.() ?? "";

  const statusClasses = {
    OPEN: "bg-[var(--brand-soft-lime)] text-[var(--brand-navy)] border-[rgba(157,255,0,0.75)]",
    LOCKED:
      "bg-[var(--brand-soft-orange)] text-[var(--brand-orange)] border-[rgba(255,106,0,0.45)]",
    COMPLETE:
      "bg-[var(--brand-soft-blue)] text-[var(--brand-blue)] border-[rgba(0,123,255,0.35)]",
    COMPLETED:
      "bg-[var(--brand-soft-blue)] text-[var(--brand-blue)] border-[rgba(0,123,255,0.35)]",
    VERIFIED:
      "bg-[var(--brand-soft-lime)] text-[var(--brand-navy)] border-[rgba(157,255,0,0.75)]",
    PAID:
      "bg-[var(--brand-soft-lime)] text-[var(--brand-navy)] border-[rgba(157,255,0,0.75)]",
    UNPAID:
      "bg-[var(--brand-soft-orange)] text-[var(--brand-orange)] border-[rgba(255,106,0,0.45)]",
  };

  const className =
    statusClasses[
      normalizedStatus as keyof typeof statusClasses
    ] ??
    "bg-white text-[var(--brand-navy)] border-[var(--brand-border)]";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${className}`}
    >
      {status}
    </span>
  );
}