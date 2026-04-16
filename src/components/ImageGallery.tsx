"use client";

import { useState, useEffect, useCallback } from "react";
import { ContestImage } from "@/types";
import { getContestImages, castVote, getUserVoteIds } from "@/lib/firestore";
import { getFingerprint } from "@/lib/fingerprint";
import ImageCard from "./ImageCard";

const MAX_VOTES = 3;

interface ImageGalleryProps {
  contestDate: string;
  canVote: boolean;
}

export default function ImageGallery({
  contestDate,
  canVote,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ContestImage[]>([]);
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const imgs = await getContestImages(contestDate);
      setImages(imgs);

      const fp = await getFingerprint();
      const ids = await getUserVoteIds(contestDate, fp);
      setVotedIds(ids);
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoading(false);
    }
  }, [contestDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = async (imageId: string) => {
    if (voting || votedIds.length >= MAX_VOTES || votedIds.includes(imageId)) return;
    const target = images.find((img) => img.id === imageId);
    const remaining = MAX_VOTES - votedIds.length;
    if (!confirm(`#${String(target?.number || 0).padStart(2, "0")} ${target?.nickname || ""} 작품에 투표하시겠습니까?\n\n남은 투표: ${remaining}/${MAX_VOTES}`)) return;
    setVoting(true);

    try {
      const fp = await getFingerprint();
      const result = await castVote(contestDate, fp, imageId);

      if (result.success) {
        const newVotedIds = [...votedIds, imageId];
        setVotedIds(newVotedIds);
        const imgs = await getContestImages(contestDate);
        setImages(imgs);
      } else {
        alert(result.reason || "투표에 실패했습니다.");
      }
    } catch (error) {
      console.error("Vote error:", error);
      alert("투표 중 오류가 발생했습니다.");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        이미지를 불러오는 중...
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        등록된 이미지가 없습니다.
      </div>
    );
  }

  const votesFull = votedIds.length >= MAX_VOTES;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {canVote && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            투표 현황: <span className="font-bold text-[#2E75B6]">{votedIds.length}</span> / {MAX_VOTES}
            {votesFull && <span className="ml-2 text-green-600 font-semibold">투표 완료!</span>}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            isVoted={votedIds.includes(image.id || "")}
            canVote={canVote && !votesFull && !votedIds.includes(image.id || "") && !voting}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
