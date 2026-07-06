
## 1. What This Repo Contains

**PulseHQ** — a team productivity hub. One product to the end user, structured as:

- A **federated frontend**: a `shell` host app that composes independently developed and deployed MFEs (`dashboard`, `tasks`, `docs`, `team`, `admin`).
- A **REST monolith backend** (`apps/api`): single Node.js service, MongoDB, hardened for production.

Both live in a **Turborepo + pnpm workspaces** monorepo. Frontend is federated at runtime; backend is not. The backend is deliberately a monolith — modules are separated at the code level so they can be extracted later if load demands it, but they share one database, one process, one auth boundary, one deploy artifact. Most orgs don't need microservices, and the operational cost outweighs the benefit until real scaling pain shows up.

---

## 2. Repository Layout

```
pulsehq/
├── apps/
│   ├── shell/              # Frontend host — auth, layout, MFE loader
│   ├── dashboard/          # Frontend MFE (remote)
│   ├── tasks/              # Frontend MFE (remote)
│   ├── docs/               # Frontend MFE (remote)
│   ├── team/               # Frontend MFE (remote)
│   ├── admin/              # Frontend MFE (remote)
│   └── api/                # Backend REST monolith  ← NEW
│       ├── src/
│       │   ├── config/     # env, db, logger
│       │   ├── lib/        # errors, jwt, hash, cookies, crypto
│       │   ├── middleware/ # security, auth, tenant, rbac, validate, error
│       │   ├── modules/    # auth, users, workspaces, tasks, docs, team, admin
│       │   ├── app.ts
│       │   └── server.ts
│       ├── .env.example
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── package.json
│       └── tsconfig.json
├── packages/               # ALL UNCHANGED — no restructuring for the backend
│   ├── ui/                 # Shared React components (FE only)
│   ├── auth/               # Client auth provider + hooks (FE only)
│   ├── api-client/         # FE fetch wrapper (FE only)
│   ├── types/              # Domain TS types — also consumed by apps/api  ← shared
│   ├── utils/              # Pure utility fns (FE only)
│   ├── tailwind-config/    # Tailwind preset (FE only)
│   ├── tsconfig/           # Shared TS configs — also consumed by apps/api  ← shared
│   └── eslint-config/      # Shared ESLint configs — also consumed by apps/api  ← shared
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md               # this file
```

The API is just another workspace app under `apps/*`. It uses the same Turbo pipeline (`dev`, `build`, `test`, `lint`, `typecheck`) as the frontend apps. **No packages were renamed, moved, or restructured** to accommodate the backend.

Three packages happen to work for both sides — `types`, `tsconfig`, `eslint-config` — because they contain no framework-specific code. Everything else remains FE-only.

---

## 3. Tech Stack

### Frontend

| Concern         | Choice                                              |
| --------------- | --------------------------------------------------- |
| Bundler         | Vite 5                                              |
| Federation      | `@originjs/vite-plugin-federation`                  |
| Framework       | React 19 + TypeScript (strict)                      |
| Routing         | TanStack Router (per MFE; shell owns top-level)     |
| Data fetching   | TanStack Query                                      |
| Client state    | Zustand (per-feature stores)                        |
| Styling         | Tailwind CSS v4 with a shared preset                |
| Primitives      | Radix UI + `class-variance-authority`               |
| Forms           | React Hook Form + Zod                               |
| Auth (client)   | JWT (access in memory) + refresh via httpOnly cookie |
| Unit tests      | Vitest + React Testing Library                      |
| E2E             | Playwright (runs against the shell + api)           |

### Backend (`apps/api`)

| Concern              | Choice                                          |
| -------------------- | ----------------------------------------------- |
| Runtime              | Node.js 22 LTS                                  |
| Language             | TypeScript (strict, `noUncheckedIndexedAccess`) |
| HTTP framework       | Express 5                                       |
| Database             | MongoDB 7 via Mongoose 8                        |
| Validation           | Zod (env, request bodies, params, query)        |
| Auth                 | JWT access (15 min) + opaque refresh (30 days, DB-backed, rotating) |
| Password hashing     | Argon2id (`argon2` package)                     |
| Logging              | Pino (structured JSON) + pino-http              |
| Security headers     | Helmet + custom CSP                             |
| Mail                 | Nodemailer                                      |
| Tests                | Vitest + Supertest + mongodb-memory-server      |

