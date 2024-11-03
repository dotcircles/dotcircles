"use client";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { myAddress } from "@/app/lib/mock";
import { DatePicker } from "@nextui-org/date-picker";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/modal";

import { Select, SelectItem, SelectSection } from "@nextui-org/select";

import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Checkbox, CheckboxGroup } from "@nextui-org/checkbox";
import { useEffect, useState } from "react";
import { NameMap } from "@/app/lib/mock";
import { toast, Toaster } from "sonner";
import CreateToast from "./toasts/createToast";
import {
  CalendarDate,
  CalendarDateTime,
  getLocalTimeZone,
  now,
  parseAbsolute,
  parseDate,
  ZonedDateTime,
} from "@internationalized/date";
import { DateInput } from "@nextui-org/date-input";

export default function CreateRosca() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure({
    onOpen: () => console.log("Modal opened"),
  });

  const [frequencyOpen, setFrequencyOpen] = useState(true);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  const [circleName, setCircleName] = useState("");
  // const [startBy, setStartBy] = useState("");
  const [startByDate, setStartByDate] = useState(now("UTC").add({ days: 1 }));
  const [contributionAmount, setContributionAmount] = useState("");
  // const [contributionFrequency, setContributionFrequency] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState("100800");
  const [minParticipants, setMinParticipants] = useState("");
  const [randomOrder, setRandomOrder] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([
    "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
    "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc",
  ]);

  const secondsPerBlock = 6;
  const weekAsBlocks = 100800;
  const monthAsBlocks = 436800;

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

  const calculateBlockNumber = (targetDate: ZonedDateTime): number => {
    const currentTime = now("UTC");
    const targetZoned = targetDate.toDate();
    const secondsDifference =
      (targetZoned.getTime() - currentTime.toDate().getTime()) / 1000;
    const blockNumber = Math.floor(secondsDifference / 6);

    return blockNumber; // Convert to block numbers assuming 6s block time
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setContributionFrequency(e.target.value);
  };

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
      const acc = await web3FromAddress(myAddress);
      const startByBlock = calculateBlockNumber(startByDate);
      const currentBlockNumber = (
        await api!.derive.chain.bestNumber()
      ).toNumber();
      console.log("startByBlock", startByBlock);

      const tx = api!.tx.rosca.createRosca(
        randomOrder,
        selectedParticipants,
        minParticipants,
        contributionAmount,
        contributionFrequency,
        currentBlockNumber + startByBlock,
        null,
        circleName
      );

      const unsub = await tx.signAndSend(
        myAddress,
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
      <Button onPress={onOpen} color="primary">
        Create a new circle
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Saving Circle Information
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Name"
                  placeholder="Enter Saving Circle name"
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  variant="bordered"
                />
                <Checkbox
                  isSelected={randomOrder}
                  onChange={(e) => setRandomOrder(e.target.checked)}
                  classNames={{
                    label: "text-small",
                  }}
                >
                  Random Order
                </Checkbox>
                {/* <DatePicker label="Birth date" className="max-w-[284px]" /> */}
                <DatePicker
                  label="Start By Date"
                  variant="bordered"
                  hideTimeZone
                  showMonthAndYearPickers
                  value={startByDate}
                  onChange={setStartByDate}
                  minValue={now("UTC").add({ hours: 12 })}
                />
                <Input
                  label="Contribution Amount"
                  placeholder="Enter contribution amount"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  variant="bordered"
                />
                <Select
                  label="Contribution Frequency"
                  variant="bordered"
                  placeholder="Select a frequency"
                  selectedKeys={[contributionFrequency]}
                  className="max-w-xs"
                  onChange={handleFrequencyChange}
                >
                  <SelectItem key={"100800"}>Weekly</SelectItem>
                  <SelectItem key={"436800"}>Monthly</SelectItem>
                </Select>
                <CheckboxGroup
                  label="Select participants"
                  color="warning"
                  value={selectedParticipants}
                  onValueChange={setSelectedParticipants}
                >
                  <Checkbox value="5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY">
                    Alice Simmons
                  </Checkbox>
                  <Checkbox value="5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc">
                    Bob Jacobs
                  </Checkbox>
                  <Checkbox value="5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y">
                    Charlie Rush
                  </Checkbox>
                  <Checkbox value="5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy">
                    Dave Broad
                  </Checkbox>
                </CheckboxGroup>
                <Input
                  label="Min Participants"
                  placeholder="Enter minimum participants"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={handleCreate}>
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
