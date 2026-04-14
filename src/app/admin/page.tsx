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
} from "@/lib/firestore";
import AdminUploader from "@/components/AdminUploader";
import AdminSettings from "@/components/AdminSettings";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [contest, setContest] = useState<(Contest & { id: string }) | null>(
    null
  );
  const [images, setImages] = useState<ContestImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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
    // 같은 날짜에 기존 콘테스트가 있으면 경고
    const existing = archiveList.find((c) => c.date === newDate);
    if (existing) {
      if (!confirm(`${newDate}에 이미 콘테스트가 있습니다.\n기존 이미지와 투표 데이터가 모두 삭제되고 새로 시작됩니다.\n\n계속하시겠습니까?`)) return;
    }
    try {
      await createContest(newDate);
      await loadContestData();
      await loadArchiveList();
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
      // If deleted contest was the current one, clear it
      if (contest?.date === date) {
        setContest(null);
        setImages([]);
      }
      await loadArchiveList();
      await loadContestData();
      alert("콘테스트가 삭제되었습니다.");
    } catch (error) {
      console.error("Delete error:", error);
      // Even on error, refresh the list to reflect any partial deletion
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
          <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6 text-center">
            관리자 로그인
          </h1>
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
          <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">
            콘테스트 관리
          </h3>
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
              현재 콘테스트: <span className="font-bold">{contest.date}</span> (
              {contest.status})
            </p>
          )}
        </div>

        {contest && (
          <>
            {/* Vote Settings */}
            <AdminSettings contest={contest} onUpdate={loadContestData} />

            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">
                이미지 업로드
              </h3>
              <AdminUploader
                contestDate={contest.date}
                existingCount={images.length}
                onUploadComplete={loadContestData}
              />
            </div>

            {/* Uploaded Images */}
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
                    <div
                      key={image.id}
                      className="relative bg-gray-50 rounded-lg overflow-hidden"
                    >
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
                        <p className="text-xs text-gray-600 truncate">
                          {image.nickname}
                        </p>
                        <p className="text-xs text-orange-500 font-semibold">
                          {image.voteCount}표
                        </p>
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

        {/* Archive Management - Calendar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">
            지난 콘테스트 관리
          </h3>

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
                <h4 className="font-semibold text-[#1B3A5C]">
                  {selectedDate} 콘테스트
                </h4>
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
                        <span className="text-sm font-bold text-[#1B3A5C]">
                          {c.date}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700"
                              : c.status === "ended"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {c.status === "active"
                            ? "진행중"
                            : c.status === "ended"
                              ? "종료"
                              : "준비중"}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            handleArchiveStatusChange(
                              c.date,
                              e.target.value as Contest["status"]
                            )
                          }
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
                          <p className="text-sm text-gray-500 text-center py-4">
                            등록된 이미지가 없습니다.
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {expandedImages.map((img) => (
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
                                  onClick={() =>
                                    img.id &&
                                    handleDeleteArchiveImage(c.date, img.id)
                                  }
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
