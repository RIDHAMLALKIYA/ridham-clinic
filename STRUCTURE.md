# Project Structure Documentation

This document explains the organization of the codebase, which is designed for scalability and follows modern professional standards.

## Directory Overview

### `/app`

Contains the **Routing Layer**. Next.js App Router files (Pages, Layouts, APIs).

### `/components`

Contains the **UI Layer**.

- `ui/`: Reusable, atomic UI components (Buttons, Inputs).
- `Navbar.tsx`, `AnimatedWrapper.tsx`, etc.: Flat files for major structural components.

### `/db`

Contains the **Database Layer**.

- `index.ts`: Database connection client.
- `schema.ts`: Drizzle schema definitions.

### `/services`

Contains **Infrastructure Services**. These are external integrations or heavy utility services.

- `mail.ts`: Email service (Resend/Nodemailer).
- `scheduler.ts`: Appointment scheduling logic (QStash/Local Timer).

### `/lib`

Contains **Core Business Logic**.

- `actions/`: Domain-specific Server Actions (Auth, Appointment, Doctor).
- `auth.ts`: Authentication logic and session management.

### `/validations`

Contains **Data Validation Logic**.

- `appointment.validation.ts`: Schema and regex validators for appointment data.

### `/public`

Static assets (Images, Icons).

### `/drizzle`

Managed database migrations.

---

## Why this structure?

- **Root-level visibility**: High-level domains (db, services, validations) are immediately visible at the root.
- **Separation of Concerns**: UI, logic, database, and services are clearly decoupled.
- **Scalability**: New features can be added by creating new files in the existing folders without creating a mess.
