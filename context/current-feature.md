# Current Feature

## Status

**None in progress.** Last completed: **Architecture documentation (`context/architecture.md`)** — see History.

## History

- **2026-07-07** — **Architecture documentation** — *Done, merged to `main`.* Added
  `context/architecture.md`, a code-grounded walkthrough of the PulseHQ structure: the
  Turborepo layout + dev ports, the frontend Module Federation topology (shell host + five
  remotes, shared singletons), the three cross-MFE communication channels (`@pulse/store`,
  `@pulse/auth`, unused window events), the end-to-end auth flow, the backend request
  lifecycle + guard stack, and architectural watch items (shared-list drift, unused window
  channel) — with Mermaid diagrams and source-traced file references throughout. Registered
  the new doc in `CLAUDE.md`'s context-files list so it loads with project context.

- **2026-07-07** — **Shared global store (`@pulse/store`) + notification bell** — *Done, merged
  to `main`.* Introduced `packages/store` (`@pulse/store`), a persisted (Zustand + `persist`,
  localStorage) federation singleton shared by the shell and remotes: `useTheme` (dark mode,
  applies `dark` class on rehydrate) and `useWorkspaceStore` (active workspace id) moved out
  of `apps/shell/src/stores/{theme,workspace}.ts`, plus new `useNotificationStore` /
  `useTaskSummary` (`todo`, `inProgress`, `total`, `updatedAt`) for cross-MFE communication.
  Added a generic `Tooltip` primitive to `@pulse/ui` (hover + keyboard focus, `role="tooltip"`,
  no new dependency) and a shell `NotificationBell` header component (`Tooltip` + `Badge`)
  reading `useTaskSummary()`; the `tasks` remote publishes its todo/in-progress/total counts
  into `useNotificationStore` on query-data change. Re-pointed `Layout.tsx` and
  `useWorkspaces.ts` to `@pulse/store`, deleted the two old shell store files, and added
  `@pulse/store` to the shared singletons in the shell + tasks vite configs. Typecheck (12/12)
  and build (7/7) green; `@pulse/store` federating in both shell and tasks. Cross-MFE
  communication via the shared store only — no cross-`apps/*` import. Committed on
  `feature/global-store`, merged `--no-ff` to `main`, branch deleted, pushed to origin.

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
