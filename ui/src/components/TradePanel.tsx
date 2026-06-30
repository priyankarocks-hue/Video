"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  POPULAR_SYMBOLS,
  CONTRACT_TYPES,
  DURATION_UNITS,
  formatCurrency,
  type ContractType,
  type DurationUnit,
} from "@/lib/deriv";

interface Proposal {
  id: string;
  ask_price: number;
  payout: number;
  longcode: string;
}

interface Props {
  currency: string;
  getProposal: (params: {
    symbol: string;
    contractType: string;
    amount: number;
    duration: number;
    durationUnit: string;
    basis: string;
    barrier?: string;
  }) => Promise<Proposal>;
  buyContract: (buyId: string, price: number) => Promise<{ contract_id: number; buy_price: number; payout: number; longcode: string; shortcode: string }>;
}

export default function TradePanel({ currency, getProposal, buyContract }: Props) {
  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState<ContractType>("CALL");
  const [amount, setAmount] = useState("10");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("m");
  const [barrier, setBarrier] = useState("");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const needsBarrier = ["ONETOUCH", "NOTOUCH", "DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"].includes(contractType);

  async function handleGetProposal() {
    setProposal(null);
    setMessage(null);
    setLoadingProposal(true);
    try {
      const p = await getProposal({
        symbol,
        contractType,
        amount: parseFloat(amount),
        duration: parseInt(duration),
        durationUnit,
        basis: "stake",
        barrier: needsBarrier && barrier ? barrier : undefined,
      });
      setProposal(p);
    } catch (e) {
      setMessage({ type: "error", text: String(e) });
    } finally {
      setLoadingProposal(false);
    }
  }

  async function handleBuy() {
    if (!proposal) return;
    setLoadingBuy(true);
    setMessage(null);
    try {
      const result = await buyContract(proposal.id, proposal.ask_price);
      setMessage({
        type: "success",
        text: `Contract #${result.contract_id} bought for ${formatCurrency(result.buy_price, currency)}. Payout: ${formatCurrency(result.payout, currency)}`,
      });
      setProposal(null);
    } catch (e) {
      setMessage({ type: "error", text: String(e) });
    } finally {
      setLoadingBuy(false);
    }
  }

  const isRise = contractType === "CALL";
  const isFall = contractType === "PUT";

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
      <h2 className="text-white font-semibold mb-4">Place a Trade</h2>

      <div className="space-y-3">
        {/* Symbol */}
        <div>
          <label className="text-[#6b7280] text-xs uppercase tracking-wide block mb-1">Symbol</label>
          <select
            value={symbol}
            onChange={(e) => { setSymbol(e.target.value); setProposal(null); }}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff444f]"
          >
            {POPULAR_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Contract Type */}
        <div>
          <label className="text-[#6b7280] text-xs uppercase tracking-wide block mb-1">Contract Type</label>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <button
              onClick={() => { setContractType("CALL"); setProposal(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRise
                  ? "bg-[#14532d] border border-[#22c55e] text-[#22c55e]"
                  : "bg-[#0f1117] border border-[#2a2d3a] text-[#6b7280] hover:border-[#22c55e]/50"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Rise
            </button>
            <button
              onClick={() => { setContractType("PUT"); setProposal(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFall
                  ? "bg-[#450a0a] border border-[#ef4444] text-[#ef4444]"
                  : "bg-[#0f1117] border border-[#2a2d3a] text-[#6b7280] hover:border-[#ef4444]/50"
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Fall
            </button>
          </div>
          {!isRise && !isFall && (
            <select
              value={contractType}
              onChange={(e) => { setContractType(e.target.value as ContractType); setProposal(null); }}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff444f]"
            >
              {CONTRACT_TYPES.filter(c => c.value !== "CALL" && c.value !== "PUT").map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          )}
          {!isRise && !isFall && (
            <button
              onClick={() => setContractType("CALL")}
              className="text-[#6b7280] text-xs mt-1 hover:text-white"
            >
              ← Back to Rise/Fall
            </button>
          )}
          {isRise && (
            <button
              onClick={() => setContractType("DIGITMATCH")}
              className="text-[#6b7280] text-xs mt-1 hover:text-white"
            >
              More types →
            </button>
          )}
        </div>

        {/* Stake + Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#6b7280] text-xs uppercase tracking-wide block mb-1">Stake ({currency})</label>
            <input
              type="number"
              value={amount}
              min="0.35"
              step="0.5"
              onChange={(e) => { setAmount(e.target.value); setProposal(null); }}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff444f]"
            />
          </div>
          <div>
            <label className="text-[#6b7280] text-xs uppercase tracking-wide block mb-1">Duration</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={duration}
                min="1"
                onChange={(e) => { setDuration(e.target.value); setProposal(null); }}
                className="w-16 bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-[#ff444f]"
              />
              <select
                value={durationUnit}
                onChange={(e) => { setDurationUnit(e.target.value as DurationUnit); setProposal(null); }}
                className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-[#ff444f]"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Barrier (optional) */}
        {needsBarrier && (
          <div>
            <label className="text-[#6b7280] text-xs uppercase tracking-wide block mb-1">
              Barrier {needsBarrier ? "(required)" : "(optional)"}
            </label>
            <input
              type="text"
              value={barrier}
              placeholder="e.g. +0.5 or 1234.56"
              onChange={(e) => { setBarrier(e.target.value); setProposal(null); }}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff444f]"
            />
          </div>
        )}

        {/* Get Quote */}
        <button
          onClick={handleGetProposal}
          disabled={loadingProposal}
          className="w-full bg-[#1e2235] hover:bg-[#252840] border border-[#2a2d3a] text-white text-sm font-medium rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2"
        >
          {loadingProposal ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : "Get Price Quote"}
        </button>

        {/* Proposal Preview */}
        {proposal && (
          <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[#6b7280] text-xs">You pay</p>
                <p className="text-white text-lg font-bold">
                  {formatCurrency(proposal.ask_price, currency)}
                </p>
              </div>
              <div>
                <p className="text-[#6b7280] text-xs">Potential payout</p>
                <p className="text-[#22c55e] text-lg font-bold">
                  {formatCurrency(proposal.payout, currency)}
                </p>
              </div>
            </div>
            <p className="text-[#4b5563] text-xs mb-3 leading-relaxed">{proposal.longcode}</p>
            <button
              onClick={handleBuy}
              disabled={loadingBuy}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                isRise
                  ? "bg-[#16a34a] hover:bg-[#15803d]"
                  : isFall
                  ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                  : "bg-[#ff444f] hover:bg-[#e03940]"
              }`}
            >
              {loadingBuy ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRise ? <TrendingUp className="w-4 h-4" /> : isFall ? <TrendingDown className="w-4 h-4" /> : null}
                  Confirm {isRise ? "Rise" : isFall ? "Fall" : contractType} — {formatCurrency(proposal.ask_price, currency)}
                </>
              )}
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-[#0f2b1a] border border-[#166534] text-[#4ade80]"
                : "bg-[#2a1215] border border-[#5c1f1f] text-[#ff6b6b]"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
