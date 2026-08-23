<div align="center">
  <h1>🌿 ECOS Platform</h1>
  <p><strong>A robust, scalable health monitoring and management platform.</strong></p>
</div>

<hr />

## 📖 About the Project

ECOS is currently focused on providing a highly reliable backend infrastructure. The project is structured as a **monorepo** to allow for seamless future expansion (such as adding web or mobile frontends).

<h3>⚙️ Tech Stack</h3>
<ul>
  <li><b>Framework:</b> NestJS</li>
  <li><b>ORM:</b> Prisma 7 <i>(using <code>@prisma/adapter-pg</code>)</i></li>
  <li><b>Database:</b> PostgreSQL <i>(via Self-Hosted Supabase Docker)</i></li>
  <li><b>Architecture:</b> Turborepo Monorepo</li>
  <li><b>Documentation:</b> Scalar OpenAPI</li>
</ul>

<br />

## 🛠️ Prerequisites

Before you begin the installation, please ensure you have the following software installed on your machine. Click the links below for official installation guides:

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

<br />

## ⚠️ Development Guidelines & Warnings

> [!WARNING]
> **Be careful when modifying existing files!** This project follows a strict architecture (enforced by the rules in `AGENTS.md`). Before modifying any existing module, service, or configuration, ensure that your changes do not break downstream logic, types, or Docker builds. Always strive for non-invasive modifications.

<br />

## 🚀 Step-by-Step Installation Guide

Please follow these instructions sequentially to set up the project on your local machine.

<details open>
  <summary><b>Step 1: Clone the Repository</b></summary>

> Download the project source code to your local machine and navigate into the root directory.
>
> ```powershell
> git clone <repository-url>
> cd Ecos
> ```

</details>

<details open>
  <summary><b>Step 2: Start the Database Infrastructure</b></summary>

> ECOS uses a local Supabase environment to run PostgreSQL. Start the Docker containers before running the application. _(Note: The first run may take a few minutes as Docker downloads the necessary images.)_
>
> ```powershell
> cd infra/supabase
> docker compose up -d
> cd ../../
> ```

</details>

<details open>
  <summary><b>Step 3: Install Dependencies</b></summary>

> Install all required Node.js packages across the monorepo using `pnpm`.
>
> ```powershell
> pnpm install
> ```

</details>

<details open>
  <summary><b>Step 4: Configure Environment Variables</b></summary>

> The server requires environment variables to connect to the database. We provide an example file containing the default local credentials.
>
> ```powershell
> cd apps/server
> cp .env.example .env
> cd ../../
> ```

</details>

<details open>
  <summary><b>Step 5: Run Database Migrations</b></summary>

> Apply the database schema structure to your running PostgreSQL database and generate the Prisma Client.
>
> ```powershell
> cd apps/server
> pnpm exec prisma migrate dev
> cd ../../
> ```

</details>

<details open>
  <summary><b>Step 6: Start the Application</b></summary>

> There are two ways to run ECOS depending on your needs: Daily Development (Hot-Reloading) or Full Production Testing.
>
> **• Scenario A: Local Development (Recommended)**
>
> For daily coding, run the server natively so it instantly hot-reloads when you save a file. Make sure your database is running first (Step 2).
>
> ```powershell
> # Run from the root of the project
> pnpm run dev
> ```
>
> **• Scenario B: Full Production Docker Build**
>
> To test the compiled, containerized production version of the API alongside the database, use the root Docker Compose file.
>
> ```powershell
> # This will start BOTH Supabase and the compiled API in Docker
> docker compose up -d
> ```

</details>

<br />

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

<br />

<div align="center">
  <h3>🎉 You are all set!</h3>
  <p>Once the server is running successfully, you can explore the available API endpoints using our interactive Scalar documentation at:</p>
  <a href="http://localhost:6622/api/docs"><b>http://localhost:6622/api/docs</b></a>
</div>
