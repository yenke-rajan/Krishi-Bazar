# Fresh Tarkari (ताजा तरकारी)

Nepal's full-stack Agritech Marketplace — connecting farmers and wholesalers for fresh produce trade. Previously branded as KrishiBazar.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/krishibazar run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19 + Vite + wouter + shadcn/ui + TanStack Query
- i18n: react-i18next (English + Nepali)
- Auth: JWT (phone + password)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (users, catalog, orders, inventory_ledger)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/` — generated React Query hooks + Zod schemas (do not edit manually)
- `lib/api-zod/` — generated Zod schemas for server-side validation
- `artifacts/api-server/src/routes/` — Express route handlers (auth, catalog, orders, inventory)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT verify/sign + requireRole middleware
- `artifacts/krishibazar/src/` — React frontend (pages, contexts, components)
- `artifacts/krishibazar/src/i18n/` — Translation files (en.json, np.json)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → generated hooks + Zod schemas used everywhere
- JWT auth stored in `localStorage` under key `kb_token`; decoded on each `/api/auth/me` call
- Inventory stock = SUM(RECEIVED) − SUM(DELIVERED) per crop from ledger table
- Role enum: FARMER | WHOLESALER | ADMIN — enforced server-side via `requireRole` middleware
- i18n initialized in `LanguageContext` by importing `../i18n` (which calls `i18n.init()`)

## Product

- **Auth screens**: Login + two-step Register (role selection → details) with Nepali phone validation
- **Dashboard**: Personalized stats strip, quick-action tiles, order summary
- **Catalog**: Market produce list; admins can toggle stock availability
- **Orders**: Supply/demand orders with step-by-step dispatch/delivery tracking
- **Admin panel**: Tabbed interface for Orders, Catalog, and Inventory management

## Seed data

- Admin: phone `9800000000`, password `Admin@123`
- 8 vegetables in catalog: Tomato, Potato, Onion, Cabbage, Cauliflower, Spinach, Cucumber, Carrot (with Nepali names)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `AuthLayout` must NOT have `md:hidden` — the layout targets mobile design but must show on all viewports
- Run `pnpm --filter @workspace/db run push` after any schema change before restarting the API server
- Run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- Never import from deep paths like `@workspace/api-client-react/src/generated/...` — the barrel re-exports everything

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
