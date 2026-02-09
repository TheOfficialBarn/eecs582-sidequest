# Environment Variables Used in the Project

This document lists ALL environment variables used in the eecs582-sidequest project.

## Summary

The project uses **5 unique environment variables** in total.

## Complete List of Environment Variables

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Type**: Public (exposed to browser)
- **Purpose**: Supabase project URL
- **Usage Locations**:
  - `side-quest/lib/supabase/client.js` (line 5)
  - `side-quest/lib/supabase/server.js` (line 9)
  - `side-quest/lib/supabase/admin.js` (line 5)
  - `side-quest/scripts/check_schema.mjs` (line 4)
  - `side-quest/scripts/setup_storage.mjs` (line 4)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type**: Public (exposed to browser)
- **Purpose**: Supabase anonymous/public API key for client-side operations
- **Usage Locations**:
  - `side-quest/lib/supabase/client.js` (line 6)
  - `side-quest/lib/supabase/server.js` (line 10)

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Type**: Secret (server-side only)
- **Purpose**: Supabase admin/service role key for privileged operations
- **Usage Locations**:
  - `side-quest/lib/supabase/admin.js` (line 6)
  - `side-quest/scripts/check_schema.mjs` (line 5)
  - `side-quest/scripts/setup_storage.mjs` (line 5)

### 4. AUTH_SECRET
- **Type**: Secret (server-side only)
- **Purpose**: Secret key for signing authentication tokens (HMAC SHA-256)
- **Usage Locations**:
  - `side-quest/lib/auth.js` (line 15)
- **Note**: Has a fallback value of `"missing-secret"` for development (should be set in production)

### 5. DB_PASSWORD
- **Type**: Secret (server-side only)
- **Purpose**: PostgreSQL database password for direct database migrations
- **Usage Locations**:
  - `side-quest/scripts/run_migration.js` (line 4)
  - `side-quest/scripts/run_multiplayer_migration.js` (line 4)
  - `side-quest/scripts/run_geothinkr_migration.js` (line 4)

## Environment Variable Categories

### Public Variables (Safe to expose to browser)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Secret Variables (Must remain server-side only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `DB_PASSWORD`

## Configuration Notes

1. Environment variables should be stored in `.env` or `.env.local` files (these are gitignored)
2. The `.gitignore` file explicitly excludes `.env` and `.env.local` files to prevent accidental commits
3. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser by Next.js
4. All other variables remain server-side only

## Required Variables by Component

### For the main application:
- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `AUTH_SECRET` (required for production, has fallback for development)

### For admin operations:
- `SUPABASE_SERVICE_ROLE_KEY` (required)

### For database migration scripts:
- `DB_PASSWORD` (required)
