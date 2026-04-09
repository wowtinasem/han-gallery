import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword, updateAdminPassword } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    const adminPassword = await getAdminPassword();

    if (currentPassword !== adminPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호가 틀렸습니다." },
        { status: 401 }
      );
    }

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: "새 비밀번호는 4자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    await updateAdminPassword(newPassword);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
