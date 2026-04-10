"use client";

import { useState, useEffect, useCallback } from "react";
import { ContestImage } from "@/types";
import { getContestImages, castVote, getUserVote } from "@/lib/firestore";
import { getFingerprint } from "@/lib/fingerprint";
import ImageCard from "./ImageCard";

interface ImageGalleryProps {
  contestDate: string;
  canVote: boolean;
}

export default function ImageGallery({
  contestDate,
  canVote,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ContestImage[]>([]);
  const [votedImageId, setVotedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const imgs = await getContestImages(contestDate);
      setImages(imgs);

      // Check if user already voted
      const fp = await getFingerprint();
      const existingVote = await getUserVote(contestDate, fp);
      if (existingVote) {
        setVotedImageId(existingVote.imageId);
      } else {
        // Check localStorage backup
        const localVote = localStorage.getItem(`vote_${contestDate}`);
        if (localVote) setVotedImageId(localVote);
      }
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
    if (voting || votedImageId) return;
    const target = images.find((img) => img.id === imageId);
    if (!confirm(`#${String(target?.number || 0).padStart(2, "0")} ${target?.nickname || ""} 작품에 투표하시겠습니까?\n\n투표는 한 번만 가능합니다.`)) return;
    setVoting(true);

    try {
      const fp = await getFingerprint();
      const success = await castVote(contestDate, fp, imageId);

      if (success) {
        setVotedImageId(imageId);
        localStorage.setItem(`vote_${contestDate}`, imageId);
        // Refresh images to update vote counts
        const imgs = await getContestImages(contestDate);
        setImages(imgs);
      } else {
        alert("이미 투표하셨습니다.");
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            isVoted={votedImageId === image.id}
            canVote={canVote && !votedImageId && !voting}
            onVote={handleVote}
          />
        ))}
      </div>
    </div>
  );
}
