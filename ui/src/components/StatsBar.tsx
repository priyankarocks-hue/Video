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
    <header className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#ff444f] rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-sm">Deriv</span>
        {account.is_virtual === 1 && (
          <span className="text-xs bg-[#1e3a5f] text-[#60a5fa] px-1.5 py-0.5 rounded font-medium">DEMO</span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#6b7280]" />
          <div>
            <p className="text-[#4b5563] text-xs">Balance</p>
            <p className="text-white text-sm font-bold font-mono">
              {formatCurrency(balance, account.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#6b7280]" />
          <div>
            <p className="text-[#4b5563] text-xs">Open</p>
            <p className="text-white text-sm font-bold">{openPositions}</p>
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-[#4b5563] text-xs">Account</p>
          <p className="text-white text-sm font-medium">{account.loginid}</p>
        </div>
      </div>

      {/* Disconnect */}
      <button
        onClick={onDisconnect}
        className="flex items-center gap-1.5 text-[#6b7280] hover:text-white text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Disconnect</span>
      </button>
    </header>
  );
}
