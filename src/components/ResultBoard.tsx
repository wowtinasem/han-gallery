"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ContestImage } from "@/types";
import { getContestImages } from "@/lib/firestore";

interface ResultBoardProps {
  contestDate: string;
  isEnded: boolean;
  winnerId?: string;
  secondPlaceId?: string;
  thirdPlaceId?: string;
}

export default function ResultBoard({ contestDate, isEnded, winnerId, secondPlaceId, thirdPlaceId }: ResultBoardProps) {
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

  // 투표 진행 중 또는 종료 후 미선정: 동일 메시지
  if (!isEnded || !winnerId) {
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

  // 투표 종료 + winnerId 있음: 1/2/3위 + 전체 갤러리
  const rankedIds = [winnerId, secondPlaceId, thirdPlaceId];
  const rankedImages = rankedIds
    .map((id) => (id ? images.find((img) => img.id === id) : undefined))
    .filter((img): img is ContestImage => !!img);
  const rest = images.filter((img) => !rankedIds.includes(img.id));

  const rankConfig = [
    { emoji: "\u{1F947}", label: "1위", ring: "ring-yellow-400", badge: "bg-yellow-400 text-yellow-900" },
    { emoji: "\u{1F948}", label: "2위", ring: "ring-gray-400", badge: "bg-gray-400 text-white" },
    { emoji: "\u{1F949}", label: "3위", ring: "ring-orange-400", badge: "bg-orange-400 text-white" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top 3 Podium */}
      <div className="mb-10">
        {/* 1위 - 크게 */}
        {rankedImages[0] && (
          <div className="mb-6">
            <div className="text-center mb-3">
              <span className={`inline-block px-4 py-1.5 ${rankConfig[0].badge} rounded-full text-sm font-bold`}>
                {"\u{1F451}"} BEST IMAGE
              </span>
            </div>
            <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ring-4 ${rankConfig[0].ring} max-w-lg mx-auto`}>
              <Image
                src={rankedImages[0].imageUrl}
                alt={rankedImages[0].nickname}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, 500px"
                className="w-full h-auto"
              />
              <div className="p-4 text-center">
                <p className="font-bold text-lg text-gray-800">
                  #{String(rankedImages[0].number).padStart(2, "0")} {rankedImages[0].nickname}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2위, 3위 - 나란히 */}
        {rankedImages.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {rankedImages.slice(1).map((img, idx) => {
              const cfg = rankConfig[idx + 1];
              return (
                <div key={img.id}>
                  <div className="text-center mb-2">
                    <span className={`inline-block px-3 py-1 ${cfg.badge} rounded-full text-xs font-bold`}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>
                  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ring-3 ${cfg.ring}`}>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
