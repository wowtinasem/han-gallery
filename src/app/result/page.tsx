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
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2E75B6] text-white py-10 text-center">
        <h1 className="text-3xl font-bold mb-2">콘테스트 결과</h1>
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
