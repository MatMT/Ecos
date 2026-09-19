<div align="center">
  <h1>🌿 ECOS Platform</h1>
  <p><strong>A robust, scalable health monitoring and management platform.</strong></p>
</div>

<hr />

## 📖 About the Project

ECOS is a health-monitoring platform for schools/institutions: a mobile app for students, and a
clinical panel (web dashboards) for psychologists and administrators, all backed by one NestJS API
with Row-Level Security enforced at the database layer.

<h3>🗂️ Monorepo layout</h3>

| App | Path | Stack | Status |
|---|---|---|---|
| **API server** | `apps/server` | NestJS + Prisma 7 + self-hosted Supabase (Postgres + Auth) | Production-ready backend, all phases done |
| **Mobile app** | `apps/mobile` | Expo Router + React Native | Working app, talks to `server` |
| **Admin dashboard** | `apps/admin-web` | Next.js 16 | UI prototype, currently on mock data |
| **Therapist dashboard** | `apps/therapist-web` | Next.js 16 | UI prototype, currently on mock data |
| **Edge AI** | `apps/edge-ai` | Standalone Python scripts | ML-training experiments, not part of the pnpm workspace |

<h3>⚙️ Tech Stack</h3>
<ul>
  <li><b>Framework:</b> NestJS</li>
  <li><b>ORM:</b> Prisma 7 <i>(using <code>@prisma/adapter-pg</code>)</i></li>
  <li><b>Database:</b> PostgreSQL <i>(via Self-Hosted Supabase Docker)</i></li>
  <li><b>Auth:</b> Supabase Auth (GoTrue) + Postgres Row-Level Security</li>
  <li><b>Architecture:</b> Turborepo Monorepo</li>
  <li><b>Documentation:</b> Scalar OpenAPI</li>
</ul>

<br />

## 🛠️ Prerequisites

Before you begin, make sure you have the following installed. Click the links below for official
installation guides:

<table width="100%">
  <tr>
    <td width="33%" align="center">
      <a href="https://nodejs.org/en/download/">
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg" width="60" alt="Node.js" /><br />
        <b>Node.js</b> (v22+)
      </a>
    </td>
    <td width="33%" align="center">
      <a href="https://pnpm.io/installation">
        <img src="https://pnpm.io/img/pnpm-no-name-with-frame.svg" width="60" alt="pnpm" /><br />
        <b>pnpm</b> (v10+)
      </a>
    </td>
    <td width="33%" align="center">
      <a href="https://www.docker.com/products/docker-desktop/">
        <img src="https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png" width="60" alt="Docker" /><br />
        <b>Docker Desktop</b>
      </a>
    </td>
  </tr>
</table>