**Cross-cutting non-negotiables** (both sides):
- TypeScript `strict: true` everywhere. No `any` without a `// eslint-disable-next-line` and a reason.
- Frontend: no cross-MFE imports. Shared code lives in `packages/`.
- Backend: no cross-module imports of internals. Modules talk via services or events, never each other's models.

---

## 4. Getting Started

```bash
pnpm install

# Start local infra for the API (Mongo)
docker compose -f apps/api/docker-compose.yml up -d mongo

# Copy env for the API and edit
cp apps/api/.env.example apps/api/.env

# Run everything: shell + all MFEs + api in parallel
pnpm dev

# Run only the frontend
pnpm dev --filter='./apps/*' --filter='!./apps/api'

# Run only the api (and what it depends on)
pnpm dev --filter=./apps/api...

# Run one MFE standalone + the api
pnpm dev --filter=./apps/tasks --filter=./apps/api
```

**Ports:**

| App        | Port |
| ---------- | ---- |
| shell      | 3000 |
| dashboard  | 3001 |
| tasks      | 3002 |
| docs       | 3003 |
| team       | 3004 |
| admin      | 3005 |
| api        | 4000 |

The shell reads `VITE_API_URL=http://localhost:4000` from its env. Each MFE reads the same in standalone dev mode.

---

## 5. Frontend: Microfrontend Composition

- Each remote MFE exports a single mount function and a route manifest from `src/bootstrap.tsx`.
- The shell's `vite.config.ts` declares each remote and shared singletons (`react`, `react-dom`, `@tanstack/react-query`, `@pulse/auth`, `@pulse/ui`).
- The shell lazy-loads remotes with `React.lazy` inside `<RemoteErrorBoundary />`. A failed remote must never break the shell.
- **Never** import from `apps/*` in another `apps/*`. Cross-MFE communication is: (1) URL/route params, (2) shared Zustand store exposed from `@pulse/auth`, (3) typed `window` events for fire-and-forget signals (last resort).
- Every MFE runs standalone with `VITE_MOCK_AUTH=true`, which short-circuits `@pulse/auth` with a fixture user.

## 6. Frontend: Shared Packages

### `@pulse/ui`
Component library. Radix + CVA. Every visual primitive lives here. Any component used in ≥2 MFEs belongs here — move it before writing it twice.

### `@pulse/auth`
Client-side auth. Exposes `<AuthProvider />`, `useAuth()`, `useUser()`, `RequireAuth`, `RequireRole`. Owns the in-memory access token. Wraps the API client's fetch to auto-refresh on 401.

### `@pulse/api-client`
Typed fetch wrapper. One `createClient({ baseUrl, getToken })` factory. All endpoints declared in `packages/api-client/src/endpoints/*.ts` with Zod response schemas. MFEs consume via TanStack Query hooks.

### `@pulse/tailwind-config`
Tailwind preset + design tokens. Every app extends this preset — no app defines its own colors.

### `@pulse/utils`
Pure functions and framework-agnostic hooks. No React components. No API calls.

### `@pulse/types` — also used by `apps/api`
Domain types (`User`, `Workspace`, `Task`, `Role`). Zero runtime code. When a new shared entity appears, its shape goes here.

### `@pulse/tsconfig` — also used by `apps/api`
Base TS configs. `base.json`, `react-library.json`, `node.json` (used by the api).

### `@pulse/eslint-config` — also used by `apps/api`
Flat configs: `react.js`, `node.js`.

## 7. Frontend: Coding & Styling

- Components: `PascalCase.tsx`, one per file. Hooks: `useThing.ts`. Utilities: `kebab-case.ts`.
- Imports: external → `@pulse/*` → relative. Never reach into a package's internals — only its public entry.
- Server state → TanStack Query. Never mirror into Zustand. Cross-component client state → Zustand slice. Local UI → `useState`.
- Styling: Tailwind utilities + `cn()` from `@pulse/ui`. Use tokens (`bg-surface`, `text-fg-muted`) not raw colors. Variants via CVA in `@pulse/ui`, not ad-hoc `className` chains in feature code. Dark mode is `class`-based, toggled from the shell.

