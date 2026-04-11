"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "투표" },
  { href: "/result", label: "결과" },
  { href: "/archive", label: "갤러리" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#030321] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm sm:text-xl tracking-tight hover:text-[#2E75B6] transition-colors"
          >
            <Image
              src="/nav-logo.png"
              alt="한국AI콘텐츠연구소 로고"
              width={44}
              height={33}
              className="rounded hidden sm:block"
            />
            한국AI콘텐츠연구소
          </Link>
          <div className="flex bg-white/10 rounded-lg p-0.5 sm:bg-transparent sm:p-0 sm:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-base font-semibold transition-colors ${
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
