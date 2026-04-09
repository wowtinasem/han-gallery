import { NextRequest, NextResponse } from "next/server";

const VERCEL_API = "https://api.vercel.com";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (currentPassword !== process.env.ADMIN_PASSWORD) {
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

    const token = process.env.VERCEL_API_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
      return NextResponse.json(
        { error: "서버 설정이 필요합니다. (VERCEL_API_TOKEN, VERCEL_PROJECT_ID)" },
        { status: 500 }
      );
    }

    // Get existing env var ID
    const listRes = await fetch(
      `${VERCEL_API}/v9/projects/${projectId}/env`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();
    const envVar = listData.envs?.find(
      (e: { key: string }) => e.key === "ADMIN_PASSWORD"
    );

    if (!envVar) {
      return NextResponse.json(
        { error: "환경변수를 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    // Update env var
    const updateRes = await fetch(
      `${VERCEL_API}/v9/projects/${projectId}/env/${envVar.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: newPassword }),
      }
    );

    if (!updateRes.ok) {
      return NextResponse.json(
        { error: "비밀번호 변경에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
