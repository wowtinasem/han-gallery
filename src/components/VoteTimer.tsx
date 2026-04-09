"use client";

import { useEffect, useState } from "react";
import { Contest } from "@/types";

interface VoteTimerProps {
  contest: Contest & { id: string };
  onTimeUp?: () => void;
}

export default function VoteTimer({ contest, onTimeUp }: VoteTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (contest.status !== "active") return;

    const endTime = contest.endTime.toDate().getTime();

    const update = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
        onTimeUp?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [contest, onTimeUp]);

  if (contest.status !== "active" || isExpired) return null;

  return (
    <div className="bg-[#1B3A5C] text-white py-3 text-center">
      <p className="text-sm text-blue-200 mb-1">투표 마감까지</p>
      <p className="text-3xl font-mono font-bold tracking-widest">
        {timeLeft}
      </p>
    </div>
  );
}
