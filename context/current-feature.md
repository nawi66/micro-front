# Current Feature

## Status

**Done — merged to `main`** (2026-07-06). All four backend modules and three MFEs shipped
on `feature/docs-team-admin`, verified by the user, merged, and the branch deleted.
`pnpm typecheck` green (11 packages), `pnpm build` green (7 tasks: api + all 6 apps),
`pnpm lint` clean (only a pre-existing warning in `error.ts`), and
`pnpm --filter @pulse/api test` is 46/46 (was 17 — 29 new across docs/users/team/admin).
Live runtime boot against real Mongo remains deferred to the user (env vars first).

### Goal
Complete the product surface beyond the vertical slice. Build out the remaining federated
MFEs (`docs`, `team`, `admin`) and their backing REST modules (`users`, `docs`, `team`,
`admin`), each to the same production-quality bar as the `auth`/`workspaces`/`tasks` slice
already in place. Every module tenant-scoped, guarded, validated, and integration-tested.

### In scope

**Backend `apps/api` — new modules** (each follows the reference module shape in
`apps/api/src/modules/auth/`: routes → controller → service → schema → model → test):
- **users** — profile read/update, list workspace members, change own password. No
  cross-workspace leakage; user lookups scoped through workspace membership.
- **docs** — tenant-scoped CRUD for documents. `$text` index for search (never regex on
  input). Body-size limit raised locally for doc content.
- **team** — workspace member management: invite, list, change role, remove. Emits audit
  logs (member added, role changed) per §9.7. Owner/admin guarded.
- **admin** — workspace-level administration: settings, member overview, danger-zone
  actions. `requireRole('owner', 'admin')` throughout.

Each module: compound index leading with `workspaceId`; `toDTO()` stripping internal
fields; `.strict()` Zod schemas; guard stack `requireAuth → requireWorkspace →
requireRole(...) → validate(...)`. Integration tests cover: unauth → 401, wrong role →
403, cross-workspace → 403, invalid body → 400, happy path → 2xx.

**Frontend — new federated MFEs** (copy `apps/tasks/` structure; single mount fn + route
manifest from `src/bootstrap.tsx`):
- **docs** (port 3003) — document list + editor, backed by the docs module.
- **team** (port 3004) — member roster, invite/role UI, backed by the team module.
- **admin** (port 3005) — workspace settings + admin surface, backed by the admin module.

Each: registered in `apps/shell/src/config/remotes.ts`; consumes the API via
`@pulse/api-client` hooks (new endpoint files with Zod response schemas) + `@pulse/auth`
guards; visual primitives from `@pulse/ui`; standalone dev via `VITE_MOCK_AUTH=true`.

### Out of scope (later)
- Email verification/reset delivery, 2FA enforcement (schema-ready, deferred).
- Playwright E2E across the new MFEs, `@pulse/utils`.
- `packages/api-contracts` (shared Zod schemas FE↔BE) — deferred until duplication hurts.

### Acceptance
- `pnpm install` + `pnpm build` + `pnpm typecheck` pass across all apps.
- `pnpm --filter @pulse/api test` green, including new users/docs/team/admin suites.
- Shell composes all six remotes (`dashboard`, `tasks`, `docs`, `team`, `admin`) without a
  failed remote breaking the shell; auth + tenancy enforced end-to-end.
- CLAUDE.md port table + module list updated to reflect the new surface.

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
