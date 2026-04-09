"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (contest.startTime) {
      const st = contest.startTime.toDate();
      setStartTime(toLocalDatetimeString(st));
    }
    if (contest.endTime) {
      const et = contest.endTime.toDate();
      setEndTime(toLocalDatetimeString(et));
    }
  }, [contest]);

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
      await updateContestTimes(
        contest.date,
        new Date(startTime),
        new Date(endTime)
      );
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
      </p>
    </div>
  );
}
