"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "투표" },
  { href: "/result", label: "결과" },
  { href: "/archive", label: "아카이브" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#030321] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight hover:text-[#2E75B6] transition-colors"
          >
            <Image
              src="/nav-logo.png"
              alt="한국AI콘텐츠연구소 로고"
              width={44}
              height={33}
              className="rounded"
            />
            한국AI콘텐츠연구소
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-md text-base font-semibold transition-colors ${
                  pathname === item.href
                    ? "bg-white text-[#1B3A5C]"
                    : "text-gray-300 hover:bg-white hover:text-[#1B3A5C]"
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
