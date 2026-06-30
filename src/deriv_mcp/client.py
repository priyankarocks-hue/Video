"""Deriv WebSocket API client.

Docs: https://api.deriv.com
WS endpoint: wss://ws.binaryws.com/websockets/v3?app_id=APP_ID
"""

import asyncio
import json
import os
from typing import Any
import websockets
from websockets.exceptions import ConnectionClosed

DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3"


class DerivClient:
    def __init__(self) -> None:
        self.api_token: str = os.environ.get("DERIV_API_TOKEN", "")
        self.app_id: str = os.environ.get("DERIV_APP_ID", "1089")
        self._ws: websockets.WebSocketClientProtocol | None = None
        self._req_id: int = 0
        self._lock = asyncio.Lock()
        self._account_currency: str = "USD"

    @property
    def _ws_url(self) -> str:
        return f"{DERIV_WS_URL}?app_id={self.app_id}"

    async def _connect(self) -> None:
        self._ws = await websockets.connect(self._ws_url)
        if not self.api_token:
            raise RuntimeError(
                "DERIV_API_TOKEN environment variable is not set. "
                "Get your token at https://app.deriv.com/account/api-token"
            )
        resp = await self._send_raw({"authorize": self.api_token})
        if "error" in resp:
            raise RuntimeError(f"Deriv auth failed: {resp['error']['message']}")
        # Cache the account currency from auth response
        auth_info = resp.get("authorize", {})
        self._account_currency = auth_info.get("currency", "USD")

    async def _send_raw(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._req_id += 1
        payload["req_id"] = self._req_id
        await self._ws.send(json.dumps(payload))
        # Loop until we get the response matching our req_id
        while True:
            raw = await self._ws.recv()
            resp = json.loads(raw)
            if resp.get("req_id") == payload["req_id"]:
                return resp

    async def request(self, payload: dict[str, Any]) -> dict[str, Any]:
        async with self._lock:
            try:
                if self._ws is None or self._ws.closed:
                    await self._connect()
                return await self._send_raw(payload)
            except ConnectionClosed:
                self._ws = None
                await self._connect()
                return await self._send_raw(payload)

    async def close(self) -> None:
        if self._ws and not self._ws.closed:
            await self._ws.close()
        self._ws = None

    # ------------------------------------------------------------------ #
    # Convenience wrappers matching Deriv WebSocket API calls              #
    # ------------------------------------------------------------------ #

    async def get_account_info(self) -> dict[str, Any]:
        return await self.request({"authorize": self.api_token})

    async def get_account_status(self) -> dict[str, Any]:
        return await self.request({"get_account_status": 1})

    async def get_balance(self) -> dict[str, Any]:
        return await self.request({"balance": 1})

    async def get_active_symbols(self, product_type: str = "basic") -> dict[str, Any]:
        return await self.request(
            {"active_symbols": "brief", "product_type": product_type}
        )

    async def get_contracts_for(self, symbol: str) -> dict[str, Any]:
        return await self.request({"contracts_for": symbol, "currency": self._account_currency})

    async def get_proposal(
        self,
        symbol: str,
        contract_type: str,
        amount: float,
        duration: int,
        duration_unit: str,
        basis: str = "stake",
        barrier: str | None = None,
        barrier2: str | None = None,
        prediction: int | None = None,
        multiplier: float | None = None,
    ) -> dict[str, Any]:
        req: dict[str, Any] = {
            "proposal": 1,
            "symbol": symbol,
            "contract_type": contract_type,
            "amount": amount,
            "duration": duration,
            "duration_unit": duration_unit,
            "basis": basis,
            "currency": self._account_currency,
        }
        if barrier is not None:
            req["barrier"] = barrier
        if barrier2 is not None:
            req["barrier2"] = barrier2
        if prediction is not None:
            req["selected_tick"] = prediction
        if multiplier is not None:
            req["multiplier"] = multiplier
        return await self.request(req)

    async def buy_contract(self, buy_id: str, price: float) -> dict[str, Any]:
        return await self.request({"buy": buy_id, "price": price})

    async def sell_contract(self, contract_id: int, price: float = 0) -> dict[str, Any]:
        return await self.request({"sell": contract_id, "price": price})

    async def get_portfolio(self) -> dict[str, Any]:
        return await self.request({"portfolio": 1})

    async def get_open_contract(self, contract_id: int) -> dict[str, Any]:
        return await self.request(
            {"proposal_open_contract": 1, "contract_id": contract_id}
        )

    async def get_profit_table(self, limit: int = 25, offset: int = 0) -> dict[str, Any]:
        return await self.request(
            {"profit_table": 1, "description": 1, "limit": limit, "offset": offset}
        )

    async def get_statement(self, limit: int = 25, offset: int = 0) -> dict[str, Any]:
        return await self.request(
            {"statement": 1, "description": 1, "limit": limit, "offset": offset}
        )

    async def get_tick_history(
        self, symbol: str, count: int = 100, granularity: int = 0
    ) -> dict[str, Any]:
        req: dict[str, Any] = {
            "ticks_history": symbol,
            "end": "latest",
            "count": count,
            "style": "ticks" if granularity == 0 else "candles",
        }
        if granularity > 0:
            req["granularity"] = granularity
        return await self.request(req)

    async def get_exchange_rates(self, base: str | None = None) -> dict[str, Any]:
        return await self.request(
            {"exchange_rates": 1, "base_currency": base or self._account_currency}
        )
