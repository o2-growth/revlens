"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function O2Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="8.5"
        stroke="var(--color-rl-oxy)"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function PainelIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M2 9.5h2.5l1.8-4.5 2.4 8 1.8-5.5 1.3 2h3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CallsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M2.5 4.5h12M2.5 8.5h12M2.5 12.5h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CoachingIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M8.5 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM5 14.5c.7-1.8 2-2.75 3.5-2.75s2.8.95 3.5 2.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M2.5 4.5h12M5 8.5h9.5M8 12.5h6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlaybookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M4 2.5h9v12H4a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 014 2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M5.5 5.5h5.5M5.5 8h5.5M5.5 10.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M8.5 2.5v8.5m0 0l-3-3m3 3l3-3M3 12.5v1a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5v-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { href: "/", label: "Painel", icon: PainelIcon, disabled: false },
  { href: "/calls", label: "Calls", icon: CallsIcon, disabled: false },
  { href: "/import", label: "Importar", icon: ImportIcon, disabled: false },
  { href: "/search", label: "Busca", icon: SearchIcon, disabled: false },
  { href: "/coaching", label: "Coaching", icon: CoachingIcon, disabled: false },
  { href: "/playbook", label: "Playbook", icon: PlaybookIcon, disabled: false },
  { href: "#", label: "Pipeline", icon: PipelineIcon, disabled: true },
];

export function Sidebar() {
  const activePath = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-rl-border bg-rl-canvas">
      <div className="flex items-center gap-2 px-5 py-5">
        <O2Mark />
        <span className="rl-display text-base text-rl-text">revlens</span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "#"
                ? false
                : item.href === "/"
                  ? activePath === "/"
                  : activePath.startsWith(item.href);
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <li key={item.label}>
                  <div className="flex cursor-default items-center justify-between rounded-rl-control px-3 py-2 text-sm text-rl-text-muted">
                    <span className="flex items-center gap-2.5">
                      <Icon />
                      {item.label}
                    </span>
                    <span className="rl-readout text-[9px] uppercase tracking-wide text-rl-text-muted">
                      em breve
                    </span>
                  </div>
                </li>
              );
            }

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-rl-control px-3 py-2 text-sm rl-t-hover transition-colors ${
                    isActive
                      ? "bg-rl-surface-1 text-rl-text"
                      : "text-rl-text-2 hover:bg-rl-surface-1 hover:text-rl-text"
                  }`}
                >
                  <span className={isActive ? "text-rl-oxy" : ""}>
                    <Icon />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-2.5 border-t border-rl-border px-5 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rl-surface-2 text-xs font-medium text-rl-text-2">
          GC
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm text-rl-text">Gabriela Costa</div>
          <div className="truncate text-xs text-rl-text-3">Gestor</div>
        </div>
      </div>
    </aside>
  );
}
