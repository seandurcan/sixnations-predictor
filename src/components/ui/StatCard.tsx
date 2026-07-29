import Card from "@/components/ui/Card";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  tone?: "blue" | "lime" | "orange" | "navy";
};

export default function StatCard({
  title,
  value,
  subtitle,
  className = "",
  tone = "blue",
}: StatCardProps) {
  const toneClasses = {
    blue: "text-[var(--brand-blue)]",
    lime: "text-[var(--brand-navy)] bg-[var(--brand-soft-lime)]",
    orange: "text-[var(--brand-orange)]",
    navy: "text-[var(--brand-navy)]",
  };

  const valueClass =
    tone === "lime"
      ? "inline-flex rounded-lg px-3 py-1 text-4xl font-bold"
      : `text-4xl font-bold ${toneClasses[tone]}`;

  return (
    <Card
      title={title}
      className={className}
    >
      <div className="space-y-2">
        <div className={valueClass}>
          {value}
        </div>

        {subtitle && (
          <div className="text-sm text-[var(--brand-muted)]">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}