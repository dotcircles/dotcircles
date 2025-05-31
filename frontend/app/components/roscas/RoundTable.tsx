// app/components/rosca/RoundTable.tsx
"use client";

import React from 'react';
import { Round } from '@/app/lib/types';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue } from '@heroui/table';
import { Avatar, AvatarGroup } from '@heroui/avatar';
import { Tooltip } from '@heroui/tooltip';
import { User } from '@heroui/user';
import { Chip } from '@heroui/chip';
import { formatCurrency, formatTimestamp, truncateAddress } from '@/app/lib/utils';


interface RoundTableProps {
    rounds: Round[];
    isPast: boolean;
    currentUserAddress: string; // Needed to identify "You"
}

export default function RoundTable({ rounds, isPast, currentUserAddress }: RoundTableProps) {
    const columns = [
        { key: "roundNumber", label: "#" },
        { key: "recipient", label: "Recipient" },
        // Label changes based on past/future
        { key: "expectedOrPaid", label: isPast ? "Contributors" : "Expected Contributors" },
        // Only show defaulters column for past rounds
        ...(isPast ? [{ key: "defaulters", label: "Defaulters" }] : []),
        // Label changes based on past/future
        { key: "date", label: isPast ? "Cutoff Date" : "Payment Due" },
    ];

    const renderCell = (item: Round, columnKey: React.Key) => {
        switch (columnKey) {
            case "recipient":
                const isSelfRecipient = item.recipient === currentUserAddress;
                return <User classNames={{description: "text-xs"}} name={truncateAddress(item.recipient)} avatarProps={{size: 'sm', name: item.recipient}} description={isSelfRecipient ? "(You)" : ""} />;

            case "expectedOrPaid":
                 const list = isPast ? item.contributors : item.expectedContributors;
                 if (!list || list.length === 0) return <span className="text-default-400">—</span>;
                 // Filter out the recipient if they are mistakenly in the contributors list for past rounds
                 const displayList = isPast ? list.filter(p => p !== item.recipient) : list;
                 if (displayList.length === 0) return <span className="text-default-400">—</span>; // Check again after filter
                 return (
                     <AvatarGroup isBordered max={10} size='sm'>
                         {displayList.map(p => (
                             <Tooltip key={p} content={truncateAddress(p)} placement="top" delay={0} closeDelay={0}>
                                <Avatar name={truncateAddress(p)} />
                             </Tooltip>
                         ))}
                     </AvatarGroup>
                 );

             case "defaulters":
                 if (!item.defaulters || item.defaulters.length === 0) return <Chip size='sm' color='success' variant='flat'>None</Chip>;
                  return (
                     <AvatarGroup isBordered max={10} size='sm'>
                         {item.defaulters.map(p => (
                             <Tooltip key={p} content={truncateAddress(p)} placement="top" color="danger" delay={0} closeDelay={0}>
                                <Avatar name={truncateAddress(p)} color='danger'/>
                             </Tooltip>
                         ))}
                     </AvatarGroup>
                 );

             case "date":
                return formatTimestamp(item.paymentCutoff);

            default:
                // Ensure getKeyValue handles potential undefined values gracefully
                const value = getKeyValue(item, columnKey as string);
                return value !== undefined && value !== null ? String(value) : 'N/A';
        }
    };

    if (rounds.length === 0) {
        return <p className="text-default-500 mt-4 text-center text-sm">No {isPast ? 'past' : 'upcoming'} rounds found.</p>
    }

    return (
        <Table isStriped aria-label={isPast ? "Past Rounds Table" : "Upcoming Rounds Table"} removeWrapper selectionMode='none'>
            <TableHeader columns={columns}>
                {(column) => <TableColumn key={column.key} allowsSorting={column.key === 'roundNumber' || column.key === 'date'}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody items={rounds} emptyContent="No rounds available.">
                 {(item) => (
                   <TableRow key={item.id}>
                     {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                   </TableRow>
                 )}
            </TableBody>
        </Table>
    );
}