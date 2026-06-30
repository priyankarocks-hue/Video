"""Quick smoke test for the Deriv MCP server client."""
import asyncio
import os
import sys
sys.path.insert(0, "src")

from deriv_mcp.client import DerivClient


async def test_no_auth():
    """Test public WebSocket endpoint (no auth required)."""
    import websockets, json
    print("1. Testing WebSocket connection to Deriv...")
    url = "wss://ws.binaryws.com/websockets/v3?app_id=1089"
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({"ping": 1}))
        resp = json.loads(await ws.recv())
        assert resp.get("ping") == 1, f"Unexpected response: {resp}"
        print("   WebSocket ping OK:", resp)

    print("2. Fetching active symbols (no auth)...")
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({"active_symbols": "brief", "product_type": "basic", "req_id": 1}))
        resp = json.loads(await ws.recv())
        symbols = resp.get("active_symbols", [])
        print(f"   Got {len(symbols)} symbols. Sample: {[s['symbol'] for s in symbols[:5]]}")


async def test_with_auth(token: str):
    """Test authenticated endpoints."""
    print("3. Testing authorization...")
    client = DerivClient()
    client.api_token = token

    info = await client.get_account_info()
    acc = info.get("authorize", {})
    print(f"   Logged in as: {acc.get('loginid')} | {acc.get('currency')} | balance: {acc.get('balance')}")

    print("4. Testing get_balance...")
    bal = await client.get_balance()
    b = bal.get("balance", {})
    print(f"   Balance: {b.get('balance')} {b.get('currency')}")

    print("5. Testing get_portfolio...")
    port = await client.get_portfolio()
    contracts = port.get("portfolio", {}).get("contracts", [])
    print(f"   Open positions: {len(contracts)}")

    print("6. Testing price proposal (R_100, CALL, 10 USD, 1 min)...")
    prop = await client.get_proposal(
        symbol="R_100",
        contract_type="CALL",
        amount=10,
        duration=1,
        duration_unit="m",
    )
    p = prop.get("proposal", {})
    print(f"   Ask price: {p.get('ask_price')} | Payout: {p.get('payout')} | ID: {p.get('id')}")

    await client.close()


async def main():
    await test_no_auth()
    token = os.environ.get("DERIV_API_TOKEN", "")
    if token:
        await test_with_auth(token)
    else:
        print("\nSkipping auth tests — set DERIV_API_TOKEN to test trading tools.")
    print("\nAll tests passed!")


asyncio.run(main())
