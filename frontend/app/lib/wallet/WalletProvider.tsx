"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { web3Enable, web3Accounts, web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta, InjectedExtension } from "@polkadot/extension-inject/types";
import { useRouter } from "next/navigation";

type WalletState = {
  extensions: InjectedExtension[];
  accounts: InjectedAccountWithMeta[];
  currentExt: InjectedExtension | null;
  currentAccount: InjectedAccountWithMeta | null;
  connect: (ext: InjectedExtension) => Promise<void>;
  isWalletLoading: boolean;
  selectAccount: (address: string) => void;
  disconnect: () => void;
};

const WalletCtx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [extensions, setExtensions] = useState<InjectedExtension[]>([]);
  const [currentExt, setCurrentExt] = useState<InjectedExtension | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [currentAccount, setCurrentAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(true);
  const router = useRouter();

  // ───────── initial extension detection ─────────
  useEffect(() => {
    if (typeof window === "undefined") return;
  
    (async () => {
      const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");
      const exts = await web3Enable("DOTCIRCLES");
      setExtensions(exts);
  
      const storedExt = localStorage.getItem("wallet:ext");
      const storedAddress = localStorage.getItem("wallet:address");
  
      if (storedExt) {
        const ext = exts.find((e) => e.name === storedExt);
        if (ext) {
          const allAccounts = await web3Accounts();
          const filtered = allAccounts.filter((acc) => acc.meta.source === ext.name);
  
          setCurrentExt(ext);
          setAccounts(filtered);
  
          const acct = filtered.find((acc) => acc.address === storedAddress);
          setCurrentAccount(acct ?? filtered[0] ?? null);
        }
      }
      setIsWalletLoading(false);
    })();
  }, []);

  const connect = async (ext: InjectedExtension) => {
    if (typeof window === "undefined") return;
  
    const { web3Accounts } = await import("@polkadot/extension-dapp");
    await import("@polkadot/extension-dapp").then((m) => m.web3Enable("DOTCIRCLES"));
  
    const all = await web3Accounts();
    const filtered = all.filter((acc) => acc.meta.source === ext.name);
  
    setCurrentExt(ext);
    setAccounts(filtered);
    setCurrentAccount(filtered[0] ?? null);
  
    // Save to localStorage
    localStorage.setItem("wallet:ext", ext.name);
    if (filtered[0]) {
      localStorage.setItem("wallet:address", filtered[0].address);
    }
  };
  
  const selectAccount = (address: string) => {
    const selected = accounts.find((a) => a.address === address) ?? null;
    console.log(selected)
    setCurrentAccount(selected);
    if (selected) {
      localStorage.setItem("wallet:address", selected.address);
    }
    router.refresh();
  };
  
  const disconnect = () => {
    setCurrentExt(null);
    setAccounts([]);
    setCurrentAccount(null);
    localStorage.removeItem("wallet:ext");
    localStorage.removeItem("wallet:address");
  };
  

  return (
    <WalletCtx.Provider value={{ extensions, accounts, currentExt, currentAccount, connect, selectAccount, disconnect, isWalletLoading }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}