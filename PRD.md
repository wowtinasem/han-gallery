# 한콘연 오늘의 Best Image Top30 - 제품 개발 명세서 (PRD)

> 이 문서 하나로 동일한 앱을 처음부터 구축할 수 있는 완전한 개발 명세서입니다.

---

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 한콘연 오늘의 Best Image Top30 |
| 운영 주체 | 한국AI콘텐츠연구소 (한콘연) |
| 목적 | AI 생성 이미지 일일 콘테스트 투표 플랫폼 |
| 주요 사용자 | 일반 투표 참여자 + 관리자 |
| 배포 URL | https://han-gallery.vercel.app |

### 핵심 플로우

```
[관리자] 콘테스트 생성 → 이미지 업로드 → 투표시간 설정
  → [자동/수동] 투표 시작 → [일반 사용자] 1인 1표 투표
  → [자동/수동] 투표 종료 → [관리자] 최종 1위 선택
  → [결과 탭] 최종 1위 공개 + 참여 작품 표시
```

---

## 2. 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.2.3 |
| UI 라이브러리 | React | 19.2.4 |
| 언어 | TypeScript | 5 |
| 스타일링 | Tailwind CSS | 4 |
| 데이터베이스 | Firebase Firestore | 12.11.0 |
| 이미지 호스팅 | Cloudinary | 2.9.0 |
| 이미지 업로드 UI | react-dropzone | 15.0.0 |
| 브라우저 핑거프린트 | @fingerprintjs/fingerprintjs | 5.2.0 |
| 날짜 유틸 | date-fns | 4.1.0 |
| Cloudinary Next.js | next-cloudinary | 6.17.5 |
| 배포 | Vercel | - |

---

## 3. 환경 변수

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 4. 디렉토리 구조

```
han-gallery/
├── public/
│   ├── nav-logo.png          # 네비게이션 로고 (44x33)
│   ├── hero-bg.png           # 히어로 배경
│   └── icon.png              # 파비콘
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # 루트 레이아웃
│   │   ├── page.tsx                        # 홈(투표) 페이지
│   │   ├── globals.css                     # 전역 스타일
│   │   ├── result/page.tsx                 # 결과 페이지
│   │   ├── archive/page.tsx                # 아카이브 페이지
│   │   ├── archive/[date]/page.tsx         # 아카이브 상세 페이지
│   │   ├── admin/page.tsx                  # 관리자 페이지
│   │   └── api/
│   │       ├── admin/route.ts              # 관리자 인증 API
│   │       ├── admin/change-password/route.ts  # 비밀번호 변경 API
│   │       └── upload/route.ts             # 이미지 업로드 API
│   ├── components/
│   │   ├── Navigation.tsx     # 네비게이션바
│   │   ├── Hero.tsx           # 히어로 섹션
│   │   ├── ImageGallery.tsx   # 이미지 갤러리 (투표)
│   │   ├── ImageCard.tsx      # 이미지 카드 단위
│   │   ├── VoteTimer.tsx      # 투표 카운트다운 타이머
│   │   ├── ResultBoard.tsx    # 결과 표시 보드
│   │   ├── ArchiveList.tsx    # 아카이브 캘린더+목록
│   │   ├── AdminSettings.tsx  # 관리자 투표시간/상태 설정
│   │   └── AdminUploader.tsx  # 관리자 이미지 업로드
│   ├── lib/
│   │   ├── firebase.ts        # Firebase 초기화
│   │   ├── firestore.ts       # Firestore CRUD 함수
│   │   ├── cloudinary.ts      # Cloudinary 설정
│   │   └── fingerprint.ts     # 브라우저 핑거프린트
│   └── types/
│       └── index.ts           # TypeScript 타입 정의
├── firestore.rules            # Firestore 보안 규칙
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 5. 데이터 모델

### 5.1 Firestore 컬렉션 구조

```
firestore/
├── settings/
│   └── admin                    # { password: string }
└── contests/
    └── {date}                   # "2026-04-09" 형식
        ├── (Contest 필드들)
        ├── images/              # 서브컬렉션
        │   └── {imageId}        # ContestImage
        └── votes/               # 서브컬렉션
            └── {visitorId}      # Vote (핑거프린트 기반)
```

### 5.2 TypeScript 타입 정의

```typescript
// src/types/index.ts
import { Timestamp } from "firebase/firestore";

export interface Contest {
  date: string;                              // "2026-04-09"
  status: "pending" | "active" | "ended";
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  winnerId?: string;                         // 최종 1위 이미지 ID
}

export interface ContestImage {
  id?: string;
  number: number;                            // 이미지 순번
  nickname: string;                          // 작가 닉네임
  imageUrl: string;                          // Cloudinary URL
  voteCount: number;
}

export interface Vote {
  fingerprint: string;                       // 브라우저 핑거프린트
  imageId: string;
  votedAt: Timestamp;
}
```

### 5.3 Firestore 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/{docId} {
      allow read, write: if true;
    }
    match /contests/{date} {
      allow read: if true;
      allow write: if true;
      match /images/{imageId} {
        allow read: if true;
        allow write: if true;
      }
      match /votes/{visitorId} {
        allow read: if true;
        allow create: if !exists(/databases/$(database)/documents/contests/$(date)/votes/$(visitorId));
        allow update, delete: if false;
      }
    }
  }
}
```

> **핵심**: votes는 create만 허용, update/delete 불가 → 1인 1표 보장

---

## 6. 설정 파일

### 6.1 package.json

```json
{
  "name": "han-gallery",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@fingerprintjs/fingerprintjs": "^5.2.0",
    "cloudinary": "^2.9.0",
    "date-fns": "^4.1.0",
    "firebase": "^12.11.0",
    "next": "16.2.3",
    "next-cloudinary": "^6.17.5",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-dropzone": "^15.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### 6.2 next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
```

### 6.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

