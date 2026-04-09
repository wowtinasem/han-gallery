"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Contest, ContestImage } from "@/types";
import {
  getLatestContest,
  createContest,
  getContestImages,
  deleteContestImage,
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
        alert("비밀번호가 변경되었습니다. 다음 배포 후 적용됩니다.");
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
                <h3 className="font-bold text-lg text-[#1B3A5C] mb-4">
                  업로드된 이미지 ({images.length}개)
                </h3>
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
      </div>
    </div>
  );
}
