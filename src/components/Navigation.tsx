"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "투표" },
  { href: "/result", label: "결과" },
  { href: "/archive", label: "아카이브" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#1B3A5C] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg tracking-tight">
            한국AI콘텐츠연구소
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-[#2E75B6] text-white"
                    : "text-gray-300 hover:bg-[#2E75B6]/50 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
