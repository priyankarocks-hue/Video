"""Tool definitions for the Deriv MCP server."""

import mcp.types as types

TOOLS: list[types.Tool] = [
    types.Tool(
        name="get_account_info",
        description=(
            "Get your Deriv account information: loginid, account type, currency, "
            "balance, and trading permissions. Call this first to confirm the connection."
        ),
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    types.Tool(
        name="get_account_status",
        description=(
            "Get account status flags: whether trading is allowed, KYC status, "
            "any restrictions or prompts on the account."
        ),
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    types.Tool(
        name="get_account_balance",
        description="Get the current real-time account balance and currency.",
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    types.Tool(
        name="get_active_symbols",
        description=(
            "List all tradable instruments on Deriv. Returns symbol codes, display names, "
            "market type, and whether markets are currently open. "
            "Use this to discover symbols before calling get_price_proposal."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "product_type": {
                    "type": "string",
                    "enum": ["basic", "multi_barrier", "lookback"],
                    "description": (
                        "basic = standard options (Rise/Fall, Digits, etc.); "
                        "multi_barrier = range/touch contracts; "
                        "lookback = lookback options"
                    ),
                    "default": "basic",
                }
            },
        },
    ),
    types.Tool(
        name="get_contracts_for_symbol",
        description=(
            "Get all available contract types for a specific symbol — e.g. CALL/PUT, "
            "ONETOUCH, DIGITMATCH — along with duration limits, barriers, and payout info."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Symbol code, e.g. R_100, frxEURUSD, cryBTCUSD",
                }
            },
            "required": ["symbol"],
        },
    ),
    types.Tool(
        name="get_price_proposal",
        description=(
            "Get a real-time price quote for a derivatives contract. "
            "Returns the stake, payout, ask price, and a buy_id. "
            "ALWAYS call this before buy_contract so the user can review the price. "
            "Common contract types: CALL (Rise), PUT (Fall), ONETOUCH, NOTOUCH, "
            "DIGITMATCH, DIGITDIFF, DIGITOVER, DIGITUNDER, ASIANU, ASIAND. "
            "Duration units: t=ticks, s=seconds, m=minutes, h=hours, d=days."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Trading symbol, e.g. R_100, frxEURUSD, cryBTCUSD, WLDAUD",
                },
                "contract_type": {
                    "type": "string",
                    "description": (
                        "CALL, PUT, ONETOUCH, NOTOUCH, DIGITMATCH, DIGITDIFF, "
                        "DIGITOVER, DIGITUNDER, ASIANU, ASIAND, MULTUP, MULTDOWN"
                    ),
                },
                "amount": {
                    "type": "number",
                    "description": "Stake or payout amount (depending on basis)",
                },
                "duration": {
                    "type": "integer",
                    "description": "Contract duration (number)",
                },
                "duration_unit": {
                    "type": "string",
                    "enum": ["t", "s", "m", "h", "d"],
                    "description": "t=ticks, s=seconds, m=minutes, h=hours, d=days",
                },
                "basis": {
                    "type": "string",
                    "enum": ["stake", "payout"],
                    "description": "Whether amount is the stake or the desired payout",
                    "default": "stake",
                },
                "barrier": {
                    "type": "string",
                    "description": (
                        "Barrier for ONETOUCH/NOTOUCH (e.g. '+0.5' for relative, "
                        "'1234.56' for absolute). Also used for DIGITMATCH/DIGITDIFF etc."
                    ),
                },
                "barrier2": {
                    "type": "string",
                    "description": "Second barrier for range contracts (EXPIRYRANGE/EXPIRYMISS)",
                },
                "multiplier": {
                    "type": "number",
                    "description": "Multiplier for MULTUP/MULTDOWN contracts (e.g. 10, 50, 100)",
                },
            },
            "required": ["symbol", "contract_type", "amount", "duration", "duration_unit"],
        },
    ),
    types.Tool(
        name="buy_contract",
        description=(
            "Buy a derivatives contract using a buy_id from get_price_proposal. "
            "Always show the user the proposal details and get explicit confirmation before calling this. "
            "The price parameter is the maximum you are willing to pay — use the ask_price from the proposal."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "buy_id": {
                    "type": "string",
                    "description": "The proposal ID returned by get_price_proposal",
                },
                "price": {
                    "type": "number",
                    "description": "Maximum price to pay — use the ask_price from the proposal",
                },
            },
            "required": ["buy_id", "price"],
        },
    ),
    types.Tool(
        name="sell_contract",
        description=(
            "Sell (close) an open contract before expiry. "
            "Use get_portfolio to find contract IDs. "
            "Set price to 0 to accept the current market price."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "contract_id": {
                    "type": "integer",
                    "description": "Contract ID from get_portfolio",
                },
                "price": {
                    "type": "number",
                    "description": "Minimum acceptable sell price; 0 = market price",
                    "default": 0,
                },
            },
            "required": ["contract_id"],
        },
    ),
    types.Tool(
        name="get_portfolio",
        description=(
            "Get all currently open (unexpired) contracts with their contract IDs, "
            "symbols, contract types, buy price, and current P&L."
        ),
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    types.Tool(
        name="get_contract_details",
        description=(
            "Get real-time details for a specific open contract: current bid price, "
            "profit/loss, barrier, remaining time, and contract status."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "contract_id": {
                    "type": "integer",
                    "description": "Contract ID (from get_portfolio)",
                }
            },
            "required": ["contract_id"],
        },
    ),
    types.Tool(
        name="get_profit_table",
        description=(
            "Get a history of closed/expired contracts showing P&L per trade, "
            "buy/sell prices, duration, and whether each trade won or lost."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of records to return (max 100)",
                    "default": 25,
                },
                "offset": {
                    "type": "integer",
                    "description": "Pagination offset",
                    "default": 0,
                },
            },
        },
    ),
    types.Tool(
        name="get_statement",
        description=(
            "Get the full account statement including trades, deposits, withdrawals, "
            "and transfers with running balance."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of records to return (max 100)",
                    "default": 25,
                },
                "offset": {
                    "type": "integer",
                    "description": "Pagination offset",
                    "default": 0,
                },
            },
        },
    ),
    types.Tool(
        name="get_tick_history",
        description=(
            "Get historical price data for a symbol. Returns ticks (raw prices) "
            "or OHLC candles if granularity is specified."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Symbol code, e.g. R_100, frxEURUSD",
                },
                "count": {
                    "type": "integer",
                    "description": "Number of data points to retrieve (max 5000)",
                    "default": 100,
                },
                "granularity": {
                    "type": "integer",
                    "enum": [0, 60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400],
                    "description": (
                        "0 = raw ticks; otherwise OHLC candle size in seconds "
                        "(60=1m, 300=5m, 3600=1h, 86400=1d)"
                    ),
                    "default": 0,
                },
            },
            "required": ["symbol"],
        },
    ),
    types.Tool(
        name="get_exchange_rates",
        description="Get exchange rates relative to your account currency or a specified base currency.",
        inputSchema={
            "type": "object",
            "properties": {
                "base_currency": {
                    "type": "string",
                    "description": "Base currency (e.g. USD, EUR). Defaults to account currency.",
                }
            },
        },
    ),
]
