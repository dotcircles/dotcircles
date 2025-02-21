"use client";

import { useState, useEffect } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

import AddSecurityDepositModal from "components/addSecurityDeposit";

import { Button } from "@nextui-org/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@nextui-org/table";
import { myAddress } from "@/app/lib/mock";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import { useDisclosure } from "@nextui-org/modal";

const columns = [
  {
    key: "avatar",
    label: "",
  },
  {
    key: "name",
    label: "NAME",
  },
  {
    key: "amount",
    label: "CURRENT SECURITY DEPOSIT",
  },
  {
    key: "showButton",
    label: "",
  },
];

export default function SecurityDepositsTable({
  rows,
  roscaId,
}: {
  rows: [
    {
      key: any;
      avatar: any;
      name: any;
      amount: any;
      showButton: any;
    }
  ];
  roscaId: any;
}) {
  const newRows = rows.map((row) => {
    if (row.hasOwnProperty("showButton")) {
      return {
        ...row,
        showButton: row.showButton ? (
          <AddSecurityDepositModal roscaId={roscaId} />
        ) : (
          ""
        ),
      };
    }
    return row;
  });

  return (
    <Table
      aria-label="Example table with dynamic content"
      isCompact
      classNames={{
        th: " bg-default bg-opacity-45 text-white",
        // wrapper: "bg-gradient-to-tr from-rose-500 via-purple-500 to-slate-800",
        wrapper: "bg-default bg-opacity-30",
        tbody: "text-white",
        emptyWrapper: "text-white",
      }}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key} align="start">
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        items={newRows}
        emptyContent={
          <>
            <div className="pb-7">No security deposits added so far...</div>
            <AddSecurityDepositModal roscaId={roscaId} />
          </>
        }
      >
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
