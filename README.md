# Workout Energy Fitness

SPA React + API Cloudflare Pages Functions per gestione workout con auth multi-provider (Email, Google, Apple) e policy invite-only.

## Stack

- Frontend: React + Vite + Tailwind + TanStack Router + TanStack Query
- Backend: Cloudflare Pages Functions
- Database: Cloudflare D1 (SQLite)

## Feature implementate

- Login:
  - Email/password
  - Google SDK (Google Identity Services)
  - Google One Tap (pagina login)
  - Apple SDK (Sign in with Apple popup)
- Signup solo da invito:
  - Email/password
  - Google SDK
  - Apple SDK
- RBAC:
  - `customer`
  - `admin` (può usare anche app utente)
- Backoffice admin:
  - Creazione inviti con link copiabile
  - Lista utenti
  - Modifica scheda workout per utente
- App utente:
  - Home / Scheda / Profilo
  - Caricamento scheda da API (`/api/workout-plan/me`)

## Struttura principale

- API: `functions/api/**`
- Migrazioni D1: `migrations/*.sql`
- Router FE: `src/router.tsx`
- Client API FE: `src/lib/api/*`

## Configurazione Cloudflare

1. Crea database D1.
2. Aggiorna `wrangler.toml`:
   - `database_id`
   - eventuali `vars` (`APP_BASE_URL`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`)
3. Configura variabili frontend OAuth in `.env` (o build env su Cloudflare Pages):
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_APPLE_CLIENT_ID`
   - `VITE_APPLE_REDIRECT_URI` (deve essere registrata anche su Apple Developer)
4. Applica migrazioni:

```bash
npx wrangler d1 migrations apply workout_energy_fitness --local
```

Per ambiente remoto rimuovi `--local`.

## Superadmin bootstrap

Migrazione `0002_seed_superadmin.sql` crea:

- email: `admin@example.com`
- password: `ChangeMe123!`

Cambiare credenziali immediatamente in ambiente reale.

## Sviluppo frontend

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
