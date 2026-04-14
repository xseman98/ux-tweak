# UXTweak Chat

A real-time chat application built as a technical assignment. Users join with a nickname and exchange messages in a shared room. The app handles connection drops gracefully — on reconnect it resumes the session and syncs any messages missed while offline.

## Tech stack

- **Backend**: NestJS, Prisma, Socket.IO, PostgreSQL
- **Frontend**: Quasar (Vue 3), Socket.IO client
- **Infra**: Docker Compose, pnpm workspaces

## Architecture

```
apps/
  backend/   NestJS API + WebSocket gateway
  frontend/  Quasar SPA
```

The backend exposes a single WebSocket gateway. There are no REST endpoints for chat — everything goes through Socket.IO events. PostgreSQL stores sessions and messages via Prisma.

The frontend is a single-page app served by nginx in production. State is managed in plain reactive stores (no Pinia/Vuex).

### WebSocket events

| Client → Server   | Description                                     |
|-------------------|-------------------------------------------------|
| `session:join`    | Create a new session with a nickname            |
| `session:resume`  | Resume an existing session after reconnect      |
| `message:send`    | Send a message to the room                      |
| `messages:sync`   | Fetch messages after a given message ID         |

| Server → Client   | Description                                     |
|-------------------|-------------------------------------------------|
| `session:joined`  | Session created, includes recent message history |
| `session:resumed` | Session resumed                                 |
| `message:new`     | New message broadcast to all connected clients  |
| `messages:synced` | Response to `messages:sync`                     |

## Running the project

### Docker (recommended)

**Requirements**: Docker, Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3000
- Health check: http://localhost:3000/health

Migrations run automatically before the backend starts. The backend waits for PostgreSQL to pass its health check before launching.

### Local development

**Requirements**: Node 20+, pnpm 10+, Docker (for the database)

```bash
pnpm install
cp .env.example .env

# start only the database
docker compose up postgres -d

# run migrations
cd apps/backend && npx prisma migrate dev && cd ../..

# start backend and frontend in separate terminals
pnpm dev:backend
pnpm dev:frontend
```

The frontend dev server connects to `http://localhost:3000` by default. If you run the backend on a different port, set `VITE_BACKEND_URL` in `apps/frontend/.env`.

## Tests

Backend unit tests cover the service layer:

```bash
cd apps/backend
pnpm test           # run all tests
pnpm test:cov       # with coverage report
```

Tests are in `*.spec.ts` files co-located with each service. The gateway itself is not unit-tested — the logic lives in the services.

## Reconnect and sync

When a client loses connection:

1. Status changes to `reconnecting` while Socket.IO retries.
2. On successful reconnect, the client emits `session:resume` to validate the session server-side.
3. The client then emits `messages:sync` with the ID of the last message it received.
4. The server returns any messages newer than that ID (up to 30).
5. Messages are merged into the existing list without duplicates. Messages that arrived while offline are highlighted briefly.
6. The composer is disabled during steps 2–4 to prevent sending while in an inconsistent state.

If the session can no longer be resumed (e.g. database was cleared), the user is returned to the join screen with an error message.

## Known tradeoffs

- **Single room**: all connected users share one message feed. There are no channels or DMs.
- **No session expiry**: sessions live in the database indefinitely. A cleanup job would be the natural next step.
- **Sync limit**: `messages:sync` fetches at most 30 messages per call. Very long disconnects may miss older messages from the gap.
- **No offline queue**: messages typed while offline are discarded, not queued. The composer is disabled to make this explicit.
- **In-memory state**: frontend state does not survive a page refresh beyond what is recoverable via `session:resume`.
