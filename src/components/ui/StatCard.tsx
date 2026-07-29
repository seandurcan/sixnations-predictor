import Card from "@/components/ui/Card";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  className = "",
}: StatCardProps) {
  return (
    <Card
      title={title}
      className={className}
    >
      <div className="space-y-2">
        <div className="text-4xl font-bold">
          {value}
        </div>

        {subtitle && (
          <div className="text-sm text-slate-500">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
}