"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const TITLE_BY_PATH: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/staffing": "Staffing",
  "/audit": "Audit Log",
};

const UPDATE_INTERVAL_MS = 60_000;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function resolvePageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(TITLE_BY_PATH)) {
    if (pathname.startsWith(path)) return title;
  }
  return "ED Staffing";
}

export function Header() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(formatTime(new Date()));
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = resolvePageTitle(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-sm font-medium text-foreground">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {currentTime && (
          <span className="text-xs text-muted-foreground">{currentTime}</span>
        )}
        <span className="text-xs text-muted-foreground">Prototype</span>
      </div>
    </header>
  );
}
