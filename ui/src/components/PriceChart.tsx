"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Tick } from "@/lib/deriv";
import { formatTime, POPULAR_SYMBOLS } from "@/lib/deriv";

interface Props {
  subscribeTicks: (symbol: string, onTick: (t: Tick) => void) => Promise<void>;
  getTickHistory: (symbol: string, count?: number) => Promise<Tick[]>;
}

export default function PriceChart({ subscribeTicks, getTickHistory }: Props) {
  const [symbol, setSymbol] = useState("R_100");
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const ticksRef = useRef<Tick[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    ticksRef.current = [];

    getTickHistory(symbol, 150).then((history) => {
      if (!mounted) return;
      ticksRef.current = history;
      setTicks([...history]);
      if (history.length > 1) {
        const last = history[history.length - 1].quote;
        const first = history[0].quote;
        setCurrentPrice(last);
        setPriceChange(((last - first) / first) * 100);
      }
      setLoading(false);
    });

    subscribeTicks(symbol, (tick) => {
      if (!mounted) return;
      ticksRef.current = [...ticksRef.current.slice(-299), tick];
      setTicks([...ticksRef.current]);
      setCurrentPrice(tick.quote);
      if (ticksRef.current.length > 1) {
        const first = ticksRef.current[0].quote;
        setPriceChange(((tick.quote - first) / first) * 100);
      }
    });

    return () => { mounted = false; };
  }, [symbol, subscribeTicks, getTickHistory]);

  const isUp = priceChange >= 0;
  const chartColor = isUp ? "#22c55e" : "#ef4444";

  const data = ticks.map((t) => ({
    time: formatTime(t.epoch),
    price: t.quote,
  }));

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[#0f1117] border border-[#2a2d3a] text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#ff444f]"
          >
            {POPULAR_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.name}
              </option>
            ))}
          </select>
          {loading && (
            <div className="w-4 h-4 border-2 border-[#4b5563] border-t-[#ff444f] rounded-full animate-spin" />
          )}
        </div>

        <div className="text-right">
          <div className="text-white text-2xl font-mono font-bold">
            {currentPrice?.toFixed(3) ?? "—"}
          </div>
          <div
            className={`text-sm font-medium flex items-center gap-1 justify-end ${
              isUp ? "text-[#22c55e]" : "text-[#ef4444]"
            }`}
          >
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isUp ? "+" : ""}{priceChange.toFixed(3)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: "#4b5563", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tickCount={4}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#4b5563", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1d27",
                border: "1px solid #2a2d3a",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
              formatter={(v) => [Number(v).toFixed(5), "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
