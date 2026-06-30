"use client";

import { Wallet, Activity, TrendingUp, LogOut } from "lucide-react";
import type { AccountInfo } from "@/lib/deriv";
import { formatCurrency } from "@/lib/deriv";

interface Props {
  account: AccountInfo;
  balance: number;
  openPositions: number;
  onDisconnect: () => void;
}

export default function StatsBar({ account, balance, openPositions, onDisconnect }: Props) {
  return (
    <header className="bg-[#1a1d27] border-b border-[#2a2d3a] px-4 py-2.5 flex items-center justify-between gap-2">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 bg-[#ff444f] rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold text-sm">Deriv</span>
          {account.is_virtual === 1 && (
            <span className="text-[10px] bg-[#1e3a5f] text-[#60a5fa] px-1.5 py-0.5 rounded font-semibold">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Balance — always visible */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Wallet className="w-3.5 h-3.5 text-[#6b7280] shrink-0" />
        <span className="text-white text-sm font-bold font-mono tabular-nums">
          {formatCurrency(balance, account.currency)}
        </span>
      </div>

      {/* Open positions badge — mobile */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-[#6b7280]" />
        <span className="text-white text-sm font-bold">{openPositions}</span>
        <span className="text-[#6b7280] text-xs hidden sm:inline">open</span>
      </div>

      {/* Account ID — hidden on small */}
      <span className="text-[#6b7280] text-xs font-medium hidden sm:inline truncate max-w-[100px]">
        {account.loginid}
      </span>

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        className="shrink-0 text-[#6b7280] hover:text-white p-1.5 -mr-1 rounded-lg transition-colors"
        aria-label="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}
