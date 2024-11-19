"use client";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";
import { Slider } from "@nextui-org/slider";
import { useEffect, useState } from "react";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import { myAddress } from "@/app/lib/mock";
import { Input } from "@nextui-org/input";

export default function AddSecurityDepositModal({
  roscaId,
}: {
  roscaId: number;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure({
    onOpen: () => console.log("Modal opened"),
  });

  const [deposit, setDeposit] = useState<string>("0");

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

    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, []);

  const handleTopUp = async () => {
    if (!isApiReady) {
      console.log("API is not ready");
      return;
    }

    try {
      const extensions = await web3Enable("DOTCIRCLES");
      const acc = await web3FromAddress(myAddress);

      const tx = api!.tx.rosca.addToSecurityDeposit(roscaId, deposit);

      const hash = await tx.signAndSend(myAddress, {
        signer: acc.signer,
        nonce: -1,
      });
    } catch (error) {
      console.error("Failed to submit extrinsic", error);
    }
  };
  return (
    <>
      <Button
        onPress={onOpen}
        className={`bg-gradient-to-tr from-rose-500 to-purple-500 text-white shadow-lg`}
        radius="full"
      >
        Top Up
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add a security deposit
              </ModalHeader>

              <ModalBody>
                <Input
                  label="Deposit"
                  placeholder="Enter a deposit"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onClose}
                  radius="full"
                >
                  Close
                </Button>
                <Button
                  className="bg-gradient-to-tr from-rose-500 to-purple-500 text-white"
                  onPress={handleTopUp}
                  radius="full"
                >
                  Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
