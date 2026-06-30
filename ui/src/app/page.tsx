"use client";

import { useCallback, useState } from "react";
import { TrendingUp, Briefcase, History, BarChart2 } from "lucide-react";
import { useDerivWS } from "@/hooks/useDerivWS";
import ConnectPanel from "@/components/ConnectPanel";
import StatsBar from "@/components/StatsBar";
import PriceChart from "@/components/PriceChart";
import TradePanel from "@/components/TradePanel";
import Portfolio from "@/components/Portfolio";
import ProfitTable from "@/components/ProfitTable";

type Tab = "trade" | "chart" | "portfolio" | "history";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "trade",     label: "Trade",     Icon: TrendingUp },
  { id: "chart",     label: "Chart",     Icon: BarChart2 },
  { id: "portfolio", label: "Positions", Icon: Briefcase },
  { id: "history",   label: "History",   Icon: History },
];

export default function Home() {
  const [credentials, setCredentials] = useState<{ token: string; appId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("trade");

  const {
    status, account, balance, portfolio, error,
    connect, disconnect,
    subscribeTicks, getTickHistory,
    getProposal, buyContract, sellContract, getProfitTable,
  } = useDerivWS(credentials ?? { token: "", appId: "1089" });

  const handleConnect = useCallback(
    (token: string, appId: string) => {
      setCredentials({ token, appId });
      setTimeout(() => connect(), 0);
    },
    [connect]
  );

  if (status !== "connected" || !account || balance === null) {
    return <ConnectPanel onConnect={handleConnect} error={error} status={status} />;
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <StatsBar
        account={account}
        balance={balance}
        openPositions={portfolio.length}
        onDisconnect={disconnect}
      />

      {/* Desktop layout: side by side */}
      <main className="hidden lg:flex flex-1 p-6 gap-4 max-w-[1400px] mx-auto w-full">
        <div className="flex-1 flex flex-col gap-4">
          <PriceChart subscribeTicks={subscribeTicks} getTickHistory={getTickHistory} />
          <Portfolio contracts={portfolio} currency={account.currency} onSell={sellContract} />
          <ProfitTable currency={account.currency} getProfitTable={getProfitTable} />
        </div>
        <div className="w-[360px] shrink-0">
          <TradePanel currency={account.currency} getProposal={getProposal} buyContract={buyContract} />
        </div>
      </main>

      {/* Mobile layout: tab-based */}
      <div className="lg:hidden flex-1 overflow-y-auto pb-20">
        <div className="p-3">
          {activeTab === "trade" && (
            <TradePanel currency={account.currency} getProposal={getProposal} buyContract={buyContract} />
          )}
          {activeTab === "chart" && (
            <PriceChart subscribeTicks={subscribeTicks} getTickHistory={getTickHistory} />
          )}
          {activeTab === "portfolio" && (
            <Portfolio contracts={portfolio} currency={account.currency} onSell={sellContract} />
          )}
          {activeTab === "history" && (
            <ProfitTable currency={account.currency} getProfitTable={getProfitTable} />
          )}
        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#1a1d27] border-t border-[#2a2d3a] flex safe-area-bottom">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? "text-[#ff444f]" : "text-[#4b5563]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {id === "portfolio" && portfolio.length > 0 && (
                <span className="absolute top-2 ml-4 w-4 h-4 bg-[#ff444f] rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {portfolio.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
