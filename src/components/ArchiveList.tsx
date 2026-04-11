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

      {/* Selected Date Contest */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-bold text-lg text-[#1B3A5C]">
              {selectedDate} 콘테스트
            </h3>
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
            <>
              {/* Top 3 Preview - 관리자 선정 순위 기준 */}
              {(() => {
                const rankedIds = [
                  selectedContest?.winnerId,
                  selectedContest?.secondPlaceId,
                  selectedContest?.thirdPlaceId,
                ].filter(Boolean);
                const top3 = rankedIds
                  .map((id) => selectedImages.find((img) => img.id === id))
                  .filter((img): img is ContestImage => !!img);
                const restImages = selectedImages.filter(
                  (img) => !rankedIds.includes(img.id)
                );

                return (
                  <>
                    {top3.length > 0 && (
                      <div className="grid grid-cols-3 gap-px bg-gray-100">
                        {top3.map((image, idx) => (
                          <div key={image.id} className="relative aspect-square">
                            <Image
                              src={image.imageUrl}
                              alt={image.nickname}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, 250px"
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md">
                              {trophyEmoji[idx]} {idx + 1}위
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-white text-xs font-medium truncate">
                                {image.nickname}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* All Images Grid */}
                    {restImages.length > 0 && (
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-3">
                          전체 작품 ({selectedImages.length}개)
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {restImages.map((img) => (
                            <div
                              key={img.id}
                              className="relative bg-gray-50 rounded-lg overflow-hidden"
                            >
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
                                <p className="text-[10px] text-gray-600 truncate">
                                  {img.nickname}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

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
