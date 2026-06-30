export const DERIV_WS_URL = "wss://ws.binaryws.com/websockets/v3";

export interface DerivConfig {
  appId: string;
  token: string;
}

export type ContractType =
  | "CALL" | "PUT"
  | "ONETOUCH" | "NOTOUCH"
  | "DIGITMATCH" | "DIGITDIFF" | "DIGITOVER" | "DIGITUNDER"
  | "ASIANU" | "ASIAND"
  | "MULTUP" | "MULTDOWN";

export type DurationUnit = "t" | "s" | "m" | "h" | "d";

export interface Tick {
  epoch: number;
  quote: number;
}

export interface Candle {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AccountInfo {
  loginid: string;
  currency: string;
  balance: number;
  email: string;
  fullname: string;
  is_virtual: number;
  account_list: Array<{ loginid: string; currency: string; is_virtual: number }>;
}

export interface OpenContract {
  contract_id: number;
  symbol: string;
  contract_type: string;
  buy_price: number;
  payout: number;
  expiry_time: number;
  date_start: number;
  longcode: string;
  shortcode: string;
}

export interface Proposal {
  id: string;
  ask_price: number;
  payout: number;
  longcode: string;
  spot: number;
  date_expiry: number;
}

export interface TradeResult {
  contract_id: number;
  buy_price: number;
  payout: number;
  longcode: string;
  shortcode: string;
  start_time: number;
}

export const POPULAR_SYMBOLS = [
  { symbol: "R_100", name: "Volatility 100" },
  { symbol: "R_75", name: "Volatility 75" },
  { symbol: "R_50", name: "Volatility 50" },
  { symbol: "R_25", name: "Volatility 25" },
  { symbol: "R_10", name: "Volatility 10" },
  { symbol: "BOOM1000", name: "Boom 1000" },
  { symbol: "CRASH1000", name: "Crash 1000" },
  { symbol: "frxEURUSD", name: "EUR/USD" },
  { symbol: "frxGBPUSD", name: "GBP/USD" },
  { symbol: "frxUSDJPY", name: "USD/JPY" },
  { symbol: "cryBTCUSD", name: "BTC/USD" },
  { symbol: "cryETHUSD", name: "ETH/USD" },
];

export const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "CALL", label: "Rise" },
  { value: "PUT", label: "Fall" },
  { value: "ONETOUCH", label: "Touch" },
  { value: "NOTOUCH", label: "No Touch" },
  { value: "DIGITMATCH", label: "Digit Match" },
  { value: "DIGITDIFF", label: "Digit Differs" },
  { value: "DIGITOVER", label: "Digit Over" },
  { value: "DIGITUNDER", label: "Digit Under" },
  { value: "ASIANU", label: "Asian Up" },
  { value: "ASIAND", label: "Asian Down" },
];

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: "t", label: "Ticks" },
  { value: "s", label: "Seconds" },
  { value: "m", label: "Minutes" },
  { value: "h", label: "Hours" },
  { value: "d", label: "Days" },
];

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString();
}
