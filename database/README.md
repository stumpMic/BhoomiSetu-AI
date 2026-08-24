# BhoomiSetu AI — Database Management

Database architecture, SQL DDL schemas, PostGIS geometry definitions, indexing strategies, and pre-seeded demonstration data.

## Directory Layout
- `schema/`: Table definitions (`tables.sql`), foreign key relationships (`relationships.sql`), performance indexes (`indexes.sql`), and PostGIS spatial extensions (`postgis.sql`).
- `seeds/`: Modular SQL seed data for projects, villages, cases, parcels, landowners, tasks, and grievances.
- `scripts/`: Zero-config SQLite / PostgreSQL initialization and verification scripts.
- `diagrams/`: ER diagrams and entity relationship documentation.

## Running Migrations & Seeds
```bash
# SQLite (Zero setup local run)
python scripts/seed_demo_data.py

# PostgreSQL
psql -U bhoomisetu_user -d bhoomisetu_db -f database/schema/tables.sql
```
