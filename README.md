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

## 🚀 Step-by-Step Installation Guide

Please follow these instructions sequentially to set up the project on your local machine.

<details open>
  <summary><b>Step 1: Clone the Repository</b></summary>
  <blockquote>
    Download the project source code to your local machine and navigate into the root directory.
  </blockquote>
  <pre><code>git clone &lt;repository-url&gt;<br/>cd Ecos</code></pre>
</details>

<details open>
  <summary><b>Step 2: Start the Database Infrastructure</b></summary>
  <blockquote>
    ECOS uses a local Supabase environment to run PostgreSQL. Start the Docker containers before running the application. <i>(Note: The first run may take a few minutes as Docker downloads the necessary images.)</i>
  </blockquote>
  <pre><code>cd infra/supabase<br/>docker compose up -d<br/>cd ../../</code></pre>
</details>

<details open>
  <summary><b>Step 3: Install Dependencies</b></summary>
  <blockquote>
    Install all required Node.js packages across the monorepo using <code>pnpm</code>.
  </blockquote>
  <pre><code>pnpm install</code></pre>
</details>

<details open>
  <summary><b>Step 4: Configure Environment Variables</b></summary>
  <blockquote>
    The server requires environment variables to connect to the database. We provide an example file containing the default local credentials.
  </blockquote>
  <pre><code>cd apps/server<br/>cp .env.example .env<br/>cd ../../</code></pre>
</details>

<details open>
  <summary><b>Step 5: Run Database Migrations</b></summary>
  <blockquote>
    Apply the database schema structure to your running PostgreSQL database and generate the Prisma Client.
  </blockquote>
  <pre><code>cd apps/server<br/>pnpm exec prisma migrate dev<br/>cd ../../</code></pre>
</details>

<details open>
  <summary><b>Step 6: Start the Application</b></summary>
  <blockquote>
    Boot up the backend server using Turborepo from the root of the project.
  </blockquote>
  <pre><code>pnpm run dev</code></pre>
</details>

<br />

<div align="center">
  <h3>🎉 You are all set!</h3>
  <p>Once the server is running successfully, you can explore the available API endpoints using our interactive Scalar documentation at:</p>
  <a href="http://localhost:6622/api/docs"><b>http://localhost:6622/api/docs</b></a>
</div>
