
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const menuItems = [
  { name: "Ana Sayfa", href: "/" },
  { name: "Türkiye Haritası", href: "/harita" },
  { name: "Karşılaştırma", href: "/karsilastir" },
  { name: "Hava Kalitesi", href: "/hava-kalitesi" },
  { name: "Favorilerim", href: "/favoriler" },
  { name: "Meteoroloji Rehberi", href: "/rehber" },
  { name: "Hesabım ve Hava Postası", href: "/hesabim" },
  { name: "Yönetim Merkezi", href: "/admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const activeItem = menuItems.find((item) => item.href === pathname);

  useEffect(() => {
    if (!isOpen) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen]);

  return (
    <nav
      ref={navRef}
      className="main-navbar"
      aria-label="Ana menü"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false);
          toggleRef.current?.focus();
        }
      }}
    >
      <div className="navbar-container">
        <span className="navbar-current">{activeItem?.name ?? "Meteoroloji"}</span>
        <div className="navbar-actions">
        <Link href="/hesabim" className="navbar-account">Mail ile giriş</Link>
        <button
          ref={toggleRef}
          type="button"
          className="navbar-toggle"
          aria-expanded={isOpen}
          aria-controls="main-navigation-links"
          onClick={() => setIsOpen((value) => !value)}
        >
          Menü
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d={isOpen ? "m6 6 12 12M6 18 18 6" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
        </div>
        <div id="main-navigation-links" className="navbar-links" hidden={!isOpen}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={() => setIsOpen(false)}
            className={`navbar-link ${
              pathname === item.href ? "navbar-active" : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
        </div>
      </div>
    </nav>
  );
}
