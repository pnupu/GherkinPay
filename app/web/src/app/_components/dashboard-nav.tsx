"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/agreements", label: "Agreements" },
  { href: "/milestones", label: "Milestones" },
  { href: "/compliance", label: "KYC / AML" },
  { href: "/relayers", label: "Relayers" },
  { href: "/activity", label: "KYT Monitor" },
  { href: "/audit", label: "Audit Log" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            className={`nav-link${isActive ? " nav-link-active" : ""}`}
            href={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
