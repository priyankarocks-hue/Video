"use client";

import { useCallback, useState } from "react";
import { useDerivWS } from "@/hooks/useDerivWS";
import ConnectPanel from "@/components/ConnectPanel";
import StatsBar from "@/components/StatsBar";
import PriceChart from "@/components/PriceChart";
import TradePanel from "@/components/TradePanel";
import Portfolio from "@/components/Portfolio";
import ProfitTable from "@/components/ProfitTable";

export default function Home() {
  const [credentials, setCredentials] = useState<{ token: string; appId: string } | null>(null);

  const {
    status,
    account,
    balance,
    portfolio,
    error,
    connect,
    disconnect,
    subscribeTicks,
    getTickHistory,
    getProposal,
    buyContract,
    sellContract,
    getProfitTable,
  } = useDerivWS(credentials ?? { token: "", appId: "1089" });

  const handleConnect = useCallback(
    (token: string, appId: string) => {
      setCredentials({ token, appId });
      // connect() will be triggered after state update via the hook
      setTimeout(() => connect(), 0);
    },
    [connect]
  );

  if (status !== "connected" || !account || balance === null) {
    return (
      <ConnectPanel
        onConnect={handleConnect}
        error={error}
        status={status}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <StatsBar
        account={account}
        balance={balance}
        openPositions={portfolio.length}
        onDisconnect={disconnect}
      />

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-[1400px] mx-auto w-full">
        {/* Left column: chart + history */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <PriceChart
            subscribeTicks={subscribeTicks}
            getTickHistory={getTickHistory}
          />
          <Portfolio
            contracts={portfolio}
            currency={account.currency}
            onSell={sellContract}
          />
          <ProfitTable
            currency={account.currency}
            getProfitTable={getProfitTable}
          />
        </div>

        {/* Right column: trade panel */}
        <div className="lg:col-span-1">
          <TradePanel
            currency={account.currency}
            getProposal={getProposal}
            buyContract={buyContract}
          />
        </div>
      </main>
    </div>
  );
}
