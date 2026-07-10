"use client";

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-bwise-superficie border border-bwise-borda rounded-xl px-4 py-3.5">
      <p className="text-xs font-semibold text-bwise-texto-sec uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-bwise-texto">{value}</p>
    </div>
  );
}

export default function MetricsRow({ metrics }: { metrics: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {metrics.map((m) => (
        <MetricCard key={m.label} label={m.label} value={m.value} />
      ))}
    </div>
  );
}
