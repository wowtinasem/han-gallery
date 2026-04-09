import { Timestamp } from "firebase/firestore";

export interface Contest {
  date: string; // "2026-04-09"
  status: "pending" | "active" | "ended";
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
}

export interface ContestImage {
  id?: string;
  number: number;
  nickname: string;
  imageUrl: string;
  voteCount: number;
}

export interface Vote {
  fingerprint: string;
  imageId: string;
  votedAt: Timestamp;
}
