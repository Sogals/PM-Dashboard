# Meridian PM — Desktop App

Local desktop application for tracking machine orders and project status. Replaces the Excel-based "Meridian Project Summary and Graphic Schedule" workbook.

## Requirements

- [Node.js](https://nodejs.org) v18 or later (only needed to run from source or build the installer)

## Quick Start (from source)

```bash
# 1. Install dependencies (one time only)
npm install

# 2. Start the app
npm start
```

On first launch the database is created and seeded automatically with sample data.

## Building a Windows Installer (.exe)

```bash
npm run build
```

Output: `build/Meridian PM Setup 1.0.0.exe`

Install it on any Windows machine — no Node.js required on the target machine.

## Data File Location

| Platform | Location |
|---|---|
| Windows | `%APPDATA%\Meridian PM\meridian-pm.db` |
| macOS | `~/Library/Application Support/Meridian PM/meridian-pm.db` |
| Dev mode | `desktop/meridian-pm.db` (next to main.js) |

Back up the `.db` file to preserve your data — it works like an Excel file.

## Pages

| Page | Description |
|---|---|
| Dashboard | KPI cards, active jobs, upcoming shipments, recent notes |
| All Orders | Full table with search, filter, and sort |
| Gantt Chart | Timeline view of all jobs from assembly → ship date |
| Job Detail | Baseball card + milestones, notes, options, risks |
| Admin | Manage machine types, statuses, and milestone templates |

## Re-seeding with Sample Data

To wipe and re-seed the development database:

```bash
# Delete the local DB first
rm meridian-pm.db

# Re-run seed
node db/seed.js
```
