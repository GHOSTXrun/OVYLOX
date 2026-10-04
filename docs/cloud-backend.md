# Optional cloud collection backend

The public site uses browser storage. The preserved backend is an optional Worker + D1 implementation; GitHub Pages cannot execute it.

## Local development

Requires Node.js 22.18+ and npm.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:8787. The local server uses a fixed development identity and `.local/creations.sqlite`. It listens on loopback and must not be exposed as a production service.

```bash
npm test
npm run build
```

`npm run build` produces `dist/index.html`, `dist/server/index.js`, and database migrations in `dist/.openai/drizzle/`. The HTML from this build expects the online `/api/` backend for cloud saves. Use `npm run build:pages` for the independent static site.

## Authentication and deployment

The original API expects a trusted authentication proxy to set the `oai-authenticated-user-id` request header. It never accepts an owner ID from a frontend payload, and database operations are scoped to the authenticated user.

When deploying elsewhere, implement server-side authentication and supply a compatible `env.DB` D1 binding. Never trust a user identity header supplied directly by a public client. The included development identity is for local use only.

Platform project identifiers are intentionally excluded from the public repository. A Sites deployment must supply its own `.openai/hosting.json` through its platform workflow. Without this local file, the cloud build emits only a generic `DB` binding placeholder; that build alone does not configure a live deployment.

Database definitions are in `db/schema.ts`; committed migrations are in `drizzle/`. Run `npm run db:generate` after schema changes, and apply the resulting migrations using the target platform's deployment procedure.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/me` | Storage and authentication status |
| GET | `/api/creations` | List this user's saved creations |
| POST | `/api/creations` | Create a saved character |
| PUT | `/api/creations/:id` | Update this user's saved character |
| DELETE | `/api/creations/:id` | Remove this user's saved character |

The API validates character fields, social URLs and colors, limits each collection to 200 items, and checks request origins for writes. Tests use real SQLite to exercise authentication, origin checks, validation, CRUD, ownership isolation and limits.
