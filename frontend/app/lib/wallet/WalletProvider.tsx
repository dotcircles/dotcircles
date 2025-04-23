"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { web3Enable, web3Accounts, web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta, InjectedExtension } from "@polkadot/extension-inject/types";

type WalletState = {
  extensions: InjectedExtension[];
  accounts: InjectedAccountWithMeta[];
  currentExt: InjectedExtension | null;
  currentAccount: InjectedAccountWithMeta | null;
  connect: (ext: InjectedExtension) => Promise<void>;
  selectAccount: (address: string) => void;
  disconnect: () => void;
};

const WalletCtx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [extensions, setExtensions] = useState<InjectedExtension[]>([]);
  const [currentExt, setCurrentExt] = useState<InjectedExtension | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [currentAccount, setCurrentAccount] = useState<InjectedAccountWithMeta | null>(null);

  // ───────── initial extension detection ─────────
  useEffect(() => {
    // run only in browser
    if (typeof window === "undefined") return;

    (async () => {
      // lazy‑import the extension‑dapp at runtime
      const { web3Enable } = await import("@polkadot/extension-dapp");
      const exts = await web3Enable("DOTCIRCLES");
      setExtensions(exts);
    })();
  }, []);

  const connect = async (ext: InjectedExtension) => {
    // again, ensure client side
    if (typeof window === "undefined") return;

    // dynamically import these APIs
    const { web3Accounts } = await import("@polkadot/extension-dapp");
    await import("@polkadot/extension-dapp").then((m) => m.web3Enable("DOTCIRCLES"));

    // fetch *all* accounts, then filter by source
    const all = await web3Accounts();
    const filtered = all.filter((acc) => acc.meta.source === ext.name);

    setCurrentExt(ext);
    setAccounts(filtered);
    setCurrentAccount(filtered[0] ?? null);
  };

  const selectAccount = (address: string) => {
    setCurrentAccount(accounts.find((a) => a.address === address) ?? null);
  };

  const disconnect = () => {
    setCurrentExt(null);
    setAccounts([]);
    setCurrentAccount(null);
  };

  return (
    <WalletCtx.Provider value={{ extensions, accounts, currentExt, currentAccount, connect, selectAccount, disconnect }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}