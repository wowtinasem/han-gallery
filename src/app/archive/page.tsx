"use client";

import ArchiveList from "@/components/ArchiveList";

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2E75B6] text-white py-10 text-center">
        <h1 className="text-3xl font-bold mb-2">아카이브</h1>
        <p className="text-blue-200">지난 콘테스트 기록을 확인하세요</p>
      </div>
      <ArchiveList />
    </div>
  );
}
