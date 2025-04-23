// app/lib/hooks/useSubmitRoscaActions.ts
"use client";

import { useApi } from "@/app/lib/context/ApiContext";
import { useWallet } from "@/app/lib/wallet/WalletProvider";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { Signer } from "@polkadot/api/types";

interface TxResult {
    success: boolean;
    error?: string;
}

/** 
 * Performs a Polkadot extrinsic call and awaits the `Finalized` status. 
 * Dynamically imports extension-dapp APIs so it never runs on the server.
 */
async function executeTx(
    api: ApiPromise,
    account: string,
    txCreator: () => any,
    section: string,
    method: string
): Promise<TxResult> {
    try {
        // 1. Enable all extensions (loads window.injectedWeb3)
        const { web3Enable, web3FromAddress } = await import(
            "@polkadot/extension-dapp"
        );
        await web3Enable("DOTCIRCLES");

        // 2. Get injector for this account
        const injector = await web3FromAddress(account);

        // 3. Build the extrinsic
        const tx = txCreator();

        // 4. Sign & send, wait for Finalized + right event
        return new Promise((resolve, reject) => {
            tx.signAndSend(
                account,
                { signer: injector.signer as Signer, nonce: -1 },
                (result: SubmittableResult) => {
                    if (result.status.isFinalized) {
                        const evt = result.events.find(
                            ({ event: { section: s, method: m } }) =>
                                s === section && m === method
                        );
                        if (evt) {
                            resolve({ success: true });
                        } else {
                            reject({ success: false, error: `Missing ${method} event` });
                        }
                    }
                }
            ).catch((err: any) =>
                reject({ success: false, error: err.message || String(err) })
            );
        });
    } catch (err: any) {
        return { success: false, error: err.message || String(err) };
    }
}

/** Hook to join an existing ROSCA */
export function useSubmitJoinRosca() {
    const api = useApi();
    const { currentAccount } = useWallet();

    return async (roscaId: number): Promise<TxResult> => {
        if (!currentAccount) {
            return { success: false, error: "Wallet not connected" };
        }
        return executeTx(
            api,
            currentAccount.address,
            () => api.tx.rosca.joinRosca(roscaId, null),
            "rosca",
            "JoinedRosca"
        );
    };
}

/** Hook to leave a ROSCA before it starts */
export function useSubmitLeaveRosca() {
    const api = useApi();
    const { currentAccount } = useWallet();

    return async (roscaId: number): Promise<TxResult> => {
        if (!currentAccount) {
            return { success: false, error: "Wallet not connected" };
        }
        return executeTx(
            api,
            currentAccount.address,
            () => api.tx.rosca.leaveRosca(roscaId),
            "rosca",
            "LeftRosca"
        );
    };
}

/** Hook to start a ROSCA once the threshold is met */
export function useSubmitStartRosca() {
    const api = useApi();
    const { currentAccount } = useWallet();

    return async (roscaId: number): Promise<TxResult> => {
        if (!currentAccount) {
            return { success: false, error: "Wallet not connected" };
        }
        return executeTx(
            api,
            currentAccount.address,
            () => api.tx.rosca.startRosca(roscaId),
            "rosca",
            "RoscaStarted"
        );
    };
}

/** Hook to add to a security deposit */
export function useSubmitAddToSecurityDeposit() {
    const api = useApi();
    const { currentAccount } = useWallet();

    return async (roscaId: number, amount: number): Promise<TxResult> => {
        if (!currentAccount) {
            return { success: false, error: "Wallet not connected" };
        }
        return executeTx(
            api,
            currentAccount.address,
            () => api.tx.rosca.addToSecurityDeposit(roscaId, amount),
            "rosca",
            "SecurityDepositContribution"
        );
    };
}
