# Current Feature

## Status

**In progress** — started 2026-07-06 on `feature/global-store`.

### Goal
Introduce a shared, persisted global store package (`@pulse/store`) that both the shell
host and the federated remotes read/write, and surface it in the UI: a notification bell in
the shell header whose tooltip shows live "To do" / "In progress" task counts published by
the `tasks` remote. Demonstrates cross-MFE communication via a shared Zustand singleton
(§5, option 2) with state that survives a page refresh.

### In scope

**New package `packages/store` (`@pulse/store`)** — a shared federation singleton (same role
as `@pulse/auth`): all shell-owned client state lives here, built on Zustand with the
`persist` middleware (localStorage) so it survives refresh.
- `useTheme` — dark-mode store (moved out of `apps/shell/src/stores/theme.ts`), persisted,
  applies the `dark` class on `<html>` on rehydrate.
- `useWorkspaceStore` — active workspace id (moved out of `apps/shell/src/stores/workspace.ts`),
  persisted.
- `useNotificationStore` / `useTaskSummary` — task summary (`todo`, `inProgress`, `total`,
  `updatedAt`) written by the `tasks` remote, read by the shell header. Persisted.

**Shared UI primitive** — a generic `Tooltip` in `@pulse/ui` (hover + keyboard-focus,
`role="tooltip"`), no new dependency.

**Shell** — a `NotificationBell` header component (right side) using `Tooltip` + `Badge`
that reads `useTaskSummary()` and shows counts; unread badge reflects `todo + inProgress`.
Re-point `Layout.tsx` and `useWorkspaces.ts` to `@pulse/store`; delete the two old shell
store files.

**tasks remote** — publish its `todo` / `in_progress` / total counts into
`useNotificationStore` whenever its task query data changes.

**Federation** — add `@pulse/store` to the `shared` singletons list in the `shell` and
`tasks` vite configs so both share one store instance at runtime.

### Out of scope (later)
- The `@pulse/auth` store stays in `@pulse/auth` — it is coupled to the API client and is
  already its own federation singleton; not moved.
- Publishing summaries from `docs`/`team`/`admin`; richer notification feed / read state.
- Playwright E2E for the bell.

### Acceptance
- `pnpm install` + `pnpm typecheck` + `pnpm build` pass across all apps.
- Theme and active workspace persist across a refresh; task counts persist and update.
- Navigating `tasks` updates the shell's notification bell via the shared store, with no
  cross-`apps/*` import (communication is via `@pulse/store` only).
- CLAUDE.md shared-packages section updated to list `@pulse/store`.

## History

- **2026-07-06** — **Docs / Team / Admin surface** — *Done, merged to `main`.* Added backend
  modules `users` (profile + password change with session revocation, delegating to
  authService which owns UserModel), `docs` (tenant-scoped CRUD + `$text` search, parallel
  to tasks), `team` (enriched roster + invite/role-change/remove, delegating membership
  mutations to workspacesService), and `admin` (overview counts + settings rename +
  transactional cascade delete orchestrated across tasks/docs/workspaces services). New
  shared types `Doc`, `TeamMember`, `WorkspaceOverview`. Extended `@pulse/api-client` with
  `users`/`docs`/`team`/`admin` endpoint groups + schemas. Built federated MFEs `docs`
  (3003, two-pane editor), `team` (3004, roster management), `admin` (3005, overview +
  danger zone); registered all three in the shell (vite remotes, `remotes.d.ts`,
  RemoteMount, RemotePage, router, nav, env). 46/46 api tests, typecheck + build + lint
  green. Boundary rule honoured throughout: modules cross only via services, never each
  other's models.
- **2026-07-06** — **Vertical slice E2E** — *Done.* Stood up the PulseHQ monorepo as a
  genuinely working end-to-end slice (login → create workspace → CRUD tasks, browser → API
  → Mongo over real Module Federation), built to the production bar in `CLAUDE.md`.
  Delivered: monorepo (pnpm workspaces + Turborepo `dev`/`build`/`test`/`lint`/`typecheck`);
  shared `@pulse/{types,tsconfig,eslint-config}`; hardened `apps/api` (auth reference module
  with Argon2id + rotating/family-reuse-detected opaque refresh tokens + account lockout,
  workspaces, tenant-scoped tasks; full middleware stack; Dockerfile + compose +
  `.env.example`); FE packages `@pulse/{tailwind-config,ui,api-client,auth}`; federated
  `shell` host + `tasks`/`dashboard` remotes. `pnpm build` green (api + shell + tasks +
  dashboard), all typechecks pass, `@pulse/api` 17/17 integration tests pass. Live runtime
  boot against real Mongo deferred to the user (env vars first).
