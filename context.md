# Krishi-Bazar (कृषिबजार) — Project Context

## Overview

Full-stack agritech marketplace connecting farmers and wholesalers for fresh produce trade in Nepal. Farmers post supply orders; wholesalers post demand orders; admins manage inventory and the crop catalog.

**Primary deployment**: Replit (autoscale, Node.js 24 + PostgreSQL 16)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 |
| Package manager | pnpm (workspaces) |
| Backend | Express 5.2, Node.js 24 |
| Database | PostgreSQL 16 + Drizzle ORM 0.45 |
| Auth | JWT (7-day) + bcryptjs, role-based via `requireRole` middleware |
| Validation | Zod v3 (server-side) |
| Frontend | React 19, Vite 7, shadcn/ui, Tailwind CSS 4 |
| Routing | wouter 3 |
| Data fetching | TanStack React Query 5 |
| Forms | react-hook-form 7 |
| Charts | recharts 2 |
| Animations | framer-motion |
| i18n | react-i18next (English + Nepali) |
| Toasts | sonner |
| API contract | OpenAPI 3.1 → Orval (generates React Query hooks + Zod schemas) |

---

## Monorepo Structure

```
Krishi-Bazar/
├── artifacts/
│   ├── api-server/          # Express backend (port 8080)
│   └── krishibazar/         # React frontend (Vite)
├── lib/
│   ├── db/                  # Drizzle schema + migrations
│   ├── api-spec/            # openapi.yaml — source of truth for all API contracts
│   ├── api-zod/             # GENERATED — Zod schemas for server validation
│   └── api-client-react/    # GENERATED — React Query hooks + types
└── scripts/                 # Git hooks and utilities
```

> **Never edit** `lib/api-zod/` or `lib/api-client-react/` by hand. After changing `lib/api-spec/openapi.yaml`, regenerate with `pnpm --filter @workspace/api-spec run codegen`.

---

## Running Locally

### Prerequisites

- Node.js 24
- PostgreSQL 16
- pnpm (`npm install -g pnpm`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

Create a `.env` file (no `.env.example` exists — set these manually):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/krishi_bazar
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
PORT=8080
NODE_ENV=development
```

### 3. Set up the database

```bash
# Create your PostgreSQL database first, then push the schema:
pnpm --filter @workspace/db run push
```

This creates all tables and seeds:
- 8 vegetables (Tomato, Potato, Onion, Cabbage, Cauliflower, Spinach, Cucumber, Carrot)
- Admin user — phone: `9800000000`, password: `Admin@123`

### 4. Start development servers

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (http://localhost:5173)
pnpm --filter @workspace/krishibazar run dev
```

Access the app at `http://localhost:5173`.

---

## Other Useful Commands

```bash
# Type-check all packages
pnpm run typecheck

# Build everything
pnpm run build

# Push DB schema changes (dev only — non-destructive)
pnpm --filter @workspace/db run push

# Force-push DB schema (DESTRUCTIVE — drops/recreates tables)
pnpm --filter @workspace/db run push-force

# Regenerate API clients after openapi.yaml changes
pnpm --filter @workspace/api-spec run codegen
```

---

## Database Schema

| Table | Key columns |
|---|---|
| `users` | id, phone (unique), password_hash, full_name, role (FARMER\|WHOLESALER\|ADMIN) |
| `catalog` | id, crop_name, crop_name_np, category (VEGETABLE\|PICKLE), is_available |
| `orders` | id, order_id, client_id → users, crop_id → catalog, weight_kg, target_date_bs (Nepali BS date), layer_type (SUPPLY\|DEMAND), status |
| `inventory_ledger` | id, crop_id → catalog, delta_quantity, tracking_type (RECEIVED\|DELIVERED) |

**Stock formula**: `STOCK = SUM(delta where RECEIVED) − SUM(delta where DELIVERED)` per crop.

**Order status flow**: `ORDER_RECEIVED → DISPATCHED_TO_COLLECT → COLLECTED → DISPATCHED → DELIVERED`

---

## Authentication

- JWT stored in `localStorage` under key `kb_token`
- 7-day expiration; verified on each request via `requireRole` middleware
- Three roles: **FARMER** (supply orders), **WHOLESALER** (demand orders), **ADMIN** (full access)
- Phone format: Nepali (10 digits starting with 98xxx / 97xxx)

---

## Key Source Locations

| What | Where |
|---|---|
| Express routes | `artifacts/api-server/src/routes/` |
| Auth middleware | `artifacts/api-server/src/middlewares/auth.ts` |
| DB schema | `lib/db/src/schema/` |
| OpenAPI spec | `lib/api-spec/openapi.yaml` |
| React pages | `artifacts/krishibazar/src/pages/` |
| i18n translations | `artifacts/krishibazar/src/i18n/en.json`, `np.json` |
| Auth context | `artifacts/krishibazar/src/context/AuthContext.tsx` |
| Nepali date util | `artifacts/krishibazar/src/lib/bs-calendar.ts` |

---

## Gotchas

- **Node.js 24 required** — strict version constraint.
- **Run codegen after OpenAPI changes** — `lib/api-client-react/` and `lib/api-zod/` are generated, not hand-written.
- **Run DB push after schema changes** — before restarting the API server.
- **Import via barrel exports** — never import from deep paths like `@workspace/api-client-react/src/generated/...`.
- **`pnpm-workspace.yaml`** enforces a 1-day minimum release age for npm packages (supply-chain defense).
