"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/deriv";

interface Trade {
  contract_id: number;
  contract_type: string;
  buy_price: number;
  sell_price: number;
  purchase_time: number;
  sell_time: number;
  longcode: string;
}

interface Props {
  currency: string;
  getProfitTable: (limit?: number) => Promise<Record<string, unknown>[]>;
}

export default function ProfitTable({ currency, getProfitTable }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    getProfitTable(25).then((raw) => {
      const t = raw as unknown as Trade[];
      setTrades(t);
      const pnl = t.reduce((sum, tx) => sum + (tx.sell_price - tx.buy_price), 0);
      setTotalPnl(pnl);
      setLoading(false);
    });
  }, [getProfitTable]);

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Trade History</h2>
        <div className={`text-sm font-bold font-mono ${totalPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl, currency)}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#4b5563] border-t-[#ff444f] rounded-full animate-spin" />
        </div>
      ) : trades.length === 0 ? (
        <p className="text-[#4b5563] text-sm text-center py-6">No trade history</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#4b5563] text-xs uppercase tracking-wide border-b border-[#2a2d3a]">
                <th className="text-left pb-2 font-medium">Type</th>
                <th className="text-right pb-2 font-medium">Stake</th>
                <th className="text-right pb-2 font-medium">Payout</th>
                <th className="text-right pb-2 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const pnl = t.sell_price - t.buy_price;
                const won = pnl > 0;
                return (
                  <tr key={t.contract_id} className="border-b border-[#1e2130]">
                    <td className="py-2.5">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          t.contract_type === "CALL"
                            ? "bg-[#14532d]/60 text-[#4ade80]"
                            : t.contract_type === "PUT"
                            ? "bg-[#450a0a]/60 text-[#f87171]"
                            : "bg-[#1e2235] text-[#9ca3af]"
                        }`}
                      >
                        {t.contract_type === "CALL"
                          ? "Rise"
                          : t.contract_type === "PUT"
                          ? "Fall"
                          : t.contract_type}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[#9ca3af] font-mono text-xs">
                      {formatCurrency(t.buy_price, currency)}
                    </td>
                    <td className="py-2.5 text-right text-[#9ca3af] font-mono text-xs">
                      {formatCurrency(t.sell_price, currency)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono text-xs font-semibold ${
                        won ? "text-[#22c55e]" : "text-[#ef4444]"
                      }`}
                    >
                      {won ? "+" : ""}{formatCurrency(pnl, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
