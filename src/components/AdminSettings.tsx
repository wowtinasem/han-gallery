"use client";

import { useState, useEffect, useRef } from "react";
import { Contest } from "@/types";
import {
  updateContestStatus,
  updateContestTimes,
} from "@/lib/firestore";

interface AdminSettingsProps {
  contest: Contest & { id: string };
  onUpdate: () => void;
}

export default function AdminSettings({
  contest,
  onUpdate,
}: AdminSettingsProps) {
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

  // 자동 시작/종료: 10초마다 체크
  useEffect(() => {
    if (contest.status === "ended") return;

    const checkAutoTransition = async () => {
      const now = new Date();

      // pending → active: startTime 도달 시
      if (contest.status === "pending" && contest.startTime) {
        const st = contest.startTime.toDate();
        if (now >= st) {
          try {
            await updateContestStatus(contest.date, "active");
            onUpdate();
            return;
          } catch (error) {
            console.error("Auto-start failed:", error);
          }
        }
      }

      // active → ended: endTime 도달 시
      if (contest.status === "active" && contest.endTime) {
        const et = contest.endTime.toDate();
        if (now >= et) {
          try {
            await updateContestStatus(contest.date, "ended");
            onUpdate();
          } catch (error) {
            console.error("Auto-end failed:", error);
          }
        }
      }
    };

    checkAutoTransition();
    timerRef.current = setInterval(checkAutoTransition, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contest.status, contest.startTime, contest.endTime, contest.date, onUpdate]);

  function toLocalDatetimeString(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  const handleSaveTimes = async () => {
    if (!startTime || !endTime) {
      alert("시작 시간과 종료 시간을 모두 설정해주세요.");
      return;
    }
    const st = new Date(startTime);
    const et = new Date(endTime);
    if (et <= st) {
      alert("종료 시간은 시작 시간 이후여야 합니다.");
      return;
    }

    setSaving(true);
    try {
      await updateContestTimes(contest.date, st, et);

      // 시간 저장 후 자동 상태 결정 (이미 ended면 유지)
      if (contest.status !== "ended") {
        const now = new Date();
        if (now >= et) {
          // 종료 시간이 이미 지남
          await updateContestStatus(contest.date, "ended");
        } else if (now >= st) {
          // 시작 시간이 이미 지남 → 바로 투표 시작
          await updateContestStatus(contest.date, "active");
        } else {
          // 시작 시간 전 → 대기 (자동 시작 예약)
          await updateContestStatus(contest.date, "pending");
        }
      }

      alert("시간이 저장되었습니다. 설정된 시간에 자동으로 시작/종료됩니다.");
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

  // 상태 표시 텍스트
  const statusText = contest.status === "active"
    ? "투표 진행중"
    : contest.status === "ended"
      ? "투표 종료"
      : "준비중";

  const autoMessage = (() => {
    if (contest.status === "ended") return null;
    if (contest.status === "pending" && contest.startTime) {
      return "(시작 시간이 되면 자동으로 투표가 시작됩니다)";
    }
    if (contest.status === "active" && contest.endTime) {
      return "(종료 시간이 되면 자동으로 투표가 종료됩니다)";
    }
    return null;
  })();

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <h3 className="font-bold text-lg text-[#1B3A5C]">투표 시간 설정</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작 시간
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            종료 시간
          </label>
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
        <h4 className="font-medium text-gray-700 mb-3">수동 제어</h4>
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
        <span className="font-semibold">{statusText}</span>
        {autoMessage && (
          <span className="ml-2 text-blue-500">{autoMessage}</span>
        )}
      </p>
    </div>
  );
}
