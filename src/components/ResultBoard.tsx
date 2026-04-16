"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ContestImage } from "@/types";
import { getContestImages } from "@/lib/firestore";

interface ResultBoardProps {
  contestDate: string;
  isEnded: boolean;
}

interface RankedImage extends ContestImage {
  rank: number;
}

function computeRankings(images: ContestImage[]): RankedImage[] {
  const sorted = [...images].sort((a, b) => b.voteCount - a.voteCount);
  const result: RankedImage[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].voteCount < sorted[i - 1].voteCount) {
      currentRank = i + 1; // 공동순위 후 다음 순위는 건너뜀 (1,1,3 방식)
    }
    result.push({ ...sorted[i], rank: currentRank });
  }
  return result;
}

export default function ResultBoard({ contestDate, isEnded }: ResultBoardProps) {
  const [images, setImages] = useState<ContestImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (isEnded) {
          const imgs = await getContestImages(contestDate);
          setImages(imgs);
        }
      } catch (error) {
        console.error("Failed to load results:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contestDate, isEnded]);

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">결과를 불러오는 중...</div>
    );
  }

  if (!isEnded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="text-6xl mb-6">{"\u{1F3C6}"}</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C] mb-4">
            최종 결과는 잠시 후에 발표 됩니다.
          </h2>
        </div>
      </div>
    );
  }

  const ranked = computeRankings(images);
  const top1 = ranked.filter((img) => img.rank === 1);
  const top2 = ranked.filter((img) => img.rank === 2);
  const top3 = ranked.filter((img) => img.rank === 3);
  const rest = ranked.filter((img) => img.rank > 3);

  const totalVotes = images.reduce((sum, img) => sum + img.voteCount, 0);
  const getPct = (count: number) =>
    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

  const rankConfig: Record<number, { emoji: string; label: string; ring: string; badge: string }> = {
    1: { emoji: "\u{1F947}", label: "1위", ring: "ring-yellow-400", badge: "bg-yellow-400 text-yellow-900" },
    2: { emoji: "\u{1F948}", label: "2위", ring: "ring-gray-400", badge: "bg-gray-400 text-white" },
    3: { emoji: "\u{1F949}", label: "3위", ring: "ring-orange-400", badge: "bg-orange-400 text-white" },
  };

  const renderRankGroup = (group: RankedImage[], size: "large" | "medium") => {
    if (group.length === 0) return null;
    const cfg = rankConfig[group[0].rank];
    if (!cfg) return null;

    if (size === "large") {
      return (
        <div className="mb-6">
          <div className="text-center mb-3">
            <span className={`inline-block px-4 py-1.5 ${cfg.badge} rounded-full text-sm font-bold`}>
              {group[0].rank === 1 ? "\u{1F451} BEST IMAGE" : `${cfg.emoji} ${cfg.label}`}
              {group.length > 1 && ` (공동 ${cfg.label})`}
            </span>
          </div>
          <div className={`grid ${group.length === 1 ? "max-w-lg mx-auto" : "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"} gap-4`}>
            {group.map((img) => (
              <div key={img.id} className={`bg-white rounded-2xl shadow-xl overflow-hidden ring-4 ${cfg.ring}`}>
                <Image
                  src={img.imageUrl}
                  alt={img.nickname}
                  width={0}
                  height={0}
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="w-full h-auto"
                />
                <div className="p-4 text-center">
                  <p className="font-bold text-lg text-gray-800">
                    #{String(img.number).padStart(2, "0")} {img.nickname}
                  </p>
                  <p className="text-sm text-orange-500 font-semibold mt-1">{getPct(img.voteCount)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // medium size (2위, 3위)
    return (
      <div className="mb-6">
        <div className="text-center mb-2">
          <span className={`inline-block px-3 py-1 ${cfg.badge} rounded-full text-xs font-bold`}>
            {cfg.emoji} {cfg.label}{group.length > 1 ? ` (공동)` : ""}
          </span>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto`}>
          {group.map((img) => (
            <div key={img.id} className={`bg-white rounded-xl shadow-lg overflow-hidden ring-3 ${cfg.ring}`}>
              <Image
                src={img.imageUrl}
                alt={img.nickname}
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, 300px"
                className="w-full h-auto"
              />
              <div className="p-3 text-center">
                <p className="font-bold text-sm text-gray-800">
                  #{String(img.number).padStart(2, "0")} {img.nickname}
                </p>
                <p className="text-xs text-orange-500 font-semibold mt-1">{getPct(img.voteCount)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top 3 Podium */}
      <div className="mb-10">
        {renderRankGroup(top1, "large")}
        {renderRankGroup(top2, "medium")}
        {renderRankGroup(top3, "medium")}
      </div>

      {/* 전체 작품 갤러리 */}
      {rest.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-gray-500 mb-4 text-center">
            전체 작품 ({images.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rest.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <Image
                  src={image.imageUrl}
                  alt={image.nickname}
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  className="w-full h-auto"
                />
                <div className="p-3 text-center">
                  <p className="font-medium text-sm text-gray-800 truncate">
                    #{String(image.number).padStart(2, "0")} {image.nickname}
                  </p>
                  <p className="text-xs text-gray-400">{getPct(image.voteCount)}%</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