---

## 8. Backend: Application Structure (`apps/api`)

**Module shape** — every module under `apps/api/src/modules/<name>/` follows this:

```
<name>.routes.ts       # thin — wires middleware + controller
<name>.controller.ts   # HTTP layer — parse req, call service, format res
<name>.service.ts      # domain logic — no Express types leak in
<name>.schema.ts       # Zod schemas for validation
<name>.model.ts        # Mongoose model(s)
<name>.test.ts         # integration tests via Supertest
```

Controllers never touch the DB directly. Services never see `Request`/`Response`. Routes contain no logic.

**Middleware order in `app.ts` matters** — do not reorder without understanding why:

```
1. trust proxy
2. request-context   ← generates requestId, attaches child logger
3. security          ← helmet, cors, hpp, body limits, cookie parser
4. pino-http         ← logs every request with the context from (2)
5. routes            ← /health, /auth, /workspaces/:id/…
6. 404 handler
7. error middleware  ← LAST — catches everything, never leaks
```

**Reference module**: `apps/api/src/modules/auth/` is complete and implements every pattern. Read it before adding a new module.

---

## 9. Backend: Security Posture

Everything in this section is non-optional.

### 9.1 Authentication

- **Access token**: JWT, HS256, 15-minute TTL. Stateless. Verified on every protected request.
- **Refresh token**: opaque random string (32 bytes, base64url), stored **hashed** (HMAC-SHA256 with a pepper) in `refresh_tokens`. 30-day TTL.
- **Refresh delivery**: `Set-Cookie: rt=…; HttpOnly; Secure; SameSite=Strict; Path=/auth`. Never in a response body. Never in localStorage.
- **Rotation**: every `/auth/refresh` returns a new access token AND rotates the refresh token. The old one is marked `revokedAt`.
- **Reuse detection**: refresh tokens are grouped by `familyId` at login. If a **revoked** refresh token is presented again, the entire family is revoked — the token was stolen and used after rotation. All sessions in that family are killed.
- **Password hashing**: Argon2id, `memoryCost: 19456, timeCost: 2, parallelism: 1` (OWASP baseline). Never MD5, SHA, or bcrypt with low cost.
- **Timing-safe comparison** for secret comparisons (`crypto.timingSafeEqual`).
- **Account lockout**: 10 failed logins for the same email in 15 min → 15-min lock. Tracked on the User document (`failedLoginAttempts`, `firstFailedAt`, `lockedUntil`) — reset on successful login. Login response is generic for both bad-credentials and locked-account states, so the lock is never revealed.
- **Email verification** required before login in production.
- **Password reset**: single-use token, 1-hour TTL, HMAC-hashed on disk. Success revokes every active session for the user.
- **2FA (TOTP)**: schema-ready in `user.model.ts`. Enforcement is a follow-up.

### 9.2 Authorization (RBAC + multi-tenancy)

Every business resource belongs to a **workspace**. There is no "user's task" — only "a task in workspace W that this user has access to."

- Membership: `workspace_members` holds `(userId, workspaceId, role)` where role ∈ `owner | admin | member | viewer`.
- Route guards compose in this exact order:
  ```ts
  router.post(
    '/workspaces/:workspaceId/tasks',
    requireAuth,                    // valid access JWT
    requireWorkspace,               // user is a member of :workspaceId
    requireRole('admin', 'member'), // has write permission
    validate({ body: createTaskSchema }),
    tasksController.create,
  );
  ```
- **Every Mongoose query on a tenant resource MUST filter by `workspaceId`.** No exceptions. Prefer:
  ```ts
  await Task.findOne({ _id: id, workspaceId: req.workspaceId });
  ```
  over
  ```ts
  const t = await Task.findById(id);
  if (t.workspaceId !== req.workspaceId) throw new ForbiddenError();
  ```
  The first can't be forgotten.

### 9.3 Input & Output

