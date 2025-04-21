// app/components/FinancialDashboard.tsx
"use client";

import React from "react";

// --- Individual HeroUI Component Imports ---
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Link } from "@heroui/link";
import { Spacer } from "@heroui/spacer";
// import { Spinner } from "@heroui/spinner"; // Import if you use isLoading prop on Button
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue, // getKeyValue is often exported from the table package
} from "@heroui/table";
import { User } from "@heroui/user";
// import { Tabs, Tab } from "@heroui/tabs"; // Import if needed

// --- Mock Data (Keep as is) ---
const kpiData = [
  { title: "Total Balance", value: "$125,670.80", change: "+4.8%", changeType: "positive" },
  { title: "Income (This Month)", value: "$15,230.50", change: "+12.1%", changeType: "positive" },
  { title: "Expenses (This Month)", value: "$8,450.20", change: "-2.5%", changeType: "negative" },
  { title: "Savings Rate", value: "18%", change: "+1.0%", changeType: "positive" },
];

const transactions = [
    { id: 1, name: "Grocery Store", date: "2024-07-25", amount: -75.50, status: "Completed", category: "Food" },
    { id: 2, name: "Salary Deposit", date: "2024-07-24", amount: 5200.00, status: "Completed", category: "Income" },
    { id: 3, name: "Online Subscription", date: "2024-07-23", amount: -14.99, status: "Pending", category: "Entertainment"},
    { id: 4, name: "Restaurant Bill", date: "2024-07-22", amount: -42.80, status: "Completed", category: "Food" },
    { id: 5, name: "Utility Payment", date: "2024-07-21", amount: -120.00, status: "Completed", category: "Bills" },
];

const transactionColumns = [
  { key: "name", label: "NAME" },
  { key: "date", label: "DATE" },
  { key: "category", label: "CATEGORY" },
  { key: "status", label: "STATUS" },
  { key: "amount", label: "AMOUNT" },
  { key: "actions", label: "ACTIONS" },
];

// --- Component Definition ---
export default function FinancialDashboard() {

  // --- Rendering Logic (Keep as is) ---
  const renderCell = React.useCallback((item: any, columnKey: React.Key) => {
    const cellValue = item[columnKey as keyof typeof item];

    switch (columnKey) {
      case "status":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={
              cellValue === "Completed"
                ? "success"
                : cellValue === "Pending"
                ? "warning"
                : "default"
            }
          >
            {cellValue}
          </Chip>
        );
      case "amount":
        return (
          <span
            className={
              cellValue > 0 ? "text-success-600" : "text-danger-600"
            }
          >
            {cellValue > 0 ? "+" : ""}${Math.abs(cellValue).toFixed(2)}
          </span>
        );
       case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  {/* Replace with an actual Kebab/More Icon */}
                  <span className="text-lg text-default-400 cursor-pointer active:opacity-50">⋮</span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Transaction Actions">
                <DropdownItem key={""}>View Details</DropdownItem>
                <DropdownItem key={""}>Edit</DropdownItem>
                <DropdownItem color="danger" className="text-danger" key={""}>
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        // Use getKeyValue for dynamic column rendering from the table items
        return getKeyValue(item, columnKey);
    }
  }, []);


  // --- JSX Structure (Keep as is) ---
  return (
    <div className="p-4 md:p-8 bg-background min-h-screen text-foreground">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <User
          name="Jane Doe"
          description="Premium User"
          avatarProps={{
            src: "https://i.pravatar.cc/150?u=a042581f4e29026704d", // Placeholder avatar
            size: "md",
          }}
        />
        <Button color="primary" variant="solid" onPress={() => alert("Add Transaction Clicked!")}>
          Add Transaction
        </Button>
      </header>

      <Spacer y={6} />

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} shadow="sm">
             <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <p className="text-tiny uppercase font-bold text-default-500">{kpi.title}</p>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
               <h4 className="font-bold text-large">{kpi.value}</h4>
               <small className={`text-xs ${kpi.changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
                 {kpi.change} vs last month
               </small>
            </CardBody>
          </Card>
        ))}
      </section>

      <Spacer y={6} />

      {/* Main Content Area - Table and Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions Table */}
        <Card className="lg:col-span-2" shadow="md">
           <CardHeader className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Recent Transactions</h3>
              <Button size="sm" variant="light" as={Link} href="#">View All</Button>
           </CardHeader>
           <Divider />
           <CardBody>
             <Table
               aria-label="Recent Transactions Table"
               removeWrapper
               color="primary"
               selectionMode="none"
             >
               <TableHeader columns={transactionColumns}>
                 {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
               </TableHeader>
               <TableBody items={transactions} emptyContent={"No transactions found."}>
                 {(item) => (
                   <TableRow key={item.id}>
                     {(columnKey) => (
                       <TableCell>{renderCell(item, columnKey)}</TableCell>
                     )}
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </CardBody>
        </Card>

        {/* Chart Placeholder 1 */}
         <Card shadow="md">
            <CardHeader>
                <h3 className="text-xl font-semibold">Spending Overview</h3>
            </CardHeader>
            <Divider/>
            <CardBody className="flex justify-center items-center">
                 <p className="text-default-500 text-center py-10">Chart Placeholder (e.g., Doughnut Chart)</p>
            </CardBody>
             <CardFooter className="justify-center">
                <Link href="#" size="sm">View Report</Link>
            </CardFooter>
        </Card>

        {/* Chart Placeholder 2 */}
         <Card shadow="md" className="lg:col-span-3">
            <CardHeader>
                <h3 className="text-xl font-semibold">Income vs Expenses</h3>
            </CardHeader>
            <Divider/>
            <CardBody className="flex justify-center items-center min-h-[200px]">
                 <p className="text-default-500 text-center py-10">Chart Placeholder (e.g., Bar Chart)</p>
            </CardBody>
             <CardFooter className="justify-end">
                <Link href="#" size="sm">View Detailed Report</Link>
            </CardFooter>
        </Card>

      </section>

      <Spacer y={8} />
    </div>
  );
}