// src/components/rosca/CreateRosca.tsx

"use client";


import { ApiPromise, WsProvider } from "@polkadot/api";
import {
    web3Accounts,
    web3Enable,
    web3FromAddress,
  } from "@polkadot/extension-dapp";


import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Checkbox } from "@heroui/checkbox";
import { DatePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import { now } from "@internationalized/date";
import CreateToast from "../ui/CreateToast";
import { toast } from "sonner";

export default function CreateRosca() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [circleName, setCircleName] = useState("");
  const [randomOrder, setRandomOrder] = useState(false);
  const [startByDate, setStartByDate] = useState(now("UTC").add({ days: 1 }));
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState("100800");
  const [minParticipants, setMinParticipants] = useState("");
  const [participants, setParticipants] = useState<string[]>([""]);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  const handleAddParticipant = () => {
    setParticipants([...participants, ""]);
  };

  const handleParticipantChange = (index: number, value: string) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

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


    const handleCreate = async () => {

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
          success: (toast): any => toast,
          error: (message) => message,
        });
    
        try {
          const extensions = await web3Enable("DOTCIRCLES");
          const acc = await web3FromAddress("5FEda1GYvjMYcBiuRE7rb85QbD5bQNHuZajhRvHYTxm4PPz5");
    
          const tx = api!.tx.rosca.createRosca(
            randomOrder,
            participants,
            minParticipants,
            contributionAmount,
            contributionFrequency,
            startByDate,
            null,
            circleName
          );
    
          const unsub = await tx.signAndSend(
            "5FEda1GYvjMYcBiuRE7rb85QbD5bQNHuZajhRvHYTxm4PPz5",
            {
              signer: acc.signer,
              nonce: -1,
            },
            ({ events = [], status, txHash }) => {
              console.log("Broadcasting create");
              if (status.isFinalized) {
                console.log("Tx finalize");
                events.forEach(({ phase, event: { data, method, section } }) => {
                  console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                });
                const roscaCreated = events.find(({ event }: any) =>
                  api!.events.rosca.RoscaCreated.is(event)
                );
                if (roscaCreated) {
                  let eventData = roscaCreated.event.data;
                  resolvePromise(
                    <CreateToast
                      name={eventData[4].toHuman()}
                      contributionAmount={eventData[1].toString()}
                      contributionFrequency={
                        eventData[2].toString() == "100800" ? "Weekly" : "Monthly"
                      }
                      randomOrder={eventData[3].toString()}
                    />
                  );
                } else {
                  rejectPromise("Rosca creation failed");
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
      <Button onPress={onOpen} color="primary" radius="full">
        Create a new circle
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Saving Circle Information
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Circle Name"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  variant="bordered"
                />

                <Checkbox isSelected={randomOrder} onChange={(e) => setRandomOrder(e.target.checked)}>
                  Random Order
                </Checkbox>

                <DatePicker label="Start By Date" value={startByDate} onChange={setStartByDate} variant="bordered" hideTimeZone />

                <Input
                  label="Contribution Amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  variant="bordered"
                />

                <Select
                  label="Contribution Frequency"
                  selectedKeys={[contributionFrequency]}
                  onChange={(e) => setContributionFrequency(e.target.value)}
                  variant="bordered"
                >
                  <SelectItem key="100800">Weekly</SelectItem>
                  <SelectItem key="436800">Monthly</SelectItem>
                </Select>

                {participants.map((participant, index) => (
                  <Input
                    key={index}
                    label={`Participant ${index + 1}`}
                    value={participant}
                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                    variant="bordered"
                  />
                ))}

                <Button onPress={handleAddParticipant} variant="bordered" fullWidth>
                  + Add Participant
                </Button>

                <Input
                  label="Minimum Participants"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} radius="full">
                  Close
                </Button>
                <Button color="primary" onPress={handleCreate} radius="full">
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
