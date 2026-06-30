"use client";

import { useState } from "react";
import { TrendingUp, Lock, Zap } from "lucide-react";

interface Props {
  onConnect: (token: string, appId: string) => void;
  error: string | null;
  status: string;
}

export default function ConnectPanel({ onConnect, error, status }: Props) {
  const [token, setToken] = useState("");
  const [appId, setAppId] = useState("1089");

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-[#ff444f] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Deriv Trading</h1>
            <p className="text-[#6b7280] text-xs">Powered by Claude MCP</p>
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-1">Connect your account</h2>
          <p className="text-[#6b7280] text-sm mb-6">
            Enter your Deriv API token to get started. Your token is stored locally in your browser only.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[#9ca3af] text-xs font-medium mb-1.5 uppercase tracking-wide">
                API Token
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563]" />
                <input
                  type="password"
                  placeholder="Paste your API token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 pl-10 text-white text-sm placeholder-[#4b5563] focus:outline-none focus:border-[#ff444f] transition-colors"
                />
              </div>
              <p className="text-[#4b5563] text-xs mt-1">
                Get yours at{" "}
                <span className="text-[#ff444f]">app.deriv.com/account/api-token</span>
                {" "}— needs Read + Trade scopes
              </p>
            </div>

            <div>
              <label className="block text-[#9ca3af] text-xs font-medium mb-1.5 uppercase tracking-wide">
                App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff444f] transition-colors"
              />
              <p className="text-[#4b5563] text-xs mt-1">
                Use <span className="text-[#9ca3af]">1089</span> for testing, or register your own
              </p>
            </div>

            {error && (
              <div className="bg-[#2a1215] border border-[#5c1f1f] rounded-lg px-4 py-3 text-[#ff6b6b] text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => onConnect(token, appId)}
              disabled={!token || status === "connecting"}
              className="w-full bg-[#ff444f] hover:bg-[#e03940] disabled:bg-[#4b2528] disabled:text-[#9ca3af] text-white font-semibold rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
            >
              {status === "connecting" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
