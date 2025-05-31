// context/ApiContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Spinner } from "@heroui/spinner";

const ApiContext = createContext<ApiPromise | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isReady, setReady] = useState<boolean>(false);

  useEffect(() => {
    const connect = async () => {
      const provider = new WsProvider(process.env.NEXT_PUBLIC_RPC!);
      const apiInstance = await ApiPromise.create({ provider });
      const ready = await cryptoWaitReady();
      setApi(apiInstance);
      setReady(ready);

      apiInstance.on("disconnected", () => {
        console.warn("Polkadot API disconnected. Consider reconnect logic.");
      });
    };

    connect();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner classNames={{label: "text-foreground mt-4"}} label="Connecting" variant="wave" />
      </div>
    );
  }

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiPromise {
  const api = useContext(ApiContext);
  if (!api) throw new Error("API not ready yet");
  return api;
}
