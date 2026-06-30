"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountInfo, OpenContract, Tick } from "@/lib/deriv";
import { DERIV_WS_URL } from "@/lib/deriv";

type Status = "disconnected" | "connecting" | "connected" | "error";

interface UseDerivWSOptions {
  appId: string;
  token: string;
}

export function useDerivWS({ appId, token }: UseDerivWSOptions) {
  const ws = useRef<WebSocket | null>(null);
  const reqId = useRef(0);
  const pendingRef = useRef<Map<number, (r: unknown) => void>>(new Map());
  const tickSubRef = useRef<((tick: Tick) => void) | null>(null);
  const activeSubId = useRef<string | null>(null);

  const [status, setStatus] = useState<Status>("disconnected");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<OpenContract[]>([]);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback((payload: Record<string, unknown>): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      reqId.current += 1;
      const id = reqId.current;
      payload.req_id = id;
      pendingRef.current.set(id, resolve);
      ws.current.send(JSON.stringify(payload));
      // Timeout after 10s
      setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          reject(new Error("Request timed out"));
        }
      }, 10000);
    });
  }, []);

  const connect = useCallback(async () => {
    if (!token || !appId) return;
    setStatus("connecting");
    setError(null);

    const socket = new WebSocket(`${DERIV_WS_URL}?app_id=${appId}`);
    ws.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      // Balance stream
      if (msg.msg_type === "balance" && msg.balance) {
        setBalance(parseFloat(msg.balance.balance));
      }

      // Tick stream
      if (msg.msg_type === "tick" && msg.tick && tickSubRef.current) {
        tickSubRef.current({ epoch: msg.tick.epoch, quote: msg.tick.quote });
      }

      // Resolve pending request
      const id = msg.req_id;
      if (id && pendingRef.current.has(id)) {
        const resolve = pendingRef.current.get(id)!;
        pendingRef.current.delete(id);
        resolve(msg);
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setError("WebSocket connection failed");
    };

    socket.onclose = () => {
      setStatus("disconnected");
    };

    await new Promise<void>((resolve) => {
      socket.onopen = () => resolve();
    });

    try {
      const authResp = await send({ authorize: token }) as Record<string, unknown>;
      if ((authResp as Record<string, unknown>).error) {
        const err = (authResp as Record<string, { message: string }>).error;
        setError(`Auth failed: ${err.message}`);
        setStatus("error");
        return;
      }

      const auth = (authResp as { authorize: AccountInfo }).authorize;
      setAccount(auth);
      setBalance(auth.balance);
      setStatus("connected");

      // Subscribe to balance stream
      send({ balance: 1, subscribe: 1 });

      // Load portfolio
      const portResp = await send({ portfolio: 1 }) as { portfolio: { contracts: OpenContract[] } };
      setPortfolio(portResp.portfolio?.contracts ?? []);
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }, [appId, token, send]);

  const disconnect = useCallback(() => {
    ws.current?.close();
    ws.current = null;
    setStatus("disconnected");
    setAccount(null);
    setBalance(null);
    setPortfolio([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { ws.current?.close(); };
  }, []);

  const subscribeTicks = useCallback(
    async (symbol: string, onTick: (tick: Tick) => void) => {
      // Forget previous subscription
      if (activeSubId.current) {
        send({ forget: activeSubId.current }).catch(() => {});
        activeSubId.current = null;
      }
      tickSubRef.current = onTick;
      const resp = await send({ ticks: symbol, subscribe: 1 }) as Record<string, unknown>;
      const subId = (resp as { subscription?: { id: string } }).subscription?.id;
      if (subId) activeSubId.current = subId;
    },
    [send]
  );

  const getTickHistory = useCallback(
    async (symbol: string, count = 150) => {
      const resp = await send({
        ticks_history: symbol,
        end: "latest",
        count,
        style: "ticks",
      }) as { history: { times: number[]; prices: number[] } };
      const { times, prices } = resp.history;
      return times.map((t, i) => ({ epoch: t, quote: prices[i] })) as Tick[];
    },
    [send]
  );

  const getProposal = useCallback(
    async (params: {
      symbol: string;
      contractType: string;
      amount: number;
      duration: number;
      durationUnit: string;
      basis: string;
      barrier?: string;
    }) => {
      const req: Record<string, unknown> = {
        proposal: 1,
        symbol: params.symbol,
        contract_type: params.contractType,
        amount: params.amount,
        duration: params.duration,
        duration_unit: params.durationUnit,
        basis: params.basis,
        currency: account?.currency ?? "USD",
      };
      if (params.barrier) req.barrier = params.barrier;
      const resp = await send(req) as { proposal?: unknown; error?: { message: string } };
      if (resp.error) throw new Error(resp.error.message);
      return resp.proposal as {
        id: string;
        ask_price: number;
        payout: number;
        longcode: string;
        spot: number;
        date_expiry: number;
      };
    },
    [send, account]
  );

  const buyContract = useCallback(
    async (buyId: string, price: number) => {
      const resp = await send({ buy: buyId, price }) as { buy?: unknown; error?: { message: string } };
      if (resp.error) throw new Error(resp.error.message);
      // Refresh portfolio
      const portResp = await send({ portfolio: 1 }) as { portfolio: { contracts: OpenContract[] } };
      setPortfolio(portResp.portfolio?.contracts ?? []);
      return resp.buy as {
        contract_id: number;
        buy_price: number;
        payout: number;
        longcode: string;
        shortcode: string;
      };
    },
    [send]
  );

  const sellContract = useCallback(
    async (contractId: number) => {
      const resp = await send({ sell: contractId, price: 0 }) as { sell?: unknown; error?: { message: string } };
      if (resp.error) throw new Error(resp.error.message);
      const portResp = await send({ portfolio: 1 }) as { portfolio: { contracts: OpenContract[] } };
      setPortfolio(portResp.portfolio?.contracts ?? []);
      return resp.sell;
    },
    [send]
  );

  const getProfitTable = useCallback(
    async (limit = 25): Promise<Record<string, unknown>[]> => {
      const resp = await send({ profit_table: 1, description: 1, limit }) as {
        profit_table: { transactions: Record<string, unknown>[] };
      };
      return resp.profit_table?.transactions ?? [];
    },
    [send]
  );

  return {
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
  };
}
