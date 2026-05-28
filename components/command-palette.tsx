"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type CommandAsset = {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  environment: string;
  owner: string;
  region: string;
  domain: string;
  ipAddress: string;
  tags: string[];
};

type CommandAlert = {
  id: string;
  assetId: string | null;
  assetName: string | null;
  severity: string;
  title: string;
  type: string;
};

type CommandPaletteProps = {
  assets: CommandAsset[];
  alerts: CommandAlert[];
  canViewFinance?: boolean;
  canViewAutomation?: boolean;
};

type Command = {
  id: string;
  label: string;
  hint: string;
  group: "Navigate" | "Actions" | "Servers" | "Alerts";
  href: string;
  keywords: string;
};

const staticCommands: Command[] = [
  {
    id: "dashboard",
    label: "Go Dashboard",
    hint: "Operational overview",
    group: "Navigate",
    href: "/dashboard",
    keywords: "home overview metrics health activity",
  },
  {
    id: "assets",
    label: "Open Assets",
    hint: "Inventory and ownership",
    group: "Navigate",
    href: "/assets",
    keywords: "servers inventory search",
  },
  {
    id: "create-asset",
    label: "Create Asset",
    hint: "Add infrastructure",
    group: "Actions",
    href: "/assets/new",
    keywords: "new server domain cloud hosting",
  },
  {
    id: "monitoring",
    label: "Open Monitoring",
    hint: "Runtime health",
    group: "Navigate",
    href: "/dashboard#monitoring",
    keywords: "health online offline degraded checks",
  },
  {
    id: "finance",
    label: "Open FinOps",
    hint: "Cost intelligence",
    group: "Navigate",
    href: "/finance",
    keywords: "finance finops cost spending billing forecast renewal budget provider",
  },
  {
    id: "automation",
    label: "Open Automation",
    hint: "Operational workflows",
    group: "Navigate",
    href: "/automation",
    keywords: "automation workflows scheduled checks reminders escalations jobs runbooks",
  },
  {
    id: "teams",
    label: "Open Teams",
    hint: "Roles and governance",
    group: "Navigate",
    href: "/teams",
    keywords: "teams rbac roles permissions governance access members ownership",
  },
  {
    id: "vault",
    label: "Open Vault",
    hint: "Credential storage",
    group: "Navigate",
    href: "/assets?focus=vault",
    keywords: "credentials secrets passwords ssh search credentials",
  },
  {
    id: "alerts",
    label: "View Alerts",
    hint: "Active incidents",
    group: "Navigate",
    href: "/dashboard#alerts",
    keywords: "warning critical renewal incident",
  },
];

export function CommandPalette({
  assets,
  alerts,
  canViewFinance = true,
  canViewAutomation = true,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands = useMemo<Command[]>(() => {
    const assetCommands = assets.map((asset) => ({
      id: `asset-${asset.id}`,
      label: asset.name,
      hint: `${asset.type} / ${asset.provider}`,
      group: "Servers" as const,
      href: `/assets/${asset.id}`,
      keywords: `${asset.name} ${asset.provider} ${asset.owner} ${asset.type} ${asset.status} ${asset.environment} ${asset.region} ${asset.domain} ${asset.ipAddress} ${asset.tags.join(" ")}`,
    }));

    const alertCommands = alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      label: alert.title,
      hint: `${alert.severity} / ${alert.assetName ?? alert.type}`,
      group: "Alerts" as const,
      href: alert.assetId ? `/assets/${alert.assetId}` : "/dashboard#alerts",
      keywords: `${alert.title} ${alert.severity} ${alert.type} ${alert.assetName ?? ""}`,
    }));

    return [
      ...staticCommands.filter(
        (command) =>
          (command.id !== "finance" || canViewFinance) &&
          (command.id !== "automation" || canViewAutomation),
      ),
      ...assetCommands,
      ...alertCommands,
    ];
  }, [alerts, assets, canViewAutomation, canViewFinance]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return commands.slice(0, 12);
    }

    const tokens = normalized.split(/\s+/);
    return commands
      .map((command) => {
        const haystack = `${command.label} ${command.hint} ${command.keywords}`.toLowerCase();
        const score = tokens.reduce((sum, token) => {
          if (command.label.toLowerCase().startsWith(token)) return sum + 8;
          if (haystack.includes(token)) return sum + 3;
          return sum - 20;
        }, 0);

        return { command, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => item.command);
  }, [commands, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => {
          if (!value) {
            setQuery("");
            setSelectedIndex(0);
          }
          return !value;
        });
        return;
      }

      if (!open && event.key === "/" && !typing) {
        event.preventDefault();
        setQuery("");
        setSelectedIndex(0);
        setOpen(true);
        return;
      }

      if (open && event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  function updateQuery(value: string) {
    setQuery(value);
    setSelectedIndex(0);
  }

  function openPalette() {
    setQuery("");
    setSelectedIndex(0);
    setOpen(true);
  }

  function closePalette() {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function run(command: Command | undefined) {
    if (!command) return;
    closePalette();
    router.push(command.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="fixed bottom-4 left-4 z-40 inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/85 px-3 text-sm font-medium text-zinc-600 shadow-lg shadow-zinc-950/10 backdrop-blur transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 md:bottom-5 md:left-[17rem]"
      >
        <span className="text-zinc-400">Search</span>
        <kbd className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
          Ctrl K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/20 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={closePalette}
        >
          <div
            className="animate-in mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_90px_rgba(24,24,27,0.22)] backdrop-blur-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200/80 p-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((index) =>
                      Math.min(index + 1, results.length - 1),
                    );
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((index) => Math.max(index - 1, 0));
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    run(results[selectedIndex]);
                  }
                }}
                placeholder="Search commands, servers, alerts..."
                className="h-11 w-full rounded-xl border-0 bg-zinc-100/80 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:bg-zinc-100"
              />
            </div>

            <div className="max-h-[430px] overflow-y-auto p-2">
              {results.length > 0 ? (
                results.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => run(command)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      index === selectedIndex
                        ? "bg-zinc-950 text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {command.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          index === selectedIndex
                            ? "text-zinc-300"
                            : "text-zinc-500"
                        }`}
                      >
                        {command.hint}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${
                        index === selectedIndex
                          ? "bg-white/10 text-zinc-200"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {command.group}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-950">
                    No command found
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Try an asset name, alert severity, or route.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200/80 px-4 py-2 text-[11px] text-zinc-500">
              <span>Enter to open</span>
              <span>Esc to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CommandHint() {
  return (
    <Link
      href="/assets/new"
      className="inline-flex h-9 items-center rounded-xl bg-zinc-950 px-3 text-sm font-medium text-white shadow-sm shadow-zinc-950/15 transition hover:bg-zinc-800"
    >
      New asset
    </Link>
  );
}
