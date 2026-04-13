"use client";

import Image from "next/image";
import { ContestImage } from "@/types";

interface ImageCardProps {
  image: ContestImage;
  isVoted: boolean;
  canVote: boolean;
  onVote: (imageId: string) => void;
}

export default function ImageCard({
  image,
  isVoted,
  canVote,
  onVote,
}: ImageCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
        isVoted ? "ring-3 ring-[#2E75B6]" : ""
      }`}
    >
      <div className="relative">
        <Image
          src={image.imageUrl}
          alt={`${image.nickname}의 작품`}
          width={0}
          height={0}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
          className="w-full h-auto"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
          #{String(image.number).padStart(2, "0")}
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-800 text-sm truncate mb-2">
          {image.nickname}
        </p>
        {canVote || isVoted ? (
          isVoted ? (
            <div className="w-full py-2 rounded-lg bg-[#2E75B6] text-white text-center text-sm font-semibold">
              ✓ 투표함
            </div>
          ) : (
            <button
              onClick={() => image.id && onVote(image.id)}
              disabled={!canVote}
              className="w-full py-2 rounded-lg bg-[#2E75B6] text-white text-sm font-semibold hover:bg-[#1B3A5C] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              투표하기
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