### 6.4 postcss.config.mjs

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 6.5 eslint.config.mjs

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

---

## 7. 전체 소스 코드

### 7.1 라이브러리 (src/lib/)

#### src/lib/firebase.ts — Firebase 초기화

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
```

#### src/lib/cloudinary.ts — Cloudinary 설정

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

#### src/lib/fingerprint.ts — 브라우저 핑거프린트

```typescript
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null;

export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
}
```

#### src/lib/firestore.ts — Firestore CRUD 전체

```typescript
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

export async function getTodayContest(): Promise<(Contest & { id: string }) | null> {
  const today = new Date().toISOString().split("T")[0];
  const docRef = doc(db, "contests", today);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Contest) };
}

export async function getContest(date: string): Promise<(Contest & { id: string }) | null> {
  const docRef = doc(db, "contests", date);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Contest) };
}

export async function getActiveContest(): Promise<(Contest & { id: string }) | null> {
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

export async function getLatestContest(): Promise<(Contest & { id: string }) | null> {
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
  await setDoc(doc(db, "contests", date), {
    date,
    status: "pending",
    startTime: Timestamp.now(),
    endTime: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
}

export async function updateContestStatus(date: string, status: Contest["status"]): Promise<void> {
  await updateDoc(doc(db, "contests", date), { status });
}

export async function updateContestTimes(date: string, startTime: Date, endTime: Date): Promise<void> {
  await updateDoc(doc(db, "contests", date), {
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
  });
}

// ===== Images =====

export async function getContestImages(contestDate: string): Promise<ContestImage[]> {
  const snap = await getDocs(collection(db, "contests", contestDate, "images"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ContestImage) }))
    .sort((a, b) => a.number - b.number);
}

export async function getContestImagesRanked(contestDate: string): Promise<ContestImage[]> {
  const snap = await getDocs(collection(db, "contests", contestDate, "images"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ContestImage) }))
    .sort((a, b) => b.voteCount - a.voteCount);
}

export async function addContestImage(contestDate: string, image: Omit<ContestImage, "id">): Promise<string> {
  const colRef = collection(db, "contests", contestDate, "images");
  const docRef = doc(colRef);
  await setDoc(docRef, image);
  return docRef.id;
}

export async function deleteContestImage(contestDate: string, imageId: string): Promise<void> {
  await deleteDoc(doc(db, "contests", contestDate, "images", imageId));
}

// ===== Votes =====

export async function castVote(contestDate: string, fingerprint: string, imageId: string): Promise<boolean> {
  const voteRef = doc(db, "contests", contestDate, "votes", fingerprint);
  const existing = await getDoc(voteRef);
  if (existing.exists()) return false;

  await setDoc(voteRef, {
    fingerprint,
    imageId,
    votedAt: Timestamp.now(),
  });

  const imageRef = doc(db, "contests", contestDate, "images", imageId);
  await updateDoc(imageRef, { voteCount: increment(1) });

  return true;
}

export async function getUserVote(contestDate: string, fingerprint: string): Promise<Vote | null> {
  const voteRef = doc(db, "contests", contestDate, "votes", fingerprint);
  const snap = await getDoc(voteRef);
  if (!snap.exists()) return null;
  return snap.data() as Vote;
}

// ===== Admin =====

export async function getAdminPassword(): Promise<string> {
  const snap = await getDoc(doc(db, "settings", "admin"));
  if (!snap.exists()) {
    await setDoc(doc(db, "settings", "admin"), { password: "000000" });
    return "000000";
  }
  return snap.data().password;
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  await setDoc(doc(db, "settings", "admin"), { password: newPassword });
}

export async function setContestWinner(date: string, imageId: string): Promise<void> {
  await updateDoc(doc(db, "contests", date), { winnerId: imageId });
}

