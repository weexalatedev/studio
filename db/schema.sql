-- Studio cloud sync schema (Neon Postgres, or any Postgres).
-- Run once against your database:
--   psql "$DATABASE_URL" -f db/schema.sql
-- or paste it into the Neon SQL editor.
--
-- One row per workspace. The sync token is never stored: only its SHA-256
-- hash, so a database leak does not expose the tokens your clients use.

create table if not exists studio_workspaces (
  token_hash text primary key,
  data jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);

