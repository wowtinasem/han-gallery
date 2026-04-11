"use client";

import { Contest } from "@/types";

interface HeroProps {
  contest: (Contest & { id: string }) | null;
}

function formatTime(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
      label: "투표 예정",
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
      <h1 className="text-2xl sm:text-5xl font-bold text-center px-4">한콘연 오늘의 Best Image Top30</h1>
      <p className="text-xs sm:text-lg mt-2 mb-2 text-center px-4">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
      {contest && (
        <>
          <StatusBadge status={contest.status} />
          <p className="mt-1 text-blue-200 text-xs">{contest.date}</p>
          {contest.status === "pending" && contest.startTime && contest.endTime && (
            <div className="mt-3 text-center">
              <p className="text-blue-200 text-xs">
                투표 시작: <span className="text-white font-semibold">{formatTime(contest.startTime.toDate())}</span>
              </p>
              <p className="text-blue-200 text-xs mt-1">
                투표 종료: <span className="text-white font-semibold">{formatTime(contest.endTime.toDate())}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