export async function deleteContest(date: string): Promise<void> {
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
```

---

### 7.2 앱 레이아웃 및 스타일

#### src/app/globals.css

```css
@import "tailwindcss";

:root {
  --background: #f9fafb;
  --foreground: #111827;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
}

body {
  background: var(--background);
  color: var(--foreground);
}

html {
  scroll-behavior: smooth;
}

img {
  background-color: #e5e7eb;
}
```

#### src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "한콘연 AI이미지 콘테스트",
  description: "한콘연 AI이미지 콘테스트 투표 - 마음에 드는 AI 이미지 작품에 투표해주세요!",
  openGraph: {
    title: "한콘연 AI이미지 콘테스트",
    description: "마음에 드는 AI 이미지 작품에 투표해주세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "한콘연 AI이미지 콘테스트",
  },
  twitter: {
    card: "summary_large_image",
    title: "한콘연 AI이미지 콘테스트",
    description: "마음에 드는 AI 이미지 작품에 투표해주세요!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

---

### 7.3 페이지 (src/app/)

#### src/app/page.tsx — 홈(투표) 페이지

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contest } from "@/types";
import { getActiveContest, updateContestStatus } from "@/lib/firestore";
import Hero from "@/components/Hero";
import VoteTimer from "@/components/VoteTimer";
import ImageGallery from "@/components/ImageGallery";

export default function Home() {
  const router = useRouter();
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContest = useCallback(async () => {
    try {
      const c = await getActiveContest();
      setContest(c && c.status === "active" ? c : null);
    } catch (error) {
      console.error("Failed to load contest:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContest();
  }, [loadContest]);

  const handleTimeUp = useCallback(async () => {
    if (!contest) return;
    try {
      await updateContestStatus(contest.date, "ended");
      router.push("/result");
    } catch (error) {
      console.error("Failed to end contest:", error);
    }
  }, [contest, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero contest={contest} />
      {contest && contest.status === "active" && (
        <VoteTimer contest={contest} onTimeUp={handleTimeUp} />
      )}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-gray-500">작품을 불러오는 중...</p>
        </div>
      ) : contest ? (
        <ImageGallery contestDate={contest.date} canVote={contest.status === "active"} />
      ) : (
        <div className="py-20 text-center text-gray-500">
          현재 진행 중인 콘테스트가 없습니다.
        </div>
      )}
    </div>
  );
}
```

#### src/app/result/page.tsx — 결과 페이지

```tsx
"use client";

import { useState, useEffect } from "react";
import { Contest } from "@/types";
import { getLatestContest } from "@/lib/firestore";
import ResultBoard from "@/components/ResultBoard";

export default function ResultPage() {
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await getLatestContest();
        setContest(c);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">결과를 표시할 콘테스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl sm:text-5xl font-bold text-center px-4">한콘연 오늘의 Best Image Top30</h1>
        <p className="text-xs sm:text-lg mt-2 mb-2 text-center px-4">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
        <h2 className="text-xl font-bold mb-2">콘테스트 결과</h2>
        <p className="text-blue-200">{contest.date}</p>
        {contest.status !== "ended" && (
          <p className="mt-2 text-yellow-300 text-sm">
            아직 투표가 진행 중입니다. 최종 결과는 투표 종료 후 확정됩니다.
          </p>
        )}
      </div>
      <ResultBoard contestDate={contest.date} isEnded={contest.status === "ended"} winnerId={contest.winnerId} />
    </div>
  );
}
```

#### src/app/archive/page.tsx — 아카이브 페이지

```tsx
"use client";

import ArchiveList from "@/components/ArchiveList";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl sm:text-5xl font-bold text-center px-4">한콘연 오늘의 Best Image Top30</h1>
        <p className="text-xs sm:text-lg mt-2 mb-2 text-center px-4">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
        <h2 className="text-xl font-bold mb-2">아카이브</h2>
        <p className="text-blue-200">지난 콘테스트 기록을 확인하세요</p>
      </div>
      <ArchiveList />
    </div>
  );
}
```

#### src/app/archive/[date]/page.tsx — 아카이브 상세 페이지

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Contest } from "@/types";
import { getContest } from "@/lib/firestore";
import ResultBoard from "@/components/ResultBoard";
import ImageGallery from "@/components/ImageGallery";

