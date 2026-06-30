#!/usr/bin/env python3
"""Deriv Trading MCP Server.

Connects Claude to your Deriv account via the Deriv WebSocket API.
See: https://api.deriv.com

Environment variables:
    DERIV_API_TOKEN  — your Deriv API token (required)
    DERIV_APP_ID     — your registered app ID (default: 1089 for testing)

Get your API token at: https://app.deriv.com/account/api-token
Register an app at:   https://app.deriv.com/account/api-token (OAuth tab)
"""

import asyncio
import json
import sys
from typing import Any

import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

from .client import DerivClient
from .tools import TOOLS

server = Server("deriv-trading")
_client = DerivClient()


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return TOOLS


@server.call_tool()
async def call_tool(
    name: str, arguments: dict[str, Any]
) -> list[types.TextContent]:
    try:
        result = await _dispatch(name, arguments)
        return [types.TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as exc:
        return [types.TextContent(type="text", text=f"Error: {exc}")]


async def _dispatch(name: str, args: dict[str, Any]) -> Any:
    c = _client
    match name:
        case "get_account_info":
            return await c.get_account_info()

        case "get_account_status":
            return await c.get_account_status()

        case "get_account_balance":
            return await c.get_balance()

        case "get_active_symbols":
            product_type = args.get("product_type", "basic")
            resp = await c.get_active_symbols(product_type)
            symbols = resp.get("active_symbols", [])
            # Return a concise summary to keep the response readable
            return {
                "count": len(symbols),
                "symbols": [
                    {
                        "symbol": s["symbol"],
                        "display_name": s.get("display_name", ""),
                        "market": s.get("market", ""),
                        "submarket": s.get("submarket", ""),
                        "is_open": s.get("exchange_is_open", 0) == 1,
                        "pip": s.get("pip"),
                    }
                    for s in symbols
                ],
            }

        case "get_contracts_for_symbol":
            return await c.get_contracts_for(args["symbol"])

        case "get_price_proposal":
            resp = await c.get_proposal(
                symbol=args["symbol"],
                contract_type=args["contract_type"],
                amount=args["amount"],
                duration=args["duration"],
                duration_unit=args["duration_unit"],
                basis=args.get("basis", "stake"),
                barrier=args.get("barrier"),
                barrier2=args.get("barrier2"),
                multiplier=args.get("multiplier"),
            )
            proposal = resp.get("proposal", {})
            return {
                "buy_id": proposal.get("id"),
                "ask_price": proposal.get("ask_price"),
                "payout": proposal.get("payout"),
                "stake": proposal.get("display_value"),
                "spot": proposal.get("spot"),
                "spot_time": proposal.get("spot_time"),
                "date_expiry": proposal.get("date_expiry"),
                "longcode": proposal.get("longcode"),
                "contract_type": args["contract_type"],
                "symbol": args["symbol"],
                "raw": proposal,
            }

        case "buy_contract":
            resp = await c.buy_contract(args["buy_id"], args["price"])
            buy = resp.get("buy", {})
            return {
                "contract_id": buy.get("contract_id"),
                "buy_price": buy.get("buy_price"),
                "payout": buy.get("payout"),
                "start_time": buy.get("start_time"),
                "longcode": buy.get("longcode"),
                "shortcode": buy.get("shortcode"),
                "raw": buy,
            }

        case "sell_contract":
            resp = await c.sell_contract(args["contract_id"], args.get("price", 0))
            sell = resp.get("sell", {})
            return {
                "sold_for": sell.get("sold_for"),
                "reference_id": sell.get("reference_id"),
                "balance_after": sell.get("balance_after"),
                "raw": sell,
            }

        case "get_portfolio":
            resp = await c.get_portfolio()
            contracts = resp.get("portfolio", {}).get("contracts", [])
            return {
                "open_positions": len(contracts),
                "contracts": [
                    {
                        "contract_id": c_["contract_id"],
                        "symbol": c_.get("symbol"),
                        "contract_type": c_.get("contract_type"),
                        "buy_price": c_.get("buy_price"),
                        "payout": c_.get("payout"),
                        "date_start": c_.get("date_start"),
                        "expiry_time": c_.get("expiry_time"),
                        "longcode": c_.get("longcode"),
                    }
                    for c_ in contracts
                ],
            }

        case "get_contract_details":
            resp = await c.get_open_contract(args["contract_id"])
            poc = resp.get("proposal_open_contract", {})
            return {
                "contract_id": poc.get("contract_id"),
                "status": poc.get("status"),
                "buy_price": poc.get("buy_price"),
                "bid_price": poc.get("bid_price"),
                "profit": poc.get("profit"),
                "profit_percentage": poc.get("profit_percentage"),
                "current_spot": poc.get("current_spot"),
                "barrier": poc.get("barrier"),
                "date_expiry": poc.get("date_expiry"),
                "is_expired": poc.get("is_expired"),
                "is_sold": poc.get("is_sold"),
                "longcode": poc.get("longcode"),
                "raw": poc,
            }

        case "get_profit_table":
            resp = await c.get_profit_table(
                limit=args.get("limit", 25),
                offset=args.get("offset", 0),
            )
            trades = resp.get("profit_table", {}).get("transactions", [])
            total_profit = sum(float(t.get("sell_price", 0)) - float(t.get("buy_price", 0)) for t in trades)
            return {
                "trade_count": len(trades),
                "total_profit_loss": round(total_profit, 2),
                "trades": [
                    {
                        "contract_id": t.get("contract_id"),
                        "symbol": t.get("shortcode", "").split("_")[0] if t.get("shortcode") else "",
                        "contract_type": t.get("contract_type"),
                        "buy_price": t.get("buy_price"),
                        "sell_price": t.get("sell_price"),
                        "profit_loss": round(float(t.get("sell_price", 0)) - float(t.get("buy_price", 0)), 2),
                        "duration_type": t.get("duration_type"),
                        "purchase_time": t.get("purchase_time"),
                        "sell_time": t.get("sell_time"),
                        "longcode": t.get("longcode"),
                    }
                    for t in trades
                ],
            }

        case "get_statement":
            resp = await c.get_statement(
                limit=args.get("limit", 25),
                offset=args.get("offset", 0),
            )
            txns = resp.get("statement", {}).get("transactions", [])
            return {
                "transaction_count": len(txns),
                "transactions": [
                    {
                        "transaction_id": t.get("transaction_id"),
                        "action": t.get("action_type"),
                        "amount": t.get("amount"),
                        "balance_after": t.get("balance_after"),
                        "contract_id": t.get("contract_id"),
                        "longcode": t.get("longcode"),
                        "purchase_time": t.get("purchase_time"),
                        "transaction_time": t.get("transaction_time"),
                    }
                    for t in txns
                ],
            }

        case "get_tick_history":
            resp = await c.get_tick_history(
                symbol=args["symbol"],
                count=args.get("count", 100),
                granularity=args.get("granularity", 0),
            )
            if "history" in resp:
                history = resp["history"]
                prices = history.get("prices", [])
                times = history.get("times", [])
                return {
                    "symbol": args["symbol"],
                    "type": "ticks",
                    "count": len(prices),
                    "latest_price": prices[-1] if prices else None,
                    "ticks": [{"time": t, "price": p} for t, p in zip(times, prices)],
                }
            elif "candles" in resp:
                candles = resp["candles"]
                return {
                    "symbol": args["symbol"],
                    "type": "candles",
                    "granularity_seconds": args.get("granularity", 60),
                    "count": len(candles),
                    "latest_candle": candles[-1] if candles else None,
                    "candles": candles,
                }
            return resp

        case "get_exchange_rates":
            return await c.get_exchange_rates(args.get("base_currency"))

        case _:
            raise ValueError(f"Unknown tool: {name}")


def main() -> None:
    async def _run() -> None:
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )

    asyncio.run(_run())


if __name__ == "__main__":
    main()
