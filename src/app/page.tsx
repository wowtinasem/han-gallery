"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contest } from "@/types";
import { getActiveContest, updateContestStatus } from "@/lib/firestore";
import Hero from "@/components/Hero";
import VoteTimer from "@/components/VoteTimer";
import ImageGallery from "@/components/ImageGallery";

export default function Home() {
  const router = useRouter();
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadContest = useCallback(async () => {
    try {
      const c = await getActiveContest();
      setContest(c && (c.status === "active" || c.status === "pending") ? c : null);
    } catch (error) {
      console.error("Failed to load contest:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  const handleTimeUp = useCallback(async () => {
    if (!contest) return;
    try {
      await updateContestStatus(contest.date, "ended");
      router.push("/result");
    } catch (error) {
      console.error("Failed to end contest:", error);
    }
  }, [contest, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero contest={contest} />
      {contest && contest.status === "active" && (
        <VoteTimer contest={contest} onTimeUp={handleTimeUp} />
      )}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-500">작품을 불러오는 중...</p>
        </div>
      ) : contest ? (
        <ImageGallery
          contestDate={contest.date}
          canVote={contest.status === "active"}
        />
      ) : (
        <div className="py-20 text-center text-gray-500">
          현재 진행 중인 콘테스트가 없습니다.
        </div>
      )}
    </div>
  );
}
