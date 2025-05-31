"use client";

import React, { useState } from "react";
import { useWallet } from "@/app/lib/wallet/WalletProvider";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalContent } from "@heroui/modal";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { Chip } from "@heroui/chip";

export default function WalletConnectButton() {
  const { extensions, accounts, currentExt, currentAccount, connect, selectAccount, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  const handleExtClick = async (extName: string) => {
    const ext = extensions.find((e) => e.name === extName);
    if (ext) await connect(ext);
  };

  return (
    <>
      {currentAccount ? (
        <Button variant="flat" radius="full" onPress={() => setOpen(true)}>
          {currentAccount.meta.name ?? "Account"} <Chip size="sm">{currentExt?.name}</Chip>
        </Button>
      ) : (
        <Button color="primary" radius="full" onPress={() => setOpen(true)}>
          Connect Wallet
        </Button>
      )}

      <Modal isOpen={open} onOpenChange={setOpen}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader>{currentAccount ? "Wallet Settings" : "Connect a Wallet"}</ModalHeader>
              <ModalBody className="space-y-4">
                {/* ① Extension picker */}
                <div>
                  <p className="text-sm font-medium mb-1">Extensions</p>
                  <Listbox
                    aria-label="extensions"
                    selectionMode="single"
                    selectedKeys={currentExt ? [currentExt.name] : []}
                    onSelectionChange={(keys) => handleExtClick(Array.from(keys)[0] as string)}
                  >
                    {extensions.map((ext) => (
                      <ListboxItem key={ext.name}>{ext.name}</ListboxItem>
                    ))}
                  </Listbox>
                </div>

                {/* ② Account picker */}
                {currentExt && (
                  <div>
                    <p className="text-sm font-medium mb-1">Accounts</p>
                    <Listbox
                      aria-label="accounts"
                      selectionMode="single"
                      selectedKeys={currentAccount ? [currentAccount.address] : []}
                      onSelectionChange={(keys) => selectAccount(Array.from(keys)[0] as string)}
                    >
                      {accounts.map((acc) => (
                        <ListboxItem key={acc.address}>{acc.meta.name ?? acc.address}</ListboxItem>
                      ))}
                    </Listbox>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {currentAccount && (
                  <Button color="danger" variant="light" onPress={disconnect}>
                    Disconnect
                  </Button>
                )}
                <Button color="primary" onPress={() => setOpen(false)}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
