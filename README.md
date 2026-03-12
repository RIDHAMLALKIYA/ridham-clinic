# HealthCore: Intelligent Clinic Management System

HealthCore is a high-performance, enterprise-grade clinic management solution built with **Next.js 15**, **Drizzle ORM**, and **PostgreSQL**. Designed for seamless patient workflows and automated reminder systems.

---

## 🏛 Architecture & Vision

This repository follows a **Clean Architecture** pattern, emphasizing separation of concerns and scalability.

- **Frontend**: Next.js 15 (App Router), Framer Motion, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Automation**: QStash for background scheduling
- **Communication**: Resend / SMTP for patient engagement

For a deep dive into our modular structure, see:

- 📂 **[System Workflow](./docs/PROJECT_WORKFLOW.md)**: Deployment, Automation, and Security patterns.
- 📐 **[Project Structure](./docs/STRUCTURE.md)**: Technical breakdown of the root-level architecture.

---

## 🚀 Key Features

- **Dynamic Patient Queue**: Live-updating check-in system with audio cues.
- **Smart Reminders**: Automated 30-minute and "Starting Now" email notifications via QStash.
- **Role-Based Access**: Specialized dashboards for Admins and Doctors.
- **Performance Optimized**: Built-in Prettier/ESLint configuration for consistent code quality.

---

## 🛠 Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL instance

### 2. Installation

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root based on your credentials:

- `DATABASE_URL`
- `RESEND_API_KEY`
- `QSTASH_TOKEN`

### 4. Database Sync

```bash
npm run db:push
```

### 5. Running the Engine

```bash
npm run dev
```

---

## 💎 Professional Standards

This project adheres to professional software engineering standards:

- **Consistent Styling**: Managed via Prettier.
- **Type Safety**: Full TypeScript integration across the stack.
- **Modular Actions**: Server actions split by business domain.
- **Validated Inputs**: Centralized validation logic in `/validations`.

---

_Built for excellence in healthcare administration._
