"use client";

import { useState, useEffect } from "react";
import { Contest } from "@/types";
import { getLatestContest } from "@/lib/firestore";
import ResultBoard from "@/components/ResultBoard";

export default function ResultPage() {
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await getLatestContest();
        setContest(c);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">결과를 표시할 콘테스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
        <h1 className="text-7xl font-bold">한콘연 오늘의 Best Image Top30</h1>
        <p className="text-lg mt-2 mb-2">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
        <h2 className="text-xl font-bold mb-2">콘테스트 결과</h2>
        <p className="text-blue-200">{contest.date}</p>
        {contest.status !== "ended" && (
          <p className="mt-2 text-yellow-300 text-sm">
            아직 투표가 진행 중입니다. 최종 결과는 투표 종료 후 확정됩니다.
          </p>
        )}
      </div>
      <ResultBoard contestDate={contest.date} isEnded={contest.status === "ended"} />
    </div>
  );
}
