"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contest } from "@/types";
import { getActiveContest, getLatestContest, updateContestStatus } from "@/lib/firestore";
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
      let c = await getActiveContest();
      if (!c) c = await getLatestContest();
      setContest(c);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero contest={contest} />
      {contest && contest.status === "active" && (
        <VoteTimer contest={contest} onTimeUp={handleTimeUp} />
      )}
      {contest ? (
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
