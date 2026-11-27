from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .auth import (
    SESSION_COOKIE,
    Credentials,
    current_user,
    initialize_auth_database,
    login as authenticate,
    logout as end_session,
    register as create_account,
)
from fastapi import Cookie, Response

app = FastAPI(
    title="Cashie API",
    description="Read-only market dashboard API with email/password accounts. Quotes are illustrative sample data.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

initialize_auth_database()


class Asset(BaseModel):
    symbol: str
    name: str
    asset_type: Literal["stock", "crypto"]
    price: float
    change_percent: float
    currency: str = "USD"


class MarketResponse(BaseModel):
    source: str
    updated_at: datetime
    assets: list[Asset]


SAMPLE_ASSETS = [
    Asset(symbol="AAPL", name="Apple Inc.", asset_type="stock", price=189.84, change_percent=1.24),
    Asset(symbol="MSFT", name="Microsoft Corporation", asset_type="stock", price=420.72, change_percent=0.68),
    Asset(symbol="NVDA", name="NVIDIA Corporation", asset_type="stock", price=875.28, change_percent=-0.42),
    Asset(symbol="AMZN", name="Amazon.com, Inc.", asset_type="stock", price=178.15, change_percent=1.09),
    Asset(symbol="BTC", name="Bitcoin", asset_type="crypto", price=67432.18, change_percent=2.81),
    Asset(symbol="ETH", name="Ethereum", asset_type="crypto", price=3521.64, change_percent=-1.16),
    Asset(symbol="SOL", name="Solana", asset_type="crypto", price=148.92, change_percent=4.37),
    Asset(symbol="XRP", name="XRP", asset_type="crypto", price=0.624, change_percent=0.35),
]


@app.post("/api/auth/register")
def register(credentials: Credentials, response: Response) -> dict[str, str]:
    return create_account(credentials, response)


@app.post("/api/auth/login")
def login(credentials: Credentials, response: Response) -> dict[str, str]:
    return authenticate(credentials, response)


@app.post("/api/auth/logout")
def logout(
    response: Response,
    cashie_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> dict[str, str]:
    return end_session(cashie_session, response)


@app.get("/api/auth/me")
def me(user: dict[str, str] = Depends(current_user)) -> dict[str, str]:
    return user


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/markets", response_model=MarketResponse)
def markets(_: dict[str, str] = Depends(current_user)) -> MarketResponse:
    """Return illustrative fixture data; requires a signed-in user and is not live market data."""
    return MarketResponse(
        source="demo",
        updated_at=datetime.now(timezone.utc),
        assets=SAMPLE_ASSETS,
    )
