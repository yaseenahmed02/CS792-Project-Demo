"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Moon, Settings, Sun, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staffing", label: "Staffing", icon: Users },
  { href: "/audit", label: "Audit Log", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDarkMode() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ed-staffing-theme", next ? "dark" : "light");
  }

  return (
    <aside className="flex h-screen w-52 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <span className="text-sm font-medium text-foreground">
          ED Staffing
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm",
                isActive
                  ? "border-l-2 border-primary bg-primary/5 font-medium text-foreground"
                  : "border-l-2 border-transparent font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: dark mode toggle only */}
      <div className="border-t px-3 py-3">
        <button
          onClick={toggleDarkMode}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
