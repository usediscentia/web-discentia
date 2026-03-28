"use client";

interface StatCardProps {
  props: {
    label: string;
    value: string;
    sublabel?: string;
  };
}

export function StatCard({ props }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 inline-block min-w-[140px]">
      <p className="text-xs text-gray-400">{props.label}</p>
      <p className="text-2xl font-medium text-gray-900 mt-0.5">{props.value}</p>
      {props.sublabel && (
        <p className="text-xs text-gray-400 mt-1">{props.sublabel}</p>
      )}
    </div>
  );
}
