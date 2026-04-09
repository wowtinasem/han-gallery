import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "한콘연 AI이미지 콘테스트",
  description: "한콘연 AI이미지 콘테스트 투표 - 마음에 드는 AI 이미지 작품에 투표해주세요!",
  openGraph: {
    title: "한콘연 AI이미지 콘테스트",
    description: "마음에 드는 AI 이미지 작품에 투표해주세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "한콘연 AI이미지 콘테스트",
  },
  twitter: {
    card: "summary_large_image",
    title: "한콘연 AI이미지 콘테스트",
    description: "마음에 드는 AI 이미지 작품에 투표해주세요!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
