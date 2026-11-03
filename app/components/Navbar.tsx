
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Ana Sayfa", href: "/" },
  { name: "Türkiye Haritası", href: "/harita" },
  { name: "Karşılaştırma", href: "/karsilastir" },
  { name: "Hava Kalitesi", href: "/hava-kalitesi" },
  { name: "Favorilerim", href: "/favoriler" },
  { name: "Meteoroloji Rehberi", href: "/rehber" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`navbar-link ${
              pathname === item.href ? "navbar-active" : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