export default function ArchiveDetailPage() {
  const params = useParams();
  const date = params.date as string;
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const c = await getContest(date);
        setContest(c);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (date) load();
  }, [date]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">해당 날짜의 콘테스트를 찾을 수 없습니다.</p>
        <Link href="/archive" className="text-[#2E75B6] hover:underline">
          ← 아카이브로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2E75B6] text-white py-10 text-center">
        <Link href="/archive" className="text-blue-200 hover:text-white text-sm mb-2 inline-block">
          ← 아카이브
        </Link>
        <h1 className="text-3xl font-bold mb-2">{date} 콘테스트</h1>
        <p className="text-blue-200">최종 결과</p>
      </div>
      <ResultBoard contestDate={date} isEnded={contest.status === "ended"} winnerId={contest.winnerId} />
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">전체 작품</h2>
        </div>
        <ImageGallery contestDate={date} canVote={false} />
      </div>
    </div>
  );
}
```

#### src/app/admin/page.tsx — 관리자 페이지

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import {
  getLatestContest,
  createContest,
  getContestImages,
  deleteContestImage,
  getContestList,
  deleteContest,
  updateContestStatus,
  setContestWinner,
} from "@/lib/firestore";
import AdminUploader from "@/components/AdminUploader";
import AdminSettings from "@/components/AdminSettings";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(null);
  const [images, setImages] = useState<ContestImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [showPwModal, setShowPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [archiveList, setArchiveList] = useState<(Contest & { id: string })[]>([]);
  const [expandedContest, setExpandedContest] = useState<string | null>(null);
  const [expandedImages, setExpandedImages] = useState<ContestImage[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Check session
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") setAuthenticated(true);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
      } else {
        alert("비밀번호가 틀렸습니다.");
      }
    } catch {
      alert("인증 오류가 발생했습니다.");
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      alert("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPw.length < 4) {
      alert("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("비밀번호가 변경되었습니다.");
        setShowPwModal(false);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        alert(data.error || "비밀번호 변경 실패");
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setPwLoading(false);
    }
  };

  const loadContestData = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getLatestContest();
      setContest(c);
      if (c) {
        const imgs = await getContestImages(c.date);
        setImages(imgs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadContestData();
  }, [authenticated, loadContestData]);

  const handleCreateContest = async () => {
    try {
      await createContest(newDate);
      await loadContestData();
    } catch (error) {
      console.error(error);
      alert("콘테스트 생성 실패");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!contest || !confirm("이미지를 삭제하시겠습니까?")) return;
    try {
      await deleteContestImage(contest.date, imageId);
      await loadContestData();
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
    }
  };

  const handleSelectWinner = async (imageId: string, nickname: string) => {
    if (!contest) return;
    if (!confirm(`#${nickname} 작품을 최종 1위로 선택하시겠습니까?`)) return;
    try {
      await setContestWinner(contest.date, imageId);
      await loadContestData();
      alert("최종 1위가 선택되었습니다.");
    } catch (error) {
      console.error(error);
      alert("선택 실패");
    }
  };

  // ===== Archive Management =====
  const loadArchiveList = useCallback(async () => {
    try {
      const list = await getContestList();
      setArchiveList(list);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadArchiveList();
  }, [authenticated, loadArchiveList]);

  const handleExpandContest = async (date: string) => {
    if (expandedContest === date) {
      setExpandedContest(null);
      setExpandedImages([]);
      return;
    }
    try {
      const imgs = await getContestImages(date);
      setExpandedImages(imgs);
      setExpandedContest(date);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteContest = async (date: string) => {
    if (!confirm(`${date} 콘테스트를 삭제하시겠습니까?\n\n모든 이미지와 투표 데이터가 삭제됩니다.`)) return;
    try {
      await deleteContest(date);
      setSelectedDate(null);
      setExpandedContest(null);
      setExpandedImages([]);
      if (contest?.date === date) {
        setContest(null);
        setImages([]);
      }
      await loadArchiveList();
      await loadContestData();
      alert("콘테스트가 삭제되었습니다.");
    } catch (error) {
      console.error("Delete error:", error);
      setSelectedDate(null);
      setExpandedContest(null);
      setExpandedImages([]);
      await loadArchiveList();
      await loadContestData();
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleArchiveStatusChange = async (date: string, status: Contest["status"]) => {
    try {
      await updateContestStatus(date, status);
      await loadArchiveList();
      await loadContestData();
      alert("상태가 변경되었습니다.");
    } catch (error) {
      console.error(error);
      alert("상태 변경 실패");
    }
  };

  const handleDeleteArchiveImage = async (contestDate: string, imageId: string) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;
    try {
      await deleteContestImage(contestDate, imageId);
      const imgs = await getContestImages(contestDate);
      setExpandedImages(imgs);
      await loadArchiveList();
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6 text-center">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="비밀번호 입력"
            className="w-full border rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-[#2E75B6] text-white rounded-lg font-semibold hover:bg-[#1B3A5C] transition-colors"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">관리자 페이지</h1>
          <button
            onClick={() => setShowPwModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            비밀번호 변경
          </button>
        </div>

        {/* Password Change Modal */}
        {showPwModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
              <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">비밀번호 변경</h2>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="현재 비밀번호"
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="새 비밀번호 (4자 이상)"
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowPwModal(false);
                    setCurrentPw("");
                    setNewPw("");
                    setConfirmPw("");
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                  className="flex-1 py-3 bg-[#2E75B6] text-white rounded-lg font-semibold hover:bg-[#1B3A5C] transition-colors disabled:opacity-50"
                >
                  {pwLoading ? "변경 중..." : "변경"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Contest */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">콘테스트 관리</h3>
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            />
            <button
              onClick={handleCreateContest}
              className="px-6 py-2 bg-[#2E75B6] text-white rounded-lg font-semibold hover:bg-[#1B3A5C] transition-colors"
            >
              새 콘테스트 생성
            </button>
          </div>
          {contest && (
            <p className="mt-3 text-sm text-gray-600">
              현재 콘테스트: <span className="font-bold">{contest.date}</span> ({contest.status})
            </p>
          )}
        </div>

        {contest && (
          <>
            {/* Vote Settings */}
            <AdminSettings contest={contest} onUpdate={loadContestData} />

            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">이미지 업로드</h3>
              <AdminUploader
                contestDate={contest.date}
                existingCount={images.length}
                onUploadComplete={loadContestData}
              />
            </div>

            {/* Uploaded Images with Vote Counts (Admin Only) */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-[#1B3A5C]">
                    업로드된 이미지 ({images.length}개)
                  </h3>
                  <p className="text-sm text-gray-500">
                    총 투표수: <span className="font-bold text-[#2E75B6]">{images.reduce((sum, img) => sum + img.voteCount, 0)}표</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative bg-gray-50 rounded-lg overflow-hidden">
                      <div className="relative aspect-square">
                        <Image
                          src={image.imageUrl}
                          alt={image.nickname}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-bold text-[#2E75B6]">
                          #{String(image.number).padStart(2, "0")}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{image.nickname}</p>
                        <p className="text-xs text-orange-500 font-semibold">{image.voteCount}표</p>
                      </div>
                      <button
                        onClick={() => image.id && handleDeleteImage(image.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Winner Selection - shown when contest is ended */}
        {contest && contest.status === "ended" && images.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg text-[#1B3A5C] mb-2">최종 1위 선택</h3>
            <p className="text-sm text-gray-500 mb-4">
              이미지를 클릭하면 최종 1위로 선택됩니다.
              {contest.winnerId && " (현재 선택된 1위는 왕관 표시)"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => {
                const isWinner = contest.winnerId === image.id;
                return (
                  <button
                    key={image.id}
                    onClick={() =>
                      image.id &&
                      handleSelectWinner(image.id, `${String(image.number).padStart(2, "0")} ${image.nickname}`)
                    }
                    className={`relative bg-gray-50 rounded-lg overflow-hidden text-left transition-all ${
                      isWinner ? "ring-4 ring-yellow-400 shadow-lg" : "hover:ring-2 hover:ring-[#2E75B6]"
                    }`}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.imageUrl}
                        alt={image.nickname}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      {isWinner && (
                        <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                          <span className="text-4xl">{"\u{1F451}"}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-bold text-[#2E75B6]">
                        #{String(image.number).padStart(2, "0")}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{image.nickname}</p>
                      <p className="text-xs text-gray-400">{image.voteCount}표</p>
                    </div>
                    {isWinner && (
                      <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        1위
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Archive Management - Calendar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">지난 콘테스트 관리</h3>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11);
                  setCalendarYear(calendarYear - 1);
                } else {
                  setCalendarMonth(calendarMonth - 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ◀
            </button>
            <h4 className="font-bold text-[#1B3A5C]">
              {calendarYear}년 {calendarMonth + 1}월
            </h4>
            <button
              onClick={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              ▶
            </button>
          </div>

          {/* Calendar Grid */}
          {(() => {
            const contestDates = new Set(archiveList.map((c) => c.date));
            const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
            const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
            const weeks: (number | null)[][] = [];
            let week: (number | null)[] = Array(firstDay).fill(null);

            for (let d = 1; d <= daysInMonth; d++) {
              week.push(d);
              if (week.length === 7) {
                weeks.push(week);
                week = [];
              }
            }
            if (week.length > 0) {
              while (week.length < 7) week.push(null);
              weeks.push(week);
            }

            return (
              <div className="mb-4">
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-1">
                  {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>
                {weeks.map((w, wi) => (
                  <div key={wi} className="grid grid-cols-7 text-center">
                    {w.map((day, di) => {
                      if (day === null) return <div key={di} className="py-2" />;
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const hasContest = contestDates.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const contestForDate = archiveList.find((c) => c.date === dateStr);
                      const statusColor = contestForDate
                        ? contestForDate.status === "active"
                          ? "bg-green-500"
                          : contestForDate.status === "ended"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        : "";

                      return (
                        <button
                          key={di}
                          onClick={() => {
                            if (hasContest) {
                              setSelectedDate(isSelected ? null : dateStr);
                              setExpandedContest(null);
                              setExpandedImages([]);
                            }
                          }}
                          className={`py-2 text-sm rounded-lg relative transition-colors ${
                            isSelected
                              ? "bg-[#2E75B6] text-white font-bold"
                              : hasContest
                                ? "hover:bg-blue-50 font-semibold text-[#1B3A5C]"
                                : "text-gray-400"
                          }`}
                        >
                          {day}
                          {hasContest && (
                            <span
                              className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-white" : statusColor
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Selected Date Contests */}
          {selectedDate && (() => {
            const contestsForDate = archiveList.filter((c) => c.date === selectedDate);
            if (contestsForDate.length === 0) return null;

            return (
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-[#1B3A5C]">{selectedDate} 콘테스트</h4>
                {contestsForDate.map((c) => (
                  <div key={c.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                      <button
                        onClick={() => handleExpandContest(c.date)}
                        className="flex items-center gap-2 text-left flex-1"
                      >
                        <span className="text-xs font-mono">
                          {expandedContest === c.date ? "▼" : "▶"}
                        </span>
                        <span className="text-sm font-bold text-[#1B3A5C]">{c.date}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700"
                              : c.status === "ended"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {c.status === "active" ? "진행중" : c.status === "ended" ? "종료" : "준비중"}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <select
                          value={c.status}
                          onChange={(e) => handleArchiveStatusChange(c.date, e.target.value as Contest["status"])}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="pending">준비중</option>
                          <option value="active">진행중</option>
                          <option value="ended">종료</option>
                        </select>
                        <button
                          onClick={() => handleDeleteContest(c.date)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* Expanded Image List */}
                    {expandedContest === c.date && (
                      <div className="p-4 border-t">
                        {expandedImages.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">등록된 이미지가 없습니다.</p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {expandedImages.map((img) => (
                              <div key={img.id} className="relative bg-gray-50 rounded-lg overflow-hidden">
                                <div className="relative aspect-square">
                                  <Image
                                    src={img.imageUrl}
                                    alt={img.nickname}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 33vw, 20vw"
                                  />
                                </div>
                                <div className="p-1.5">
                                  <p className="text-[10px] font-bold text-[#2E75B6]">
                                    #{String(img.number).padStart(2, "0")}
                                  </p>
                                  <p className="text-[10px] text-gray-600 truncate">
                                    {img.nickname} · {img.voteCount}표
                                  </p>
                                </div>
                                <button
                                  onClick={() => img.id && handleDeleteArchiveImage(c.date, img.id)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
```

---

### 7.4 API 라우트 (src/app/api/)

#### src/app/api/admin/route.ts — 관리자 인증

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = await getAdminPassword();

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

#### src/app/api/admin/change-password/route.ts — 비밀번호 변경

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword, updateAdminPassword } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    const adminPassword = await getAdminPassword();

    if (currentPassword !== adminPassword) {
      return NextResponse.json({ error: "현재 비밀번호가 틀렸습니다." }, { status: 401 });
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "새 비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
    }

    await updateAdminPassword(newPassword);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
```

#### src/app/api/upload/route.ts — 이미지 업로드

```typescript
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const nickname = formData.get("nickname") as string;
    const contestDate = formData.get("contestDate") as string;
    const number = Number(formData.get("number"));

    if (!file || !nickname || !contestDate || !number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `han-gallery/${contestDate}`,
            transformation: [{ width: 1024, crop: "limit" }],
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      imageUrl: result.secure_url,
      number,
      nickname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

---

### 7.5 컴포넌트 (src/components/)

#### src/components/Navigation.tsx

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "투표" },
  { href: "/result", label: "결과" },
  { href: "/archive", label: "아카이브" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#030321] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm sm:text-xl tracking-tight hover:text-[#2E75B6] transition-colors"
          >
            <Image
              src="/nav-logo.png"
              alt="한국AI콘텐츠연구소 로고"
              width={44}
              height={33}
              className="rounded hidden sm:block"
            />
            한국AI콘텐츠연구소
          </Link>
          <div className="flex bg-white/10 rounded-lg p-0.5 sm:bg-transparent sm:p-0 sm:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-base font-semibold transition-colors ${
                  pathname === item.href
                    ? "bg-white text-[#1B3A5C]"
                    : "text-gray-300 hover:bg-white hover:text-[#1B3A5C]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

#### src/components/Hero.tsx

```tsx
"use client";

import { Contest } from "@/types";

interface HeroProps {
  contest: (Contest & { id: string }) | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "투표 진행중", className: "bg-green-500 animate-pulse" },
    ended: { label: "투표 종료", className: "bg-red-500" },
    pending: { label: "준비중", className: "bg-yellow-500" },
  };
  const { label, className } = config[status] || config.pending;

  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-white text-sm font-semibold ${className}`}>
      {label}
    </span>
  );
}

export default function Hero({ contest }: HeroProps) {
  return (
    <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl sm:text-5xl font-bold text-center px-4">한콘연 오늘의 Best Image Top30</h1>
      <p className="text-xs sm:text-lg mt-2 mb-2 text-center px-4">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
      {contest && (
        <>
          <StatusBadge status={contest.status} />
          <p className="mt-1 text-blue-200 text-xs">{contest.date}</p>
        </>
      )}
    </div>
  );
}
```

#### src/components/VoteTimer.tsx

```tsx
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
      <p className="text-3xl font-mono font-bold tracking-widest">{timeLeft}</p>
    </div>
  );
}
```

#### src/components/ImageGallery.tsx

```tsx
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

export default function ImageGallery({ contestDate, canVote }: ImageGalleryProps) {
  const [images, setImages] = useState<ContestImage[]>([]);
  const [votedImageId, setVotedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const imgs = await getContestImages(contestDate);
      setImages(imgs);

      const fp = await getFingerprint();
      const existingVote = await getUserVote(contestDate, fp);
      if (existingVote) {
        setVotedImageId(existingVote.imageId);
      } else {
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
    return <div className="py-20 text-center text-gray-500">이미지를 불러오는 중...</div>;
  }

  if (images.length === 0) {
    return <div className="py-20 text-center text-gray-500">등록된 이미지가 없습니다.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
```

#### src/components/ImageCard.tsx

```tsx
"use client";

import Image from "next/image";
import { ContestImage } from "@/types";

interface ImageCardProps {
  image: ContestImage;
  isVoted: boolean;
  canVote: boolean;
  onVote: (imageId: string) => void;
}

export default function ImageCard({ image, isVoted, canVote, onVote }: ImageCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
        isVoted ? "ring-3 ring-[#2E75B6]" : ""
      }`}
    >
      <div className="relative aspect-square">
        <Image
          src={image.imageUrl}
          alt={`${image.nickname}의 작품`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
          #{String(image.number).padStart(2, "0")}
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-800 text-sm truncate mb-2">{image.nickname}</p>
        {isVoted ? (
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
        )}
      </div>
    </div>
  );
}
```

#### src/components/ResultBoard.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ContestImage } from "@/types";
import { getContestImages } from "@/lib/firestore";

interface ResultBoardProps {
  contestDate: string;
  isEnded: boolean;
  winnerId?: string;
}

export default function ResultBoard({ contestDate, isEnded, winnerId }: ResultBoardProps) {
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
    return <div className="py-20 text-center text-gray-500">결과를 불러오는 중...</div>;
  }

  // 투표 진행 중: 대형 메시지만 표시
  if (!isEnded) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="text-6xl mb-6">{"\u{1F3C6}"}</div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#1B3A5C] mb-4">오늘의 Best Image는</h2>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#2E75B6]">잠시 후에 공개 됩니다.</h2>
          <p className="mt-6 text-gray-500">투표가 종료된 후 최종 결과가 발표됩니다.</p>
        </div>
      </div>
    );
  }

  // 투표 종료 + winnerId 없음: 선정 중 메시지
  if (!winnerId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="text-6xl mb-6">{"\u{23F3}"}</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C] mb-4">최종 결과는 잠시 후에 발표 됩니다.</h2>
        </div>
      </div>
    );
  }

  // 투표 종료 + winnerId 있음: 최종 1위 크게 + 나머지 동일 그리드
  const winner = images.find((img) => img.id === winnerId);
  const rest = images.filter((img) => img.id !== winnerId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 최종 1위 */}
      {winner && (
        <div className="mb-10">
          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
              {"\u{1F451}"} 최종 1위
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden ring-4 ring-yellow-400 max-w-lg mx-auto">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-center py-3 text-xl font-bold">
              {"\u{1F947}"} BEST IMAGE
            </div>
            <div className="relative aspect-square">
              <Image
                src={winner.imageUrl}
                alt={winner.nickname}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
            <div className="p-5 text-center">
              <p className="font-bold text-xl text-gray-800">
                #{String(winner.number).padStart(2, "0")} {winner.nickname}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 나머지 작품 - 동일 레벨 */}
      {rest.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-[#1B3A5C] mb-4 text-center">참여 작품</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rest.map((image) => (
              <div key={image.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={image.imageUrl}
                    alt={image.nickname}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                    #{String(image.number).padStart(2, "0")}
                  </div>
                </div>
                <div className="p-2 text-center">
                  <p className="font-medium text-gray-800 text-sm truncate">{image.nickname}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

#### src/components/ArchiveList.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import { getContestList, getContestImagesRanked } from "@/lib/firestore";

export default function ArchiveList() {
  const [archiveList, setArchiveList] = useState<(Contest & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ContestImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await getContestList();
        setArchiveList(list.filter((c) => c.status === "ended"));
      } catch (error) {
        console.error("Failed to load archive:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectDate = async (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null);
      setSelectedImages([]);
      return;
    }
    setSelectedDate(dateStr);
    setImagesLoading(true);
    try {
      const ranked = await getContestImagesRanked(dateStr);
      setSelectedImages(ranked);
    } catch (error) {
      console.error(error);
    } finally {
      setImagesLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500">아카이브를 불러오는 중...</div>;
  }

  const contestDates = new Set(archiveList.map((c) => c.date));
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const trophyEmoji = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
              } else {
                setCalendarMonth(calendarMonth - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg"
          >
            ◀
          </button>
          <h3 className="font-bold text-lg text-[#1B3A5C]">
            {calendarYear}년 {calendarMonth + 1}월
          </h3>
          <button
            onClick={() => {
              if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
              } else {
                setCalendarMonth(calendarMonth + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-1">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-cols-7 text-center">
            {w.map((day, di) => {
              if (day === null) return <div key={di} className="py-3" />;
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasContest = contestDates.has(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={di}
                  onClick={() => { if (hasContest) handleSelectDate(dateStr); }}
                  className={`py-3 text-sm rounded-lg relative transition-colors ${
                    isSelected
                      ? "bg-[#2E75B6] text-white font-bold"
                      : hasContest
                        ? "hover:bg-blue-50 font-semibold text-[#1B3A5C] cursor-pointer"
                        : "text-gray-400 cursor-default"
                  }`}
                >
                  {day}
                  {hasContest && (
                    <span
                      className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-[#2E75B6]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {archiveList.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">아직 완료된 콘테스트가 없습니다.</p>
        )}
      </div>

      {/* Selected Date Contest */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-bold text-lg text-[#1B3A5C]">{selectedDate} 콘테스트</h3>
          </div>

          {imagesLoading ? (
            <div className="py-12 text-center text-gray-500">이미지를 불러오는 중...</div>
          ) : selectedImages.length === 0 ? (
            <div className="py-12 text-center text-gray-500">등록된 이미지가 없습니다.</div>
          ) : (
            <>
              {/* Top 3 Preview */}
              <div className="grid grid-cols-3 gap-px bg-gray-100">
                {selectedImages.slice(0, 3).map((image, idx) => (
                  <div key={image.id} className="relative aspect-square">
                    <Image
                      src={image.imageUrl}
                      alt={image.nickname}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 250px"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                      {trophyEmoji[idx]} {idx + 1}등
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {image.nickname} · {image.voteCount}표
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* All Images Grid */}
              {selectedImages.length > 3 && (
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-3">전체 작품 ({selectedImages.length}개)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {selectedImages.slice(3).map((img) => (
                      <div key={img.id} className="relative bg-gray-50 rounded-lg overflow-hidden">
                        <div className="relative aspect-square">
                          <Image
                            src={img.imageUrl}
                            alt={img.nickname}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 25vw, 16vw"
                          />
                        </div>
                        <div className="p-1">
                          <p className="text-[10px] font-bold text-[#2E75B6]">
                            #{String(img.number).padStart(2, "0")}
                          </p>
                          <p className="text-[10px] text-gray-600 truncate">{img.nickname}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Result Link */}
              <div className="p-4 border-t text-center">
                <Link
                  href={`/archive/${selectedDate}`}
                  className="inline-block px-6 py-2.5 bg-[#2E75B6] text-white rounded-lg font-semibold hover:bg-[#1B3A5C] transition-colors text-sm"
                >
                  전체 결과 보기 →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

#### src/components/AdminSettings.tsx

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Contest } from "@/types";
import { updateContestStatus, updateContestTimes } from "@/lib/firestore";

interface AdminSettingsProps {
  contest: Contest & { id: string };
  onUpdate: () => void;
}

export default function AdminSettings({ contest, onUpdate }: AdminSettingsProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    if (contest.startTime) {
      const st = contest.startTime.toDate();
      setStartTime(toLocalDatetimeString(st));
    } else {
      setStartTime(toLocalDatetimeString(now));
    }

    if (contest.endTime) {
      const et = contest.endTime.toDate();
      const st = contest.startTime?.toDate();
      if (st && Math.abs(et.getTime() - st.getTime()) < 1000) {
        setEndTime(toLocalDatetimeString(oneHourLater));
      } else {
        setEndTime(toLocalDatetimeString(et));
      }
    } else {
      setEndTime(toLocalDatetimeString(oneHourLater));
    }
  }, [contest]);

  // Auto-start: check every 10 seconds if startTime has been reached
  useEffect(() => {
    if (contest.status !== "pending") return;

    const checkAutoStart = async () => {
      if (!contest.startTime) return;
      const st = contest.startTime.toDate();
      if (new Date() >= st) {
        try {
          await updateContestStatus(contest.date, "active");
          onUpdate();
        } catch (error) {
          console.error("Auto-start failed:", error);
        }
      }
    };

    checkAutoStart();
    timerRef.current = setInterval(checkAutoStart, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contest.status, contest.startTime, contest.date, onUpdate]);

  function toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  const handleSaveTimes = async () => {
    if (!startTime || !endTime) {
      alert("시작 시간과 종료 시간을 모두 설정해주세요.");
      return;
    }
    setSaving(true);
    try {
      await updateContestTimes(contest.date, new Date(startTime), new Date(endTime));
      alert("시간이 저장되었습니다.");
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: Contest["status"]) => {
    // "투표 시작" 버튼: 시작시간 전이면 확인
    if (status === "active" && contest.startTime) {
      const st = contest.startTime.toDate();
      if (new Date() < st) {
        const diff = st.getTime() - Date.now();
        const mins = Math.ceil(diff / 60000);
        if (!confirm(`설정된 시작 시간까지 약 ${mins}분 남았습니다.\n정말 지금 투표를 시작하시겠습니까?`)) {
          return;
        }
      }
    }

    setSaving(true);
    try {
      await updateContestStatus(contest.date, status);
      alert(
        status === "active"
          ? "투표가 시작되었습니다!"
          : status === "ended"
            ? "투표가 종료되었습니다."
            : "준비 상태로 변경되었습니다."
      );
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h3 className="font-bold text-lg text-[#1B3A5C]">투표 시간 설정</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
          />
        </div>
      </div>

      <button
        onClick={handleSaveTimes}
        disabled={saving}
        className="w-full py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300"
      >
        시간 저장
      </button>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-700 mb-3">투표 상태 관리</h4>
        <div className="flex gap-3">
          <button
            onClick={() => handleStatusChange("active")}
            disabled={saving || contest.status === "active"}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300"
          >
            투표 시작
          </button>
          <button
            onClick={() => handleStatusChange("ended")}
            disabled={saving || contest.status === "ended"}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-300"
          >
            투표 종료
          </button>
          <button
            onClick={() => handleStatusChange("pending")}
            disabled={saving || contest.status === "pending"}
            className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300"
          >
            준비중
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        현재 상태:{" "}
        <span className="font-semibold">
          {contest.status === "active"
            ? "투표 진행중"
            : contest.status === "ended"
              ? "투표 종료"
              : "준비중"}
        </span>
        {contest.status === "pending" && contest.startTime && (
          <span className="ml-2 text-blue-500">(시작 시간이 되면 자동으로 투표가 시작됩니다)</span>
        )}
      </p>
    </div>
  );
}
```

#### src/components/AdminUploader.tsx

```tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { addContestImage } from "@/lib/firestore";
import { ContestImage } from "@/types";

interface FileWithPreview {
  file: File;
  preview: string;
  nickname: string;
}

interface AdminUploaderProps {
  contestDate: string;
  existingCount: number;
  onUploadComplete: () => void;
}

export default function AdminUploader({ contestDate, existingCount, onUploadComplete }: AdminUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseNickname = (filename: string): string => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split("_");
    return parts.length >= 2 ? parts[0] : nameWithoutExt;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      nickname: parseNickname(file.name),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  const updateNickname = (index: number, nickname: string) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, nickname } : f)));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (files.some((f) => !f.nickname.trim())) {
      alert("모든 이미지에 닉네임을 입력해주세요.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const number = existingCount + i + 1;

        const formData = new FormData();
        formData.append("file", f.file);
        formData.append("nickname", f.nickname);
        formData.append("contestDate", contestDate);
        formData.append("number", String(number));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();

        await addContestImage(contestDate, {
          number,
          nickname: f.nickname,
          imageUrl: data.imageUrl,
          voteCount: 0,
        });

        setProgress(i + 1);
      }

      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-[#2E75B6] bg-blue-50" : "border-gray-300 hover:border-[#2E75B6]"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">
          {isDragActive ? "여기에 놓으세요!" : "이미지를 드래그하거나 클릭하여 선택하세요"}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          파일명이 &quot;닉네임_작품명.png&quot; 형식이면 닉네임이 자동 입력됩니다
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image src={f.preview} alt="preview" fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">{f.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-[#2E75B6]">
                    #{String(existingCount + idx + 1).padStart(2, "0")}
                  </span>
                  <input
                    type="text"
                    value={f.nickname}
                    onChange={(e) => updateNickname(idx, e.target.value)}
                    placeholder="닉네임 입력"
                    className="flex-1 text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
                  />
                </div>
              </div>
              <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600 text-xl px-2">
                ×
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-[#2E75B6] text-white rounded-xl font-semibold hover:bg-[#1B3A5C] transition-colors disabled:bg-gray-300"
          >
            {uploading ? `업로드 중... (${progress}/${files.length})` : `${files.length}개 이미지 업로드`}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 8. 디자인 시스템

### 8.1 컬러 팔레트

| 용도 | 색상 코드 | 사용처 |
|------|-----------|--------|
| Primary Blue | `#2E75B6` | 버튼, 링크, 강조 |
| Dark Navy | `#1B3A5C` | 제목, 호버 |
| Dark Background | `#030321` → `#0a0a4a` | 네비게이션, 히어로 그라디언트 |
| Background | `#f9fafb` (gray-50) | 페이지 배경 |
| Active Green | `bg-green-500` | 투표 진행중 뱃지, 시작 버튼 |
| Ended Red | `bg-red-500` | 투표 종료 뱃지, 종료 버튼 |
| Pending Yellow | `bg-yellow-500` | 준비중 뱃지, 준비 버튼 |
| Winner Gold | `ring-yellow-400` | 최종 1위 테두리 |
| Vote Count | `text-orange-500` | 관리자 투표수 |

### 8.2 반응형 브레이크포인트

| 브레이크포인트 | 네비게이션 | 히어로 | 이미지 그리드 |
|---------------|-----------|--------|-------------|
| 모바일 (< 640px) | 로고 숨김, text-sm, 토글형 탭 | text-2xl / text-xs | 1열 (투표), 2열 (결과) |
| SM (640px+) | 로고 표시, text-xl | text-5xl / text-lg | 3열 (투표), 3열 (결과) |
| MD (768px+) | - | - | 4열 (결과, 관리자) |
| LG (1024px+) | - | - | 4열 (투표) |
| XL (1280px+) | - | - | 5열 (투표) |

### 8.3 폰트

- **Geist Sans** (Google Fonts) — 전체 기본 폰트
- `font-mono` — 타이머 카운트다운

---

## 9. 빌드 및 배포

### 9.1 로컬 개발

```bash
npm install
npm run dev          # http://localhost:3000
```

### 9.2 빌드

```bash
npm run build
npm start            # 프로덕션 서버
```

### 9.3 Vercel 배포

1. GitHub 저장소 연결
2. 환경 변수 설정 (섹션 3 참조)
3. 자동 배포 (main 브랜치 push 시)

### 9.4 Firebase 설정

1. Firebase 콘솔에서 프로젝트 생성
2. Firestore Database 생성 (production mode)
3. `firestore.rules` 업로드
4. 웹 앱 추가 → SDK 설정값을 환경 변수에 입력

### 9.5 Cloudinary 설정

1. Cloudinary 계정 생성
2. Dashboard에서 Cloud Name, API Key, API Secret 확인
3. 환경 변수에 입력

---

## 10. 정적 에셋 (public/)

| 파일 | 용도 | 비고 |
|------|------|------|
| `nav-logo.png` | 네비게이션 로고 | 44×33px, PC에서만 표시 |
| `hero-bg.png` | 히어로 배경 | (선택사항) |
| `icon.png` | 파비콘 | |

---

## 11. 알려진 제한사항

1. **자동 투표 시작**: 관리자 페이지가 브라우저에 열려있을 때만 동작 (클라이언트 사이드 10초 폴링)
2. **1인 1표**: 브라우저 핑거프린트 기반 → 다른 브라우저/기기에서 중복 투표 가능
3. **관리자 인증**: sessionStorage 기반 → 탭 닫으면 로그아웃, 보안 수준 기본
4. **Firestore 보안 규칙**: contests 컬렉션이 공개 write 허용 → 프로덕션에서는 서버 사이드 인증 권장
