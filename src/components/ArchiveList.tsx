"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import { getContestList, getContestImagesRanked } from "@/lib/firestore";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ArchiveEntry {
  contest: Contest & { id: string };
  top3: ContestImage[];
}

export default function ArchiveList() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getContestList();
        const ended = list.filter((c) => c.status === "ended");

        const entriesWithTop3 = await Promise.all(
          ended.map(async (contest) => {
            const ranked = await getContestImagesRanked(contest.date);
            return { contest, top3: ranked.slice(0, 3) };
          })
        );

        setEntries(entriesWithTop3);
      } catch (error) {
        console.error("Failed to load archive:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        아카이브를 불러오는 중...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        아직 완료된 콘테스트가 없습니다.
      </div>
    );
  }

  const trophyEmoji = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-6">
        지난 콘테스트
      </h2>
      <div className="space-y-6">
        {entries.map(({ contest, top3 }) => (
          <Link
            key={contest.id}
            href={`/archive/${contest.date}`}
            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Top 3 미리보기 */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-px bg-gray-100">
                {top3.map((image, idx) => (
                  <div key={image.id} className="relative aspect-square">
                    <Image
                      src={image.imageUrl}
                      alt={image.nickname}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 250px"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                      {trophyEmoji[idx]} {idx + 1}등
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {image.nickname} · {image.voteCount}표
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 날짜 정보 */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1B3A5C]">
                  {format(new Date(contest.date), "yyyy년 M월 d일 (EEEE)", {
                    locale: ko,
                  })}
                </p>
                <p className="text-sm text-gray-500">{contest.date}</p>
              </div>
              <span className="text-[#2E75B6] font-medium text-sm">
                전체 결과 보기 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
