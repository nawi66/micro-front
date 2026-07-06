# Current Feature

## Status

**Built & verified** — Vertical slice E2E (2026-07-06). `pnpm build` green (api + shell +
tasks + dashboard), all typechecks pass, `@pulse/api` 17/17 integration tests pass. Live
runtime boot against real Mongo deferred to the user (setting env vars first).

### Goal
Stand up the PulseHQ monorepo as a genuinely working end-to-end slice, built to the
production-quality bar in `CLAUDE.md` / `project-overview.md`, rather than a broad shallow
skeleton. Login → create workspace → CRUD tasks works browser → API → MongoDB, over real
Module Federation.

### In scope
- **Monorepo**: pnpm workspaces + Turborepo pipeline (`dev`, `build`, `test`, `lint`, `typecheck`).
- **Shared packages**: `@pulse/types`, `@pulse/tsconfig`, `@pulse/eslint-config`.
- **Backend `apps/api`** (hardened, per §8–§9):
  - `config/` (Zod env, Mongo, Pino), `lib/` (errors, jwt, hash, crypto, cookies),
    `middleware/` (request-context, security, auth, tenant, rbac, validate, error).
  - Modules: **auth** (reference — Argon2id, JWT access + rotating opaque refresh with
    family reuse-detection, lockout), **workspaces**, **tasks** (tenant-scoped CRUD).
  - Integration tests via Supertest + mongodb-memory-server. Dockerfile + compose + `.env.example`.
- **FE packages**: `@pulse/ui`, `@pulse/auth`, `@pulse/api-client`, `@pulse/tailwind-config`.
- **Frontend apps**: `shell` host + `tasks` and `dashboard` federated remotes.

### Out of scope (later)
- MFEs: `docs`, `team`, `admin`. Backend modules: `users`, `docs`, `team`, `admin`.
- Email verification/reset delivery (schema + flow stubbed where noted), 2FA enforcement,
  Playwright E2E, `@pulse/utils`.

### Acceptance
- `pnpm install` + `pnpm build` + `pnpm typecheck` pass.
- `pnpm --filter @pulse/api test` green (auth + tenancy + tasks integration tests).
- Shell composes `tasks` + `dashboard` remotes; auth flow works against real API.

## History
- **2026-07-06** — Vertical slice E2E scaffolded from empty repo. Monorepo (pnpm + turbo);
  shared `@pulse/{types,tsconfig,eslint-config}`; hardened `apps/api` (auth reference module
  with Argon2id + rotating/family-reuse-detected refresh tokens + lockout, workspaces, tasks;
  full middleware stack; 17 Supertest integration tests; Dockerfile + compose); FE packages
  `@pulse/{tailwind-config,ui,api-client,auth}`; federated `shell` host + `tasks`/`dashboard`
  remotes. `pnpm build` + typechecks + api tests all green.
