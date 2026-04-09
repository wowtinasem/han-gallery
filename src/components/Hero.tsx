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
    <div className="relative bg-gradient-to-br from-[#1B3A5C] via-[#2E75B6] to-[#4A90D9] text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">
          한콘연 AI이미지 콘테스트
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-6">
          마음에 드는 작품에 투표해주세요!
        </p>
        {contest && <StatusBadge status={contest.status} />}
        {contest && (
          <p className="mt-3 text-blue-200 text-sm">
            {contest.date}
          </p>
        )}
      </div>
    </div>
  );
}
