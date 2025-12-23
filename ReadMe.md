# FinApp — Simple Payment Demo (FastAPI + React)

Live demo: https://lendenclub-assignment.vercel.app/

[![Watch the demo](https://img.youtube.com/vi/W7EKj-8fweM/0.jpg)](https://youtu.be/W7EKj-8fweM)

Project: a small payments demo that supports user signup/login, peer transfers, transaction history, QR-based payments, immutable audit logs, and realtime notifications via Server-Sent Events (SSE).

## Stack
- Backend: Python + FastAPI
- Frontend: React + Vite
- Database: SQLite (default, configurable to Postgres/MySQL via DATABASE_URL)
- Realtime: Server-Sent Events (SSE)
- HTTP client: axios (frontend)

## Repository layout (important files)
- backend/
  - main.py
  - database.py
  - user/ (auth, models, routes)
  - transaction/ (models, controller, routes)
  - sse/ (sse_manager.py, routes.py)
- frontend/
  - src/
    - pages/ (Dashboard, Login, Signup, QR, Transactions, Profile)
    - components/ (PinModal, Header, Sidebar, etc.)
    - sse/useSSE.ts
    - api/axiosInstance.ts

## Summary of implemented features
- User signup and login with JWT token-based auth.
- PIN verification for transfers.
- Peer-to-peer transfers with balance updates.
- Immutable audit log (transactions stored as AuditLog).
- Transactions history endpoint and frontend view.
- QR payment page for scanning/generating payment QR codes.
- SSE realtime notifications for transfer events (sender & receiver).
- Frontend EventSource hook that refreshes transactions and broadcasts updates across components.
- Error handling and input validation.

## Frontend — pages and behavior
- Dashboard / Main
  - Shows user balance, quick actions (Send, Receive, QR).
  - Connects to SSE via useSSE to receive realtime updates.
- QR (frontend/src/pages/QR.tsx)
  - Generate payment QR encoding payment target (email/id + amount).
  - Scan QR (if device supports camera) and prefill transfer form.
- Transactions History (frontend/src/pages/Transactions.tsx)
  - Lists recent transactions (sent and received), shows amounts, notes, timestamps.
  - Subscribes to `transactions:updated` CustomEvent dispatched by the SSE hook to refresh view without prop drilling.
- Profile
  - Basic user info and logout.
- Shared components
  - PinModal (Pin verification during transfer) — accessible from Main/Transfer flows.
  - Header, Sidebar, and responsive layout.
- SSE client hook
  - File: frontend/src/sse/useSSE.ts
  - Behavior:
    - Reads `access_token` from localStorage.
    - Connects to `${VITE_API_BASE_URL}/sse/stream?token=...` via EventSource.
    - Parses incoming messages (JSON).
    - Calls `/transactions` to refresh latest transactions on events.
    - Dispatches `CustomEvent('transactions:updated', { detail })` for UI components.
    - Calls provided onMessage callback with parsed payload.
    - Cleans up EventSource on unmount.

## Backend — endpoints and notes
Auth / Users
- POST /auth/signup
  - Body: { name, email, password, pin }
  - Returns: user object and access_token
- POST /auth/login
  - Body: { email, password }
  - Returns: { access_token, token_type }
- GET /auth/me
  - Header: Authorization: Bearer <token>
  - Returns: current user
- GET /auth/search?q=
  - Optional: exclude self when token provided
  - Returns: list of users matching q

Transfers / Transactions
- POST /transfer
  - Header: Authorization: Bearer <token>
  - Body: { receiver_email, amount, pin, note? }
  - Behavior: verifies PIN, performs DB transaction, updates balances, creates AuditLog, publishes SSE events to involved users.
  - Returns: transfer record + updated balances
- GET /transactions
  - Header: Authorization: Bearer <token>
  - Returns: recent transactions for authenticated user

# SSE (realtime)
- GET /sse/stream?token=<access_token>
  - Or provide Authorization: Bearer <token>
  - Authenticates token, subscribes user to per-user queue, and streams SSE frames with JSON payloads.
  - Publishing: `sse_manager.publish(user_id, data)` used after transfers to notify sender and receiver.
  - Manager file: backend/sse/sse_manager.py
  - Stream endpoint: backend/sse/routes.py

## Database schema (summary)
- Users (backend/user/models.py)
  - id (PK), name, email (unique), hashed_password, hashed_pin, balance (Numeric(18,2)), created_at
- AuditLog / Transaction (backend/transaction/models.py)
  - id (PK), sender_id (FK users.id), receiver_id (FK users.id), amount (Numeric), note, status, created_at
  - AuditLog is treated as immutable (no updates/deletes in normal flow)
- Default DB URL: sqlite:///./data.db (change via DATABASE_URL)

## SSE implementation details
- Manager pattern: per-user asyncio queue + publish API to push events into queues from sync or async code.
- Stream endpoint: async generator that yields "data: <json>\n\n" SSE chunks.
- Frontend EventSource: parses messages, triggers transactions API refresh, dispatches `transactions:updated`.
- File references:
  - backend/sse/sse_manager.py
  - backend/sse/routes.py
  - frontend/src/sse/useSSE.ts
- Troubleshooting:
  - Inspect EventSource in browser DevTools Network tab.
  - Ensure token is valid and passed in query param or Authorization header.
  - Confirm backend initialized SSE manager (see backend/main.py).
  - Check proxies/load-balancers do not buffer or close streaming connections.

## Setup & run (Linux)
Prereqs
- Node 18+/npm, Python 3.11+, pip
- Optional: Docker & docker-compose

Backend (dev)
1. Create venv and install:
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
2. Env vars (example):
   export DATABASE_URL="sqlite:///./data.db"
   export SECRET_KEY="replace-with-secure-secret"
   export VITE_API_BASE_URL="http://127.0.0.1:10000"
3. Start:
   uvicorn backend.main:app --host 0.0.0.0 --port 10000 --reload
   (init_db() creates tables on startup)

Frontend (dev)
1. cd frontend
2. npm install
3. ensure VITE_API_BASE_URL in frontend/.env or environment
4. npm run dev
5. Open http://localhost:5173

Docker (optional)
- docker build -t finapp .
- docker run -p 10000:10000 finapp

## API examples
- Login:
  curl -X POST http://127.0.0.1:10000/auth/login -H "Content-Type: application/json" -d '{"email":"alice@example.com","password":"pass"}'
- Fetch transactions:
  curl http://127.0.0.1:10000/transactions -H "Authorization: Bearer <token>"
- SSE (browser):
  new EventSource(`${VITE_API_BASE_URL}/sse/stream?token=${token}`)

## AI Tool Usage Log
Tools used: GitHub Copilot, Google Gemini, v0, Stitch (UI helper)

Recorded AI-assisted tasks
1. GitHub Copilot — SSE integration & frontend hook
   - Files: backend/sse/sse_manager.py, backend/sse/routes.py, frontend/src/sse/useSSE.ts, backend/main.py
   - Contribution: suggested queue-per-subscriber pattern, async generator SSE endpoint, EventSource hook that fetches /transactions and dispatches `transactions:updated`. Code reviewed and adapted to existing axios/auth flows.
   - Helped in documentation

2. Stitch — UI scaffolding & layout suggestions
   - Areas: frontend pages and component layout, responsive patterns, copy suggestions.

3. Google Gemini — Tailwind component refinements & modal patterns
   - Files: frontend/src/components/PinModal.tsx, frontend/src/components/Main.tsx
   - Contribution: className variants and small accessibility improvements.

Effectiveness score: 4 / 5
- Justification: AI tools accelerated scaffold and boilerplate work (SSE scaffolding, UI layout). Manual integration, auth wiring, and race-condition testing required additional effort.

## How GitHub Copilot helped setup SSE
- Provided the SSE manager and streaming endpoint pattern (queue-per-user and async generator yielding "data: <json>\n\n").
- Provided a reusable frontend EventSource hook that:
  - Builds URL from VITE_API_BASE_URL and token,
  - Parses messages, fetches /transactions, dispatches `transactions:updated`,
  - Cleans up on unmount.
- Generated code was adapted to project axios instance and auth.

## Testing & debugging notes
- Use browser DevTools Network to verify EventSource connection and incoming events.
- Add console logs inside frontend/src/sse/useSSE.ts for quick debugging.
- Confirm backend publishes events after transfers.
- Ensure proxy or server (if deployed) permits long-lived HTTP connections.

Video / Demo
- Add a link to your recorded walkthrough (YouTube / Drive) here after upload.
