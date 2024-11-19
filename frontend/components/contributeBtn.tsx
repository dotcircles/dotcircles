"use client";

import { useState, useEffect } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

import { myAddress } from "@/app/lib/mock";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";

import { Button } from "@nextui-org/button";
import { redirect } from "next/navigation";
import { Toaster, toast } from "sonner";
import Error from "next/error";

export default function ContributeRoscaBtn({ roscaId }: any) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    const initApi = async () => {
      try {
        // Initialize the provider to connect to the node
        const provider = new WsProvider(process.env.NEXT_PUBLIC_RPC);

        // Create the API and wait until ready
        const api = await ApiPromise.create({ provider });
        await api.isReady;

        // Update state
        setApi(api);
        setIsApiReady(true);
      } catch (error) {
        console.error("Failed to initialize API", error);
      }
    };

    initApi();

    // Cleanup when the component unmounts
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  const handleContribute = async () => {
    if (!isApiReady) {
      console.log("API is not ready");
      return;
    }

    let resolvePromise: any, rejectPromise: any;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    toast.promise(promise, {
      loading: "Loading...",
      success: () => "Contribution successful",
      error: "Transaction failed",
    });

    try {
      const extensions = await web3Enable("DOTCIRCLES");
      const acc = await web3FromAddress(myAddress);
      // Replace with your actual extrinsic submission logic
      const tx = api!.tx.rosca.contributeToRosca(roscaId);

      const unsub = await tx.signAndSend(
        myAddress,
        {
          signer: acc.signer,
          nonce: -1,
        },
        ({ events = [], status, txHash }) => {
          console.log("Broadcasting contribution");

          if (status.isFinalized) {
            console.log("Tx finalize");
            const contributionMade = events.find(({ event }: any) =>
              api!.events.rosca.ContributionMade.is(event)
            );
            if (contributionMade) {
              resolvePromise();
            } else {
              rejectPromise();
            }
            unsub();
          }
        }
      );
    } catch (error) {
      rejectPromise(`Failed to submit extrinsic: ${error}`);
      console.error("Failed to submit extrinsic", error);
    }
  };
  return (
    <>
      <Button
        onClick={handleContribute}
        className={`w-6/12 text-white bg-fuchsia-400`}
        radius="full"
      >
        "Contribute"
      </Button>
    </>
  );
}
