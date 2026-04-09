import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  increment,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { Contest, ContestImage, Vote } from "@/types";

// ===== Contest =====

export async function getTodayContest(): Promise<
  (Contest & { id: string }) | null
> {
  const today = new Date().toISOString().split("T")[0];
  const docRef = doc(db, "contests", today);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Contest) };
}

export async function getContest(
  date: string
): Promise<(Contest & { id: string }) | null> {
  const docRef = doc(db, "contests", date);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Contest) };
}

export async function getActiveContest(): Promise<
  (Contest & { id: string }) | null
> {
  const q = query(
    collection(db, "contests"),
    where("status", "in", ["active", "pending"])
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  // Sort client-side by createdAt desc
  const sorted = snap.docs.sort((a, b) => {
    const aTime = (a.data() as Contest).createdAt?.toMillis() || 0;
    const bTime = (b.data() as Contest).createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
  return { id: sorted[0].id, ...(sorted[0].data() as Contest) };
}

export async function getLatestContest(): Promise<
  (Contest & { id: string }) | null
> {
  const q = query(
    collection(db, "contests"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as Contest) };
}

export async function createContest(date: string): Promise<void> {
  await setDoc(doc(db, "contests", date), {
    date,
    status: "pending",
    startTime: Timestamp.now(),
    endTime: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
}

export async function updateContestStatus(
  date: string,
  status: Contest["status"]
): Promise<void> {
  await updateDoc(doc(db, "contests", date), { status });
}

export async function updateContestTimes(
  date: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  await updateDoc(doc(db, "contests", date), {
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
  });
}

// ===== Images =====

export async function getContestImages(
  contestDate: string
): Promise<ContestImage[]> {
  const q = query(
    collection(db, "contests", contestDate, "images"),
    orderBy("number", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ContestImage) }));
}

export async function getContestImagesRanked(
  contestDate: string
): Promise<ContestImage[]> {
  const q = query(
    collection(db, "contests", contestDate, "images"),
    orderBy("voteCount", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as ContestImage) }));
}

export async function addContestImage(
  contestDate: string,
  image: Omit<ContestImage, "id">
): Promise<string> {
  const colRef = collection(db, "contests", contestDate, "images");
  const docRef = doc(colRef);
  await setDoc(docRef, image);
  return docRef.id;
}

export async function deleteContestImage(
  contestDate: string,
  imageId: string
): Promise<void> {
  await deleteDoc(doc(db, "contests", contestDate, "images", imageId));
}

// ===== Votes =====

export async function castVote(
  contestDate: string,
  fingerprint: string,
  imageId: string
): Promise<boolean> {
  const voteRef = doc(db, "contests", contestDate, "votes", fingerprint);
  const existing = await getDoc(voteRef);
  if (existing.exists()) return false;

  await setDoc(voteRef, {
    fingerprint,
    imageId,
    votedAt: Timestamp.now(),
  });

  // Increment vote count
  const imageRef = doc(db, "contests", contestDate, "images", imageId);
  await updateDoc(imageRef, { voteCount: increment(1) });

  return true;
}

export async function getUserVote(
  contestDate: string,
  fingerprint: string
): Promise<Vote | null> {
  const voteRef = doc(db, "contests", contestDate, "votes", fingerprint);
  const snap = await getDoc(voteRef);
  if (!snap.exists()) return null;
  return snap.data() as Vote;
}

// ===== Archive =====

export async function getContestList(): Promise<(Contest & { id: string })[]> {
  const q = query(collection(db, "contests"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Contest) }));
}