- Every route validates `body`, `params`, `query` with Zod via `validate()`. Schemas are `.strict()` — unknown fields reject.
- Mongoose schemas set `strict: 'throw'` — unknown fields on writes throw, not silently drop.
- ObjectId path params validated as ObjectId strings before hitting the DB.
- Response shapes are explicit — never `res.json(mongooseDoc)`. Use a `toDTO()` method on each model to strip internal fields (`__v`, password hashes, secrets).
- Body size limit: 100 kB JSON by default. Endpoints that need more (e.g. doc uploads) set their own limit locally.
- Mongoose is booted with `sanitizeFilter: true`, which strips `$`-prefixed operators from user-supplied filter values — belt-and-braces against NoSQL injection.

### 9.4 Transport & Headers

- **Helmet** with strict CSP. Even for a JSON API, set them.
- **CORS**: allowlist from `CORS_ORIGINS` env (comma-separated). No wildcards in prod. Credentials only for the shell origin.
- **HTTPS** enforced at the load balancer. `app.set('trust proxy', 1)` so `req.ip` is correct.
- **HSTS**: `max-age=31536000; includeSubDomains; preload`.
- **No `X-Powered-By`**.
- Refresh cookie is `SameSite=Strict` + `Path=/auth` — CSRF is mitigated for the only cookie in play. If you ever add a cookie for something else, add CSRF protection.
- **Rate limiting is expected at the edge** (nginx / Cloudflare / ALB / API Gateway), not in-app. The app protects auth endpoints via account lockout (§9.1); everything else relies on the gateway. If the API is ever exposed publicly without a gateway in front, revisit this.

### 9.5 Secrets & Config

