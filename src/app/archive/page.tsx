"use client";

import ArchiveList from "@/components/ArchiveList";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10 bg-gradient-to-r from-[#030321] to-[#0a0a4a] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl sm:text-5xl font-bold text-center px-4">한콘연 오늘의 Best Image Top30</h1>
        <p className="text-xs sm:text-lg mt-2 mb-2 text-center px-4">매일 만나는 최고의 순간 | DAILY HIGH-RESOLUTION SELECTION</p>
        <h2 className="text-xl font-bold mb-2">갤러리</h2>
        <p className="text-blue-200">지난 콘테스트 기록을 확인하세요</p>
      </div>
      <ArchiveList />
    </div>
  );
}
