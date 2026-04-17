import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  increment,
  Timestamp,
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
  const snap = await getDocs(collection(db, "contests"));
  if (snap.empty) return null;
  const filtered = snap.docs
    .filter((d) => {
      const s = (d.data() as Contest).status;
      return s === "active" || s === "pending";
    })
    .sort((a, b) => {
      const aTime = (a.data() as Contest).createdAt?.toMillis() || 0;
      const bTime = (b.data() as Contest).createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  if (filtered.length === 0) return null;
  return { id: filtered[0].id, ...(filtered[0].data() as Contest) };
}

export async function getLatestContest(): Promise<
  (Contest & { id: string }) | null
> {
  const snap = await getDocs(collection(db, "contests"));
  if (snap.empty) return null;
  const sorted = snap.docs.sort((a, b) => {
    const aTime = (a.data() as Contest).createdAt?.toMillis() || 0;
    const bTime = (b.data() as Contest).createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
  return { id: sorted[0].id, ...(sorted[0].data() as Contest) };
}

export async function createContest(date: string): Promise<void> {
  // 같은 날짜의 기존 콘테스트가 있으면 이미지/투표 서브컬렉션 삭제
  const existing = await getDoc(doc(db, "contests", date));
  if (existing.exists()) {
    try {
      const imageSnap = await getDocs(collection(db, "contests", date, "images"));
      for (const d of imageSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch {
      // ignore
    }
    try {
      const voteSnap = await getDocs(collection(db, "contests", date, "votes"));
      for (const d of voteSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch {
      // ignore
    }
  }
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
  const snap = await getDocs(
    collection(db, "contests", contestDate, "images")
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ContestImage) }))
    .sort((a, b) => a.number - b.number);
}

export async function getContestImagesRanked(
  contestDate: string
): Promise<ContestImage[]> {
  const snap = await getDocs(
    collection(db, "contests", contestDate, "images")
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ContestImage) }))
    .sort((a, b) => b.voteCount - a.voteCount);
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

// 투표 슬롯: fingerprint, fingerprint_2, fingerprint_3 (create-only 규칙 호환)
const VOTE_SLOTS = ["", "_2", "_3"];

export async function castVote(
  contestDate: string,
  fingerprint: string,
  imageId: string
): Promise<{ success: boolean; reason?: string }> {
  // 기존 투표 확인
  const existingIds = await getUserVoteIds(contestDate, fingerprint);

  if (existingIds.includes(imageId)) {
    return { success: false, reason: "이미 이 작품에 투표하셨습니다." };
  }
  if (existingIds.length >= 3) {
    return { success: false, reason: "최대 3개까지 투표할 수 있습니다." };
  }

  // 빈 슬롯 찾아서 새 문서 생성
  const slotSuffix = VOTE_SLOTS[existingIds.length]; // 0→"", 1→"_2", 2→"_3"
  const voteRef = doc(db, "contests", contestDate, "votes", fingerprint + slotSuffix);
  await setDoc(voteRef, {
    fingerprint,
    imageId,
    votedAt: Timestamp.now(),
  });

  // Increment vote count (클릭당 3점)
  const imageRef = doc(db, "contests", contestDate, "images", imageId);
  await updateDoc(imageRef, { voteCount: increment(3) });

  return { success: true };
}

export async function getUserVoteIds(
  contestDate: string,
  fingerprint: string
): Promise<string[]> {
  const ids: string[] = [];
  for (const suffix of VOTE_SLOTS) {
    const snap = await getDoc(doc(db, "contests", contestDate, "votes", fingerprint + suffix));
    if (snap.exists()) {
      ids.push(snap.data().imageId);
    }
  }
  return ids;
}

// ===== Admin =====

export async function getAdminPassword(): Promise<string> {
  const snap = await getDoc(doc(db, "settings", "admin"));
  if (!snap.exists()) {
    // Initialize with default password
    await setDoc(doc(db, "settings", "admin"), { password: "000000" });
    return "000000";
  }
  return snap.data().password;
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  await setDoc(doc(db, "settings", "admin"), { password: newPassword });
}


export async function deleteContest(date: string): Promise<void> {
  // Delete subcollections first (ignore errors for empty collections)
  try {
    const imageSnap = await getDocs(collection(db, "contests", date, "images"));
    for (const d of imageSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {
    // ignore
  }

  try {
    const voteSnap = await getDocs(collection(db, "contests", date, "votes"));
    for (const d of voteSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {
    // ignore
  }

  // Delete contest document
  await deleteDoc(doc(db, "contests", date));
}

// ===== Archive =====

export async function getContestList(): Promise<(Contest & { id: string })[]> {
  const snap = await getDocs(collection(db, "contests"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Contest) }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
}