- **Every** env var is validated by Zod in `apps/api/src/config/env.ts` at boot. Boot fails loudly on missing/invalid config — no defaults for secrets.
- `.env` is git-ignored. `.env.example` is the source of truth for what vars exist.
- Rotation: `JWT_ACCESS_SECRET` supports comma-separated values — first is used to sign, all are accepted for verify. Rotate by prepending a new one, then removing the old after 24h.
- No secret appears in a log line. Pino redaction covers: `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `set-cookie`, `totpSecret`, `resetToken`, `pepper`, `secret`.

### 9.6 Errors

- All errors flow through `apps/api/src/middleware/error.ts`. It:
  1. Logs with correlation id + stack.
  2. Maps known errors (`AppError`, Mongo validation, Zod, JWT) to safe HTTP responses.
  3. Unknown errors → `500 { error: 'internal_error', requestId }`. No message, no stack. The requestId lets support correlate.
- **Never** send a Mongoose validation error string to the client (can leak schema).
- **Never** send `err.message` unless the error is an `AppError` instance.

### 9.7 Logging & Observability

- One JSON line per request via pino-http. Fields: `requestId`, `userId`, `workspaceId`, `method`, `path`, `status`, `duration_ms`.
- `requestId` is generated in `request-context.ts` (or taken from `X-Request-Id` if the LB set one) and echoed in the response header.
- Business-critical events (login success/fail, workspace created, member added, role changed, password reset) emit a structured audit log at INFO.

### 9.8 Database Hygiene

- Connection: `retryWrites=true`, `w: 'majority'`, `readPreference: 'primaryPreferred'`, tuned pool.
- **Indexes declared in code** on the schema, synced at boot. Never rely on ad-hoc index creation.
- Every tenant-scoped collection has a compound index leading with `workspaceId`.
- Text search uses `$text` on declared text indexes — never regex on user input (ReDoS + no index).
- Multi-document writes run in sessions/transactions.
- `refresh_tokens.expiresAt` has a TTL index so expired tokens self-delete.

---

## 10. End-to-End Auth Flow

How the frontend and backend cooperate:

1. User submits login form in `shell` → POST `/auth/login`.
2. Backend validates, verifies password (Argon2), issues:
   - Access JWT (15 min) in the response body.
   - Refresh token in an httpOnly Secure SameSite=Strict cookie scoped to `Path=/auth`.
3. `@pulse/auth` on the client stores the access token **in memory only** (never localStorage). It sets it on the API client via `getToken`.
4. Every protected request from any MFE sends `Authorization: Bearer <access>`.
5. On 401, `@pulse/api-client` calls POST `/auth/refresh` (the cookie rides along automatically). Backend rotates the refresh token, returns a new access token. Client retries the original request once.
6. Two 401s in a row → sign out.
7. On logout, client calls POST `/auth/logout`. Backend revokes the current refresh token and clears the cookie.

**Reuse detection in action**: if a stolen refresh token is used after the legitimate client already rotated, the backend sees a **revoked** token being presented → revokes the entire family → forces re-login on every device. This is why we track `familyId`, not just per-token expiry.

---

## 11. What's Shared Between Frontend and Backend

Three workspace packages happen to work for both sides:

| Package               | What it holds                                | Used by                     |
| --------------------- | -------------------------------------------- | --------------------------- |
| `@pulse/types`        | Pure TS types (`User`, `Workspace`, `Task`)  | All FE apps + `apps/api`    |
| `@pulse/tsconfig`     | Base TS configs (`base`, `react`, `node`)    | All FE apps + `apps/api`    |
| `@pulse/eslint-config`| Flat ESLint configs (`react.js`, `node.js`)  | All FE apps + `apps/api`    |

Nothing else crosses the boundary. Everything in `packages/ui`, `packages/auth`, `packages/api-client`, `packages/utils`, `packages/tailwind-config` is React/browser code and is not consumable by the API.

**Future consideration (not done yet)**: today, Zod schemas for request validation live in `apps/api/src/modules/*/schema.ts`. Form validation on the frontend duplicates these. If duplication becomes painful, promote them to a new `packages/api-contracts` package containing schemas + inferred types — the FE gets form validation from the same source as BE request validation. Deferred until the pain justifies the move.

---

## 12. Adding Things — Playbooks

### Add a new frontend MFE
1. `pnpm turbo gen mfe` (or copy `apps/tasks/`).
2. Register its route + remote URL in `apps/shell/src/config/remotes.ts`.
3. Add its port to the table in section 4.
4. Add a Playwright smoke test navigating to its route from the shell.

### Add a shared frontend component
1. Build inside `packages/ui/src/<component>/`.
2. Export from `packages/ui/src/index.ts`.
3. Delete duplicated versions from any MFE that had one.

### Add a new backend endpoint
1. Add a Zod schema in `<module>.schema.ts`.
2. Add a service method — pure domain logic, throws `AppError` subclasses.
3. Add a controller method — calls service, returns via `res.json`.
4. Wire in `<module>.routes.ts` with the correct guard stack.
5. Add integration tests covering: happy path, auth-missing → 401, wrong-role → 403, cross-workspace access → 403, invalid input → 400.

### Add a new backend module
Copy `apps/api/src/modules/auth/` structure. Register the router in `apps/api/src/app.ts`. Add indexes on the model. Add tests.

### Add a shared domain type
Put it in `packages/types/`. Export from its `src/index.ts`. Both FE and BE pick it up automatically.

### Change an env var
- **FE**: add to the app's `.env.example`. If read at build time, prefix `VITE_`.
- **BE**: add to `apps/api/.env.example`, `apps/api/src/config/env.ts` (Zod), and the prod checklist in section 15. All three, same PR.

### Add a backend index
Declare it on the schema (`schema.index(...)`) — never rely on Compass auto-create.

---

## 13. Testing

**Frontend**
- Unit / component: colocated `*.test.tsx`. Vitest + RTL. Test behavior, not implementation.
- Package tests: `packages/*/src/**/*.test.ts`. Utils near 100% covered.
- E2E: Playwright specs in `e2e/`. Covers sign-in, create task, edit doc, invite member, upgrade plan. Runs against the real `apps/api`.

**Backend**
- Integration > unit. Test at the HTTP boundary via Supertest — you get the middleware stack for free.
- Every route needs at least: unauthenticated → 401, wrong workspace → 403, invalid body → 400, happy path → 2xx.
- Never use production Mongo. Tests spin up `mongodb-memory-server`.
- No `sleep()` in tests. If waiting on time (JWT expiry), inject a clock.

Turbo caches everything. Don't skip tests to "save time" — the results are already cached.

---

## 14. Commands Cheat Sheet

```bash
# Dev
pnpm dev                                        # everything
pnpm dev --filter=./apps/api...                 # api only + its deps
pnpm dev --filter=./apps/shell...               # shell + everything it depends on
pnpm dev --filter='./apps/*' --filter='!./apps/api'   # FE only

