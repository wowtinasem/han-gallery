import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = await getAdminPassword();

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
