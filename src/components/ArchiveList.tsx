"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import { getContestList, getContestImages } from "@/lib/firestore";

const trophyEmoji = ["🥇", "🥈", "🥉"];
const rankColors = [
  { ring: "ring-yellow-400", badge: "bg-yellow-400 text-yellow-900" },
  { ring: "ring-gray-400", badge: "bg-gray-400 text-white" },
  { ring: "ring-orange-400", badge: "bg-orange-400 text-white" },
];

interface RankedImage extends ContestImage {
  rank: number;
}

function computeRankings(images: ContestImage[]): RankedImage[] {
  const sorted = [...images].sort((a, b) => b.voteCount - a.voteCount);
  const result: RankedImage[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].voteCount < sorted[i - 1].voteCount) {
      currentRank = i + 1;
    }
    result.push({ ...sorted[i], rank: currentRank });
  }
  return result;
}

function GalleryView({
  images,
}: {
  contest: (Contest & { id: string }) | null;
  images: ContestImage[];
}) {
  if (images.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        등록된 이미지가 없습니다.
      </div>
    );
  }

  const ranked = computeRankings(images);
  const podium = ranked.filter((img) => img.rank <= 3);
  const rest = ranked.filter((img) => img.rank > 3);

  const totalVotes = images.reduce((sum, img) => sum + img.voteCount, 0);
  const getPct = (count: number) =>
    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1/2/3위 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {podium.map((img) => {
            const cfg = rankColors[Math.min(img.rank - 1, 2)];
            return (
              <div
                key={img.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden ring-2 ${cfg.ring}`}
              >
                <div className="relative">
                  <Image
                    src={img.imageUrl}
                    alt={img.nickname}
                    width={0}
                    height={0}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="w-full h-auto"
                  />
                  <div className={`absolute top-2 left-2 ${cfg.badge} text-xs font-bold px-2.5 py-1 rounded-full`}>
                    {trophyEmoji[Math.min(img.rank - 1, 2)]} {img.rank}위
                  </div>
                </div>
                <div className="p-3 text-center">
                  <p className="font-bold text-sm text-gray-800">
                    #{String(img.number).padStart(2, "0")} {img.nickname}
                  </p>
                  <p className="text-xs text-orange-500 font-semibold mt-1">{getPct(img.voteCount)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 전체 작품 */}
      {rest.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-gray-500 text-center">
            전체 작품 ({images.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {rest.map((img) => (
              <div
                key={img.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <Image
                  src={img.imageUrl}
                  alt={img.nickname}
                  width={0}
                  height={0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  className="w-full h-auto"
                />
                <div className="p-3 text-center">
                  <p className="font-medium text-sm text-gray-800 truncate">
                    #{String(img.number).padStart(2, "0")} {img.nickname}
                  </p>
                  <p className="text-xs text-gray-400">{getPct(img.voteCount)}%</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ArchiveList() {
  const [archiveList, setArchiveList] = useState<(Contest & { id: string })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<(Contest & { id: string }) | null>(null);
  const [selectedImages, setSelectedImages] = useState<ContestImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const loadGallery = async (dateStr: string, contestList: (Contest & { id: string })[]) => {
    setSelectedDate(dateStr);
    setImagesLoading(true);
    try {
      const contest = contestList.find((c) => c.date === dateStr) || null;
      setSelectedContest(contest);
      const imgs = await getContestImages(dateStr);
      setSelectedImages(imgs);
    } catch (error) {
      console.error(error);
    } finally {
      setImagesLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const list = await getContestList();
        const ended = list.filter((c) => c.status === "ended");
        setArchiveList(ended);

        // 마지막 콘테스트 자동 선택
        if (ended.length > 0) {
          const latest = ended[0];
          const [y, m] = latest.date.split("-").map(Number);
          setCalendarYear(y);
          setCalendarMonth(m - 1);
          await loadGallery(latest.date, ended);
        }
      } catch (error) {
        console.error("Failed to load archive:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectDate = async (dateStr: string) => {
    if (selectedDate === dateStr) return;
    await loadGallery(dateStr, archiveList);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        갤러리를 불러오는 중...
      </div>
    );
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-6">
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
            <div key={d} className="py-2">
              {d}
            </div>
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
                  onClick={() => {
                    if (hasContest) handleSelectDate(dateStr);
                  }}
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
          <p className="text-center text-gray-400 text-sm mt-4">
            아직 완료된 콘테스트가 없습니다.
          </p>
        )}
      </div>

      {/* Gallery */}
      {selectedDate && (
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-4">
            {selectedDate} 콘테스트
          </h2>
          {imagesLoading ? (
            <div className="py-12 text-center text-gray-500">
              이미지를 불러오는 중...
            </div>
          ) : (
            <GalleryView contest={selectedContest} images={selectedImages} />
          )}
        </div>
      )}
    </div>
  );
}
