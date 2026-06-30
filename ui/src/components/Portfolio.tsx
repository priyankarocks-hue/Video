"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import type { OpenContract } from "@/lib/deriv";
import { formatCurrency, formatTime } from "@/lib/deriv";

interface Props {
  contracts: OpenContract[];
  currency: string;
  onSell: (contractId: number) => Promise<unknown>;
}

export default function Portfolio({ contracts, currency, onSell }: Props) {
  const [selling, setSelling] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);

  async function handleSell(contractId: number) {
    setSelling(contractId);
    setConfirm(null);
    try {
      await onSell(contractId);
    } finally {
      setSelling(null);
    }
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-3">Open Positions</h2>
        <p className="text-[#4b5563] text-sm text-center py-6">No open positions</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Open Positions</h2>
        <span className="bg-[#ff444f]/20 text-[#ff444f] text-xs font-medium px-2 py-0.5 rounded-full">
          {contracts.length}
        </span>
      </div>

      <div className="space-y-2">
        {contracts.map((c) => {
          const isSelling = selling === c.contract_id;
          const needsConfirm = confirm === c.contract_id;

          return (
            <div
              key={c.contract_id}
              className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium">{c.symbol}</span>
                  <span className="text-[#6b7280] text-xs bg-[#1a1d27] px-1.5 py-0.5 rounded">
                    {c.contract_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#4b5563]">
                  <span>Paid: {formatCurrency(c.buy_price, currency)}</span>
                  <span>Payout: {formatCurrency(c.payout, currency)}</span>
                  {c.expiry_time && (
                    <span>Exp: {formatTime(c.expiry_time)}</span>
                  )}
                </div>
              </div>

              {needsConfirm ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSell(c.contract_id)}
                    disabled={isSelling}
                    className="text-xs bg-[#dc2626] hover:bg-[#b91c1c] text-white px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {isSelling ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirm(null)}
                    className="text-xs bg-[#1a1d27] border border-[#2a2d3a] text-[#6b7280] px-2 py-1.5 rounded-lg"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirm(c.contract_id)}
                  className="shrink-0 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#1f1215] p-1.5 rounded-lg transition-colors"
                  title="Sell contract"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
