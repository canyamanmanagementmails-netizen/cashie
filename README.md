# Cashie

A private, read-only stocks and crypto dashboard MVP using Next.js and FastAPI.

> **Data and safety:** This starter uses illustrative fixture prices only. It does not provide live market data, brokerage services, account funding, custody, or order execution. The figures are not current quotes and must not be used to make investment decisions.

## Run locally

### API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API endpoints: `GET /health`, `GET /api/markets`; interactive docs at `http://localhost:8000/docs`.

### Web app

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. If the API is unavailable, the UI shows the same sample fixture data locally and labels it accordingly.

## Project layout

- `frontend/` — Next.js App Router dashboard with asset search, category filters, and watchlist star interactions.
- `backend/` — FastAPI read-only API serving the sample market fixture.

## Before adding real market data or trading

Replace fixtures only after selecting an authorized market-data source and confirming its licensing, exchange display rights, and terms. Keep provider credentials server-side. Trading, custody, customer accounts, and money movement are intentionally out of scope; evaluate applicable U.S. securities, commodities, money-transmission, consumer-protection, privacy, and state requirements with qualified counsel and an appropriately registered broker/custodian before pursuing those features. Do not collect customer funds or brokerage credentials in this demo.