# Build / verify
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e                                        # Playwright, expects `pnpm dev` running

# Focused work
pnpm --filter @pulse/ui test
pnpm --filter @pulse/api test
pnpm --filter shell... build

# Backend local infra
docker compose -f apps/api/docker-compose.yml up -d       # mongo + api
docker compose -f apps/api/docker-compose.yml logs -f api

# Housekeeping
pnpm clean
pnpm changeset                                  # if publishing packages externally
```

---

## 15. Environment

### Frontend
Each app has its own `.env.example`. Common vars:
- `VITE_API_URL` — backend base URL (default `http://localhost:4000`)
- `VITE_MOCK_AUTH` — skip real auth in standalone MFE dev (default `false`)

### Backend
`apps/api/.env.example` is the source of truth. Every var is validated by Zod at boot.

**Production checklist before deploying `apps/api`:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_ACCESS_SECRET` ≥ 32 random bytes (`openssl rand -base64 48`)
- [ ] `REFRESH_TOKEN_PEPPER` ≥ 32 random bytes
- [ ] `MONGO_URI` uses TLS (`mongodb+srv://…`)
- [ ] `CORS_ORIGINS` lists only your shell's real origin(s), no `http://`
- [ ] Rate limiting configured at the edge (nginx / Cloudflare / ALB / API Gateway)
- [ ] `COOKIE_DOMAIN` set to your apex domain, `COOKIE_SECURE=true`
- [ ] SMTP creds present
- [ ] `LOG_LEVEL=info`
- [ ] Container runs as non-root user (Dockerfile already does this)

---

## 16. Deployment

**Frontend**: each MFE builds to a static bundle deployed to its own origin (CDN + S3, Cloudflare Pages, Vercel, etc.). The shell's `remotes` config points to the latest `remoteEntry.js` per MFE. Deploys are independent — updating `tasks` doesn't require redeploying the shell.

**Backend**: single containerized service. The `Dockerfile` in `apps/api/` produces a slim non-root image with a `/health` healthcheck. Point it at real MongoDB (Atlas or self-hosted with TLS) and populate env per the checklist above. Put a gateway or reverse proxy in front for TLS termination and rate limiting.

---

## 17. Guardrails for Claude

When working anywhere in this repo:

### General
1. **Read before writing.** Search `packages/` and the target `apps/*/src/` for an existing pattern before adding new. Don't recreate what's there.
2. **Small, reviewable diffs.** One concern per change. If a task grows, stop and propose a plan.
3. **Match existing patterns.** Before introducing a new library, check if the same problem is already solved with something installed.
4. **New dependency? Justify it.** Every dep is future maintenance and future CVEs.
5. **Update this file** when you add an MFE, a shared package, a module, or change a security-relevant convention.

### Frontend-specific
6. **Never import across `apps/*`.** Promote to `packages/` instead.
7. **Don't hand-roll auth or fetch logic.** Use `@pulse/auth` and `@pulse/api-client`.
8. **Don't invent colors or spacing.** Use tokens from `@pulse/tailwind-config`.
9. **`packages/ui` is where visual primitives live.** If it's used in ≥2 MFEs, move it there before writing it twice.

### Backend-specific
10. **Read `apps/api/src/modules/auth/` before adding a new module.** It is the reference.
11. **Never bypass a guard.** If a route needs data from another workspace, that's a design problem — surface it, don't `findById` around it.
12. **Every tenant-scoped query filters by `workspaceId` in the query itself**, not by post-hoc check.
13. **Never widen a Zod schema without a reason.** `.strict()` is there on purpose.
14. **Never log a request or response body wholesale.** Log field-selectively.
15. **New env var? Add it to `env.ts`, `.env.example`, AND the prod checklist in section 15.** All three, same PR.
16. **New index? Declare it on the schema.**

### Ask when uncertain
If the right home for code isn't obvious — new util, new type, new endpoint — ask before choosing. Getting the boundary wrong is more expensive to fix than getting the code wrong.

---