If you'll be running the mobile app on a physical phone, also install the **Expo Go** app
([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

<br />

## ⚠️ Development Guidelines & Warnings

> [!WARNING]
> **Be careful when modifying existing files!** This project follows a strict architecture (enforced by the rules in `AGENTS.md` and each app's own `AGENTS.md`). Before modifying any existing module, service, or configuration, ensure your changes don't break downstream logic, types, or Docker builds. Always prefer non-invasive modifications.

> [!WARNING]
> **Never run `prisma migrate dev`** in `apps/server` — it's permanently broken for this project (it rebuilds a shadow database that never has Supabase's `auth` schema, so it fails on the very first migration). Always use `prisma migrate deploy`. See the Installation guide's Step 5 below and `apps/server/AGENTS.md` §8 for the full explanation.

<br />

## 🔑 Environment variables — the three `.env` files

Configuration is split across three independent `.env` files. Every one of them has a matching
`.env.example` checked into the repo — **copy it, don't write one from scratch.**

<details>
  <summary><b>1. <code>infra/supabase/.env</code> — the self-hosted Supabase stack</b></summary>

> The full, exhaustive reference for every variable here lives in
> [`infra/supabase/CONFIG.md`](infra/supabase/CONFIG.md). The ones that actually matter for local
> development:
>
> | Variable | Purpose | For local dev... |
> |---|---|---|
> | `POSTGRES_PASSWORD` | Postgres superuser password | Leave as the placeholder unless you have a reason to change it |
> | `JWT_SECRET` | Symmetric key GoTrue signs tokens with | Leave as the placeholder |
> | `ANON_KEY` / `SERVICE_ROLE_KEY` | Pre-signed JWTs matching the placeholder `JWT_SECRET` above | Leave as the placeholder — **these are Supabase's well-known public local-dev demo keys**, safe only because nothing here is ever exposed outside your machine |
> | `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` | Basic-auth for Supabase Studio | Leave as the placeholder (`supabase` / `this_password_is_insecure_and_should_be_updated`) |
> | `SMTP_HOST` / `SMTP_PORT` | Where GoTrue sends recovery/confirmation emails | Already points at the bundled Mailpit catcher (`supabase-mail:2500`) — emails land at [http://localhost:8025](http://localhost:8025), nothing is ever really sent |
>
> **Rule of thumb:** for pure local development, copying `.env.example` to `.env` unmodified is
> enough — every default value is internally consistent. Only regenerate secrets
> (`sh utils/generate-keys.sh` from `infra/supabase/`) if this stack will ever be reachable from
> outside your machine.

</details>

<details>
  <summary><b>2. <code>apps/server/.env</code> — the NestJS API</b></summary>

> | Variable | Purpose | Action needed |
> |---|---|---|
> | `PORT` | API port | Leave as `6622` unless it conflicts locally |
> | `CORS_ALLOWED_ORIGINS` | Allowed browser origins | Leave commented — defaults already cover `admin-web`/`therapist-web`'s dev ports (9444/9443) |
> | `DATABASE_URL` | Prisma CLI connection (migrations), connects as the `postgres` superuser | Update the password only if you changed `POSTGRES_PASSWORD` in `infra/supabase/.env` |
> | `APP_DATABASE_URL` | Runtime connection (the app itself), connects as `authenticator` so RLS is enforced | Same password as `DATABASE_URL` — keep them in sync |
> | `SUPABASE_AUTH_URL` | GoTrue, reached through the API gateway | Leave as `http://localhost:8000/auth/v1` |
> | `SUPABASE_ANON_KEY` | Copy verbatim from `infra/supabase/.env`'s `ANON_KEY` | **Required** |
> | `SUPABASE_SERVICE_ROLE_KEY` | Copy verbatim from `infra/supabase/.env`'s `SERVICE_ROLE_KEY` — server-only, never expose to a client | **Required** |
> | `SUPABASE_JWT_SECRET` | Copy verbatim from `infra/supabase/.env`'s `JWT_SECRET` | **Required** |

</details>

<details>
  <summary><b>3. <code>apps/mobile/.env</code> — the Expo app</b></summary>

> | Variable | Purpose | Action needed |
> |---|---|---|
> | `EXPO_PUBLIC_API_URL` | Base URL of `apps/server`'s API | Leave unset for web / a simulator on this same machine (defaults to `http://localhost:6622`). For **Expo Go on a physical phone**, set this to your machine's LAN IP (`ipconfig` / `ifconfig`) instead — the phone's own `localhost` isn't this computer. |

</details>

<br />

## 🚀 Installation

Pick the path that matches your situation.

<details open>
<summary><h3>🆕 First-Time Setup (new machine, first clone)</h3></summary>

**Step 1 — Clone the repository**

```powershell
git clone <repository-url>
cd Ecos
```

**Step 2 — Configure and start the Supabase stack**

```powershell
cd infra/supabase
cp .env.example .env
docker compose up -d
cd ../..
```

_(The first run may take a few minutes while Docker pulls the images. See the "Environment
variables" section above — the defaults are fine to keep for local development.)_

**Step 3 — Install dependencies**

```powershell
pnpm install
```

**Step 4 — Configure the server and mobile app**

```powershell
cd apps/server
cp .env.example .env
cd ../mobile
cp .env.example .env
cd ../..
```

Open `apps/server/.env` and copy the actual `ANON_KEY`, `SERVICE_ROLE_KEY`, and `JWT_SECRET`
values from `infra/supabase/.env` into `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_JWT_SECRET` respectively (if you left the Supabase `.env` at its defaults, the server's
`.env.example` placeholders already match — no edit needed).

**Step 5 — Run database migrations**

```powershell
cd apps/server
pnpm exec prisma migrate deploy
cd ../..
```

> Always use `migrate deploy`, never `migrate dev` — see the warning above.

**Step 6 — Bootstrap the first administrator**

The API only lets an existing administrator create new users, so the very first one has to be
created directly against the database:

```powershell
cd apps/server
pnpm exec ts-node -r tsconfig-paths/register prisma/seed.ts admin@example.com "SomeStrongPassword1!" "Your Name"
cd ../..
```

_(An optional 4th argument sets `institutionId` if you already have one — omit it and the admin is
created with no institution, which is fine to start with.)_

**Step 7 — (Optional) Seed realistic demo data**

For a fully populated environment (2 institutions, admins, psychologists, students, appointments,
alerts, clinical notes, etc.) instead of an empty database:

```powershell
cd apps/server
pnpm run seed:demo
cd ../..
```

This is idempotent — safe to re-run any time — and prints a set of demo logins at the end, all
sharing the password `Seed1234!`. It refuses to run against anything that isn't a `localhost`
database, and is test data only.

**Step 8 — Start the app(s) you need**

See the "Running the apps" section below.

</details>

<details>
<summary><h3>🔁 Reinstalling / Updating an existing setup</h3></summary>

**A. Just pulling new changes (the common case)**

```powershell
git pull
pnpm install
cd infra/supabase && docker compose up -d && cd ../..   # no-op if already running
cd apps/server && pnpm exec prisma migrate deploy && cd ../..  # applies only new migrations
```

Then restart whichever dev server(s) you were running.

**B. Full reset (wipe the local database and start clean)**

Use this if your local Supabase/Postgres state is corrupted, or you want a truly empty database
again.

```powershell
cd infra/supabase
docker compose down -v   # ⚠️ deletes all local data — Postgres volumes included
docker compose up -d
cd ../server
pnpm exec prisma migrate deploy
```

A wiped database has no administrator anymore — repeat **Step 6** (and optionally **Step 7**) from
the first-time guide above before anything else will work.

</details>

<br />

## ▶️ Running the apps

<table>
<tr><th>Goal</th><th>Command</th><th>URL</th></tr>
<tr>
  <td>Backend only <i>(most common — the two dashboards are still on mock data)</i></td>
  <td><code>pnpm --filter server dev</code></td>
  <td>http://localhost:6622</td>
</tr>
<tr>
  <td>Mobile app</td>
  <td><code>pnpm --filter mobile dev</code> <i>(then press <code>w</code> for web, or scan the QR code with Expo Go)</i></td>
  <td>—</td>
</tr>
<tr>
  <td>Admin dashboard</td>
  <td><code>pnpm --filter admin-web dev</code></td>
  <td>http://localhost:9444</td>
</tr>
<tr>
  <td>Therapist dashboard</td>
  <td><code>pnpm --filter therapist-web dev</code></td>
  <td>http://localhost:9443</td>
</tr>
<tr>
  <td>Everything at once</td>
  <td><code>pnpm run dev</code> <i>(from the repo root)</i></td>
  <td>all of the above</td>
</tr>
<tr>
  <td>Full production Docker build <i>(server + Supabase, containerized)</i></td>
  <td><code>docker compose up -d</code> <i>(from the repo root)</i></td>
  <td>http://localhost:6622</td>
</tr>
</table>

> [!NOTE]
> `pnpm run dev` runs Turborepo's `dev` task for **every** workspace app that defines one — server,
> mobile, admin-web, and therapist-web all start together. Use `pnpm --filter <app> dev` to start
> just one.

> [!NOTE]
> The root `docker compose up -d` builds `apps/server`'s Docker image and points it at the
> Supabase stack's internal Docker hostname — if you changed `POSTGRES_PASSWORD` away from its
> default in `infra/supabase/.env`, update the matching `DATABASE_URL` line in the root
> `docker-compose.yml` to match.

<br />

## 🗄️ Database Management

ECOS provides two built-in visual interfaces to manage your local database during development:

<details>
  <summary><b>1. Supabase Studio (Full Database Admin)</b></summary>

> The official Supabase dashboard running locally. Perfect for managing database roles, raw SQL, and deep metrics.

- **URL:** [http://localhost:8000](http://localhost:8000)
- **Username:** `supabase`
- **Password:** `this_password_is_insecure_and_should_be_updated`

</details>

<details>
  <summary><b>2. Prisma Studio (Data & Schema Explorer)</b></summary>

> A lightweight, fast visual editor directly tied to your `schema.prisma` models. Perfect for quickly editing rows and exploring relations.
>
> To start it, open a new terminal window and run:
>
> ```powershell
> cd apps/server
> pnpm exec prisma studio
> ```

- **URL:** Automatically opens at [http://localhost:5555](http://localhost:5555) (or check the terminal output for the dynamic port).

</details>

<details>
  <summary><b>3. Mailpit (local email catcher)</b></summary>

> GoTrue's password-recovery and confirmation emails are never really sent in local dev — they land
> in a bundled Mailpit inbox instead, so you can click the links yourself.

- **URL:** [http://localhost:8025](http://localhost:8025)

</details>

<br />

## ✅ Testing

From `apps/server`:

```powershell
pnpm test        # unit tests (mocked Prisma/RLS)
pnpm test:e2e    # e2e tests — exercises REAL Postgres RLS; requires the Supabase stack running
```

<br />

<div align="center">
  <h3>🎉 You are all set!</h3>
  <p>Once the server is running successfully, you can explore the available API endpoints using our interactive Scalar documentation at:</p>
  <a href="http://localhost:6622/api/docs"><b>http://localhost:6622/api/docs</b></a>
</div>
