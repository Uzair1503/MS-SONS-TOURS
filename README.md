# MS Sons Tours - Hajj & Umrah Booking Website

Full-stack Hajj & Umrah travel booking website with a React frontend, Node.js/Express API, PostgreSQL database, Redis cache, and an admin panel for managing packages, hotels, airlines, room types, inquiries, and site settings.

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui-style components, React Query, React Router, Framer Motion

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, Kafka (async events)

**DevOps:** Docker, docker-compose, Nginx (frontend proxy)

## Project Structure

```
├── backend/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma    # DB schema
│   │   └── seed.ts          # Seed data (admin, packages, hotels, airlines)
│   └── src/
│       ├── config/          # Config, prisma client, redis, kafka
│       ├── controllers/     # Route handlers
│       ├── routes/          # API route definitions
│       ├── services/        # Business logic
│       ├── repositories/    # Data access layer
│       ├── middleware/      # Auth, error handler, rate limiting
│       ├── validators/      # Input validation
│       ├── cache/           # Redis cache layer
│       ├── events/          # Kafka events
│       └── types/           # Shared types
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # UI, layout, shared, package components
│       ├── pages/           # Public pages
│       ├── pages/admin/     # Admin panel pages
│       ├── hooks/           # React Query hooks
│       ├── context/         # Auth context
│       ├── services/        # API client
│       ├── lib/             # Utilities
│       └── types/           # Shared types
├── docker-compose.yml       # Full stack locally
├── .env.example             # Compose env template - copy to .env (git-ignored)
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional; falls back to in-memory cache)
- Docker + Docker Compose (optional, for containerized setup)

## Quick Start (Local)

### 1. Backend

```bash
cd backend
npm install

# Copy env config
cp .env.example .env
# Edit .env with your DB/Redis credentials

# Setup database
npx prisma db push
npm run db:seed

# Start dev server (port 5000)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Start dev server (port 5173, proxies /api to localhost:5000)
npm run dev
```

Open http://localhost:5173

### 3. Admin Panel

- URL: http://localhost:5173/admin/login
- Default credentials: `admin@mssons.com` / `admin123` (change after first login)

## Docker Quick Start

`docker-compose.yml` interpolates its variables from a `.env` file at the **project root** (not `backend/.env`). Create it **before** starting, or `docker compose config` will fail fast:

```bash
# 1. Create the template (the real .env is git-ignored, never committed)
cp .env.example .env

# 2. Generate a strong JWT secret
openssl rand -base64 48
# ...then edit .env and paste the output as: JWT_SECRET=<generated value>
```

Then start the stack:

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, Kafka, Zookeeper, the API (port 5000), and the frontend (port 5173).

The backend **refuses to start** if `JWT_SECRET` is missing or still the placeholder while `NODE_ENV=production`, and `docker compose config` fails fast when `JWT_SECRET` is unset - so the insecure default can never silently reach production.

## Environment Variables

- Compose-level variables (`JWT_SECRET`, `FRONTEND_URL`, `SITE_URL`, `FRONTEND_PORT`): see the root `.env.example`.
- Backend variables: see `backend/.env.example`. Key variables:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/ms_sons_tours` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection (optional) |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka brokers (optional) |
| `JWT_SECRET` | *(required)* | Secret for admin JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Admin token lifetime |
| `WHATSAPP_NUMBER` | `923713011519` | WhatsApp number for leads |

## Key Features

- **Public Site:** Home, Packages (14/21 day Umrah), Package Details, Hotels, Airlines, Price Calculator, Booking form, About, Contact, FAQ
- **WhatsApp Integration:** Booking/inquiry forms generate pre-filled WhatsApp messages to `+92 371 3011519`
- **Admin Panel:** Dashboard stats, Packages CRUD, Hotels CRUD, Airlines CRUD, Room Types CRUD, Inquiry management, Site settings
- **Caching:** Redis-backed cache for packages/hotels/airlines queries with invalidation on admin writes
- **Async Events:** Kafka events emitted on inquiry create / price calculation (gracefully disabled if Kafka is down)
- **API:** REST on `/api/v1` with validation, rate limiting, and JWT-protected admin routes

## Scripts

### Backend (`backend/`)
- `npm run dev` – dev server with watch
- `npm run build` – compile TypeScript
- `npm start` – run compiled output
- `npx prisma db push` – sync schema (no migration files)
- `npm run db:seed` – seed database
- `npm run db:seed:clean` – reset and reseed

### Frontend (`frontend/`)
- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build