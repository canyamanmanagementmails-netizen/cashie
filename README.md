# Cashie

A private, read-only stocks and crypto dashboard MVP using Next.js and FastAPI. Users must register with an email and password or sign in before accessing the dashboard.

> **Data and safety:** Prices are illustrative fixture data only, not current quotes. Cashie does not provide live market data, brokerage services, account funding, custody, or order execution.

## Run locally (Windows Command Prompt)

### API

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The API creates `backend/cashie.db` automatically to store accounts and sessions. Keep this database file private and backed up appropriately. API docs: `http://localhost:8000/docs`.

### Web app

In another terminal:

```bat
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`, create an account using an email address and a password of at least 10 characters, then sign in. The dashboard requires an active server-side session. If the API is unavailable, the UI can show its local illustrative fixtures after authentication.

macOS/Linux users can use `python -m venv .venv`, `source .venv/bin/activate`, and `cp .env.example .env.local` instead.

## Authentication notes

Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes, never as plaintext. Login uses a random, HttpOnly cookie; only a hash of the session token is stored in SQLite. Sessions expire after seven days. For local HTTP development, the cookie is not marked Secure. Set `CASHIE_COOKIE_SECURE=true` when serving the API over HTTPS. For public production use, add HTTPS, rate limiting, email verification, password reset, database backups, and operational security review; SQLite/local development settings are not a production deployment configuration.

## Project layout

- `frontend/` — Next.js App Router dashboard and registration/sign-in gate.
- `backend/` — FastAPI auth endpoints, SQLite account/session storage, and read-only sample market API.

The market API is illustrative fixture data. Before adding real market data, confirm source licensing and display rights. Trading, custody, customer accounts, and money movement remain out of scope.
