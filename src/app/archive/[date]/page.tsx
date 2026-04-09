"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Contest } from "@/types";
import { getContest } from "@/lib/firestore";
import ResultBoard from "@/components/ResultBoard";
import ImageGallery from "@/components/ImageGallery";

export default function ArchiveDetailPage() {
  const params = useParams();
  const date = params.date as string;
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await getContest(date);
        setContest(c);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (date) load();
  }, [date]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">해당 날짜의 콘테스트를 찾을 수 없습니다.</p>
        <Link href="/archive" className="text-[#2E75B6] hover:underline">
          ← 아카이브로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2E75B6] text-white py-10 text-center">
        <Link
          href="/archive"
          className="text-blue-200 hover:text-white text-sm mb-2 inline-block"
        >
          ← 아카이브
        </Link>
        <h1 className="text-3xl font-bold mb-2">{date} 콘테스트</h1>
        <p className="text-blue-200">최종 결과</p>
      </div>
      <ResultBoard contestDate={date} isEnded={contest.status === "ended"} />
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">
            전체 작품
          </h2>
        </div>
        <ImageGallery contestDate={date} canVote={false} />
      </div>
    </div>
  );
}
