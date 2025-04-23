// context/ApiContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

const ApiContext = createContext<ApiPromise | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<ApiPromise | null>(null);

  useEffect(() => {
    const connect = async () => {
        console.log(process.env.NEXT_PUBLIC_RPC)
      const provider = new WsProvider(process.env.NEXT_PUBLIC_RPC!);
      const apiInstance = await ApiPromise.create({ provider });
      await apiInstance.isReady;
      setApi(apiInstance);

      apiInstance.on("disconnected", () => {
        console.warn("Polkadot API disconnected. Consider reconnect logic.");
      });
    };

    connect();
  }, []);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiPromise {
  const api = useContext(ApiContext);
  if (!api) throw new Error("API not ready yet");
  return api;
}
