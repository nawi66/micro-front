import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@pulse/auth";
import { Button, cn } from "@pulse/ui";
import { useTheme, useWorkspaceStore } from "@pulse/store";
import { useWorkspaces } from "../hooks/useWorkspaces.js";
import { NotificationBell } from "./NotificationBell.js";

const NAV = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/tasks", label: "Tasks", exact: false },
  { to: "/docs", label: "Docs", exact: false },
  { to: "/team", label: "Team", exact: false },
  { to: "/admin", label: "Admin", exact: false },
] as const;

function WorkspaceSwitcher() {
  const { workspaces } = useWorkspaces();
  const { activeId, setActive } = useWorkspaceStore();
  if (workspaces.length === 0) return null;
  return (
    <select
      value={activeId ?? ""}
      onChange={(e) => setActive(e.target.value)}
      className="h-9 rounded-md border border-glass-border bg-glass-raised px-2.5 text-sm text-fg backdrop-blur-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label="Active workspace"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-glass-border bg-glass p-3 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 px-2 py-1">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-fg">
            P
          </div>
          <span className="text-base font-semibold text-fg">PulseHQ</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-fg-muted hover:bg-surface hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-glass-border bg-glass px-5 backdrop-blur-xl">
          <WorkspaceSwitcher />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </Button>
            <span className="hidden text-sm text-fg-muted sm:inline">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}