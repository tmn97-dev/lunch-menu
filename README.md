# Weekly Lunch Menu

Public page that shows this week's lunch menu. A hidden admin page at **`/panel`** lets a logged-in user upload a photo of the menu; Gemini Vision extracts the structured menu and stores it in a Turso (libSQL) database.

## How it works

- **`index.html`** — public page. Fetches the current menu from `GET /api/menu`.
- **`/panel`** (rewrite of `admin.html`) — login form, then file upload. No link to it anywhere; access by URL only.
- **`api/`** — Vercel serverless functions:
  - `login`, `logout`, `me` — session via signed JWT in HttpOnly cookie
  - `menu` — public, returns the latest menu row
  - `upload-and-update` — auth-gated; calls Gemini, writes a new row to `menus`
- **Turso DB** — `users` (bcrypt-hashed passwords), `menus` (JSON of each upload, latest wins)

## Environment variables

See [.env.example](.env.example). Required:

| Var | Where to get it |
| --- | --- |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `TURSO_URL` | `turso db show <db> --url` |
| `TURSO_AUTH_TOKEN` | `turso db tokens create <db>` |
| `SESSION_SECRET` | `openssl rand -hex 32` |

Set these in **Vercel → Project → Settings → Environment Variables** for the deployed site, and in `.env.local` for `vercel dev`.

## Local development

```bash
nvm use                  # picks Node 22 per .nvmrc
npm install
npm run dev              # vercel dev — serves index.html, /panel, and /api/*
```

## Creating an admin user

There is no registration endpoint. Run the seed script locally:

```bash
npm run seed:user
```

It prompts for username + password, bcrypts the password, and inserts a row into Turso `users`. Run it once per user.

## Deploy

1. Push to GitHub. Import the repo in Vercel (no special config — `vercel.json` handles the `/panel` rewrite).
2. Add the env vars above in the Vercel dashboard.
3. Visit `/panel`, log in, upload a menu photo.

## Database schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at INTEGER DEFAULT (unixepoch())
);
```

Menu history is kept implicitly — every upload is a new row in `menus`, and `/api/menu` returns the most recent one.
