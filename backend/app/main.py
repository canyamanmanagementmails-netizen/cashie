from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Cashie API",
    description="Read-only market dashboard API. The included quotes are illustrative sample data.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/markets", response_model=MarketResponse)
def markets() -> MarketResponse:
    """Return illustrative fixture data; this endpoint does not provide live quotes."""
    return MarketResponse(
        source="demo",
        updated_at=datetime.now(timezone.utc),
        assets=SAMPLE_ASSETS,
    )
