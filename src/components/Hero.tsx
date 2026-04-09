"use client";

import { Contest } from "@/types";

interface HeroProps {
  contest: (Contest & { id: string }) | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: "투표 진행중",
      className: "bg-green-500 animate-pulse",
    },
    ended: {
      label: "투표 종료",
      className: "bg-red-500",
    },
    pending: {
      label: "준비중",
      className: "bg-yellow-500",
    },
  };
  const { label, className } = config[status] || config.pending;

  return (
    <span
      className={`inline-block px-4 py-1.5 rounded-full text-white text-sm font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export default function Hero({ contest }: HeroProps) {
  return (
    <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
      <h1 className="text-7xl font-bold">한콘연 오늘의 Best Image Top30</h1>
      <p className="text-lg mt-2 mb-2">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
      {contest && (
        <>
          <StatusBadge status={contest.status} />
          <p className="mt-1 text-blue-200 text-xs">{contest.date}</p>
        </>
      )}
    </div>
  );
}
