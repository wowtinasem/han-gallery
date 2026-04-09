"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ContestImage } from "@/types";
import { getContestImagesRanked, getContestImages } from "@/lib/firestore";

interface ResultBoardProps {
  contestDate: string;
  isEnded: boolean;
}

const trophyConfig: Record<number, { emoji: string; color: string }> = {
  0: { emoji: "🥇", color: "from-yellow-400 to-yellow-600" },
  1: { emoji: "🥈", color: "from-gray-300 to-gray-500" },
  2: { emoji: "🥉", color: "from-orange-400 to-orange-600" },
};

export default function ResultBoard({ contestDate, isEnded }: ResultBoardProps) {
  const [images, setImages] = useState<ContestImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const imgs = isEnded
          ? await getContestImagesRanked(contestDate)
          : await getContestImages(contestDate);
        setImages(imgs);
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

  if (images.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">결과가 없습니다.</div>
    );
  }

  // 투표 종료 전: 순위 없이 동일한 그리드로 표시
  if (!isEnded) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 text-center">
          <p className="text-yellow-800 font-semibold">
            투표가 진행 중입니다. 최종 순위는 투표 종료 후 공개됩니다.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="relative aspect-square">
                <Image
                  src={image.imageUrl}
                  alt={image.nickname}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                  #{String(image.number).padStart(2, "0")}
                </div>
              </div>
              <div className="p-3 text-center">
                <p className="font-medium text-gray-800 text-sm truncate">
                  {image.nickname}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 투표 종료 후: 순위 표시
  const top3 = images.slice(0, 3);
  const rest = images.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {top3.map((image, idx) => {
          const trophy = trophyConfig[idx];
          return (
            <div
              key={image.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                idx === 0 ? "md:scale-105 ring-2 ring-yellow-400" : ""
              }`}
            >
              <div
                className={`bg-gradient-to-r ${trophy.color} text-white text-center py-2 text-lg font-bold`}
              >
                {trophy.emoji} {idx + 1}등
              </div>
              <div className="relative aspect-square">
                <Image
                  src={image.imageUrl}
                  alt={image.nickname}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4 text-center">
                <p className="font-bold text-gray-800">
                  #{String(image.number).padStart(2, "0")} {image.nickname}
                </p>
                <p className="text-[#2E75B6] font-bold text-xl mt-1">
                  {image.voteCount}표
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  순위
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  작품
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  닉네임
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  투표수
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rest.map((image, idx) => (
                <tr key={image.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    {idx + 4}등
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
                        <Image
                          src={image.imageUrl}
                          alt={image.nickname}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        #{String(image.number).padStart(2, "0")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {image.nickname}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-[#2E75B6]">
                    {image.voteCount}표
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
