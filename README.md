# Deriv Trading MCP Server

Connect Claude to your [Deriv](https://deriv.com) account and manage trades through natural language — just like the Interactive Brokers Claude integration.

> **Note:** This server lets Claude *draft* trade instructions. You always review and confirm before any contract is purchased. Claude never submits orders without your explicit approval.

## What you can do

Ask Claude things like:
- *"What's my current balance and open positions?"*
- *"Get me a quote for a 5-minute Rise contract on Volatility 100"*
- *"Show me my last 10 trades and total P&L"*
- *"Sell contract 12345678 at market price"*
- *"What synthetic indices are available right now?"*
- *"Give me the last 200 ticks for EUR/USD"*

## Tools (14 total)

| Tool | Description |
|------|-------------|
| `get_account_info` | Account loginid, type, currency, balance |
| `get_account_status` | KYC status, trading restrictions |
| `get_account_balance` | Real-time balance |
| `get_active_symbols` | All tradable instruments (synthetics, forex, crypto, stocks) |
| `get_contracts_for_symbol` | Available contract types & durations for a symbol |
| `get_price_proposal` | Real-time price quote — always call before buying |
| `buy_contract` | Execute a buy (requires your confirmation first) |
| `sell_contract` | Close an open position |
| `get_portfolio` | All open contracts |
| `get_contract_details` | Real-time P&L and status of an open contract |
| `get_profit_table` | Closed trade history with P&L |
| `get_statement` | Full account statement (trades + deposits + withdrawals) |
| `get_tick_history` | Historical price data — ticks or OHLC candles |
| `get_exchange_rates` | Current exchange rates |

## Setup

### 1. Get a Deriv API Token

1. Log in to [app.deriv.com](https://app.deriv.com)
2. Go to **Account Settings → API Token**
3. Create a token with scopes: **Read**, **Trade**, **Payments**, **Admin**
4. Copy the token

### 2. (Optional) Register an App ID

For production use, register your own app at the [Deriv API portal](https://api.deriv.com/app-registration/).  
For testing, use the default `app_id=1089`.

### 3. Install

```bash
# Using uv (recommended)
pip install uv
uv pip install .

# Or with pip
pip install .
```

### 4. Configure Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "deriv-trading": {
      "command": "uv",
      "args": ["run", "deriv-mcp"],
      "env": {
        "DERIV_API_TOKEN": "YOUR_TOKEN_HERE",
        "DERIV_APP_ID": "1089"
      }
    }
  }
}
```

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### 5. Run directly (for testing)

```bash
export DERIV_API_TOKEN=your_token_here
export DERIV_APP_ID=1089
python -m deriv_mcp
```

## Common Symbols

| Category | Symbols |
|----------|---------|
| Synthetic Indices | `R_10`, `R_25`, `R_50`, `R_75`, `R_100` |
| Forex | `frxEURUSD`, `frxGBPUSD`, `frxUSDJPY`, `frxAUDUSD` |
| Crypto | `cryBTCUSD`, `cryETHUSD`, `cryLTCUSD` |
| Gold | `frxXAUUSD` |
| Boom/Crash | `BOOM1000`, `CRASH1000` |
| Step | `stpRNG` |

Use `get_active_symbols` to see all currently tradable instruments.

## Contract Types

| Type | Description |
|------|-------------|
| `CALL` | Rise — win if price is higher at expiry |
| `PUT` | Fall — win if price is lower at expiry |
| `ONETOUCH` | Win if price touches barrier |
| `NOTOUCH` | Win if price never touches barrier |
| `DIGITMATCH` | Win if last digit matches |
| `DIGITDIFF` | Win if last digit differs |
| `DIGITOVER` | Win if last digit is over barrier |
| `DIGITUNDER` | Win if last digit is under barrier |
| `ASIANU` | Asian Up — win if final tick > average |
| `ASIAND` | Asian Down — win if final tick < average |
| `MULTUP` | Multiplier Up |
| `MULTDOWN` | Multiplier Down |

## API Reference

- WebSocket API docs: [api.deriv.com](https://api.deriv.com)
- Endpoint: `wss://ws.binaryws.com/websockets/v3?app_id=APP_ID`

## Disclaimer

Trading financial derivatives involves significant risk of loss. This tool is for informational and convenience purposes only. Always review trade details carefully before confirming any purchase. Past performance is not indicative of future results.
