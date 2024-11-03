import { now, ZonedDateTime } from "@internationalized/date";
import { AvatarMap, myAddress, NameMap } from "./mock";
import { Avatar } from "@nextui-org/avatar";

export function createDepositRows(data: any) {
  return data.map((details: any) => {
    return {
      key: details[0],
      avatar: (
        <Avatar
          src={AvatarMap[details[0] as string]}
          name={NameMap[details[0] as string]}
          size="lg"
        />
      ),
      name: (
        <div className="">
          <span>{NameMap[details[0] as string]}</span>
        </div>
      ),
      amount: details[1],
      showButton: details[0] == myAddress,
    };
  });
}

export function createDefaulterTableData(data: any) {
  const rows = data.map((details: any) => {
    return {
      key: details[0],
      avatar: (
        <Avatar
          src={AvatarMap[details[0] as string]}
          name={NameMap[details[0] as string]}
          size="lg"
        />
      ),
      name: (
        <div className="">
          <span>{NameMap[details[0] as string]}</span>
        </div>
      ),
      defaultCount: details[1],
    };
  });

  return rows;
}

export function blockNumberToDate(
  currentBlockNumber: number,
  targetBlockNumber: number
) {
  const currentDate = now("UTC");

  const blockDifference = targetBlockNumber - currentBlockNumber;

  const secondsOffset = blockDifference * 6;

  const targetDate = currentDate.add({ seconds: secondsOffset });

  const formatted = formatDateTime(targetDate);

  return formatted;
}

function formatDateTime(date: ZonedDateTime) {
  // Convert ZonedDateTime to a JavaScript Date object
  const jsDate = date.toDate();

  // Use Intl.DateTimeFormat for custom formatting
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return formatter.format(jsDate);
}
