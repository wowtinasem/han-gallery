"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import { getContestList, getContestImages } from "@/lib/firestore";

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
      setSelectedContest(null);
      setSelectedImages([]);
      return;
    }
    setSelectedDate(dateStr);
    setImagesLoading(true);
    try {
      const contest = archiveList.find((c) => c.date === dateStr) || null;
      setSelectedContest(contest);
      const imgs = await getContestImages(dateStr);
      setSelectedImages(imgs);
    } catch (error) {
      console.error(error);
    } finally {
      setImagesLoading(false);
    }
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

  const trophyEmoji = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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

        {/* Calendar Grid */}
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

      {/* Selected Date Contest - Gallery Style */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-bold text-lg text-[#1B3A5C]">
              {selectedDate} 콘테스트
            </h3>
            <Link
              href={`/archive/${selectedDate}`}
              className="text-sm text-[#2E75B6] hover:underline font-semibold"
            >
              상세보기 →
            </Link>
          </div>

          {imagesLoading ? (
            <div className="py-12 text-center text-gray-500">
              이미지를 불러오는 중...
            </div>
          ) : selectedImages.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              등록된 이미지가 없습니다.
            </div>
          ) : (
            <div className="p-4">
              {/* 관리자 선정 순위 배지 */}
              {(() => {
                const rankedIds = [
                  selectedContest?.winnerId,
                  selectedContest?.secondPlaceId,
                  selectedContest?.thirdPlaceId,
                ].filter(Boolean);
                const top3 = rankedIds
                  .map((id) => selectedImages.find((img) => img.id === id))
                  .filter((img): img is ContestImage => !!img);

                return top3.length > 0 ? (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {top3.map((img, idx) => (
                      <span key={img.id} className={`text-xs font-bold px-3 py-1 rounded-full ${
                        idx === 0 ? "bg-yellow-100 text-yellow-800" : idx === 1 ? "bg-gray-100 text-gray-700" : "bg-orange-100 text-orange-800"
                      }`}>
                        {trophyEmoji[idx]} {img.nickname}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* 이미지 갤러리 그리드 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {selectedImages.map((img) => {
                  const rank = selectedContest?.winnerId === img.id ? 1
                    : selectedContest?.secondPlaceId === img.id ? 2
                    : selectedContest?.thirdPlaceId === img.id ? 3 : 0;
                  const ringClass = rank === 1 ? "ring-2 ring-yellow-400" : rank === 2 ? "ring-2 ring-gray-400" : rank === 3 ? "ring-2 ring-orange-400" : "";

                  return (
                    <div
                      key={img.id}
                      className={`group relative rounded-lg overflow-hidden ${ringClass}`}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={img.imageUrl}
                          alt={img.nickname}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 33vw, 20vw"
                        />
                        {rank > 0 && (
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {trophyEmoji[rank - 1]} {rank}위
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 inset-x-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-[10px] font-semibold truncate">
                            #{String(img.number).padStart(2, "0")} {img.nickname}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                {selectedImages.length}개 작품
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
