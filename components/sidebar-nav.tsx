"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  shortcut: string;
  group: string;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <nav className="flex gap-2 overflow-x-auto p-3 md:flex-col md:gap-5 md:p-4">
      {groups.map((group) => (
        <div key={group} className="flex gap-2 md:flex-col md:gap-1">
          <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400 md:block">
            {group}
          </p>
          {items
            .filter((item) => item.group === group)
            .map((item) => {
              const [targetPathWithHash, targetQuery] = item.href.split("?");
              const targetPath = targetPathWithHash.split("#")[0];
              const queryMatches = targetQuery
                ? targetQuery.split("&").every((pair) => {
                    const [key, value] = pair.split("=");
                    return searchParams.get(key) === decodeURIComponent(value);
                  })
                : true;
              const active =
                pathname === targetPath && queryMatches;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex h-9 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition duration-150 md:items-center md:justify-between ${
                    active
                      ? "bg-zinc-950 text-white shadow-sm shadow-zinc-950/10"
                      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-950"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active
                          ? "bg-emerald-400"
                          : "bg-zinc-300 group-hover:bg-zinc-500"
                      }`}
                    />
                    {item.label}
                  </span>
                  <kbd
                    className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-medium md:inline-flex ${
                      active ? "bg-white/12 text-zinc-200" : "text-zinc-400"
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
