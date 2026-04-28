# Project Structure Documentation

This document explains the organization of the codebase, which is designed for scalability and follows modern professional standards.

## Directory Overview

### `/app`

Contains the **Routing Layer**. Next.js App Router files (Pages, Layouts, APIs).

### `/components`

Contains the **UI Layer**.

- `layout/`: Layout wrappers, loaders, and navigation components.
- `providers/`: Context providers (Theme, Sound).
- `shared/`: Generic shared components (Toggles, Notifiers).
- `ui/`: Reusable, atomic UI components (Buttons, Inputs).

### `/db`

Contains the **Database Layer**.

- `index.ts`: Database connection client.
- `schema.ts`: Drizzle schema definitions.

### `/lib`

Contains **Core Business Logic and Infrastructure**.

- `actions/`: Domain-specific Server Actions (Auth, Appointment, Doctor).
- `services/`: External integrations (Mail, Scheduler).
- `validations/`: Data validation schemas and regex.
- `auth.ts`: Authentication logic and session management.

### `/public`

Static assets (Images, Icons).

### `/drizzle`

Managed database migrations.

---

## Why this structure?

- **Separation of Concerns**: UI, logic, database, and services are clearly decoupled.
- **Root-level cleanliness**: By moving integrations and validatons to `/lib`, the root directory stays dedicated to config and app structure.
- **Scalability**: New features can be added by creating new files in the existing folders without creating a mess.
