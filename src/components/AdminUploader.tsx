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

export default function AdminUploader({
  contestDate,
  existingCount,
  onUploadComplete,
}: AdminUploaderProps) {
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
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, nickname } : f))
    );
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

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

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

      // Cleanup
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
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-[#2E75B6] bg-blue-50"
            : "border-gray-300 hover:border-[#2E75B6]"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">
          {isDragActive
            ? "여기에 놓으세요!"
            : "이미지를 드래그하거나 클릭하여 선택하세요"}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          파일명이 &quot;닉네임_작품명.png&quot; 형식이면 닉네임이 자동 입력됩니다
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm"
            >
              <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image
                  src={f.preview}
                  alt="preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
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
              <button
                onClick={() => removeFile(idx)}
                className="text-red-400 hover:text-red-600 text-xl px-2"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-[#2E75B6] text-white rounded-xl font-semibold hover:bg-[#1B3A5C] transition-colors disabled:bg-gray-300"
          >
            {uploading
              ? `업로드 중... (${progress}/${files.length})`
              : `${files.length}개 이미지 업로드`}
          </button>
        </div>
      )}
    </div>
  );
}
