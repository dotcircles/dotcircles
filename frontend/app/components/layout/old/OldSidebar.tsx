// app/components/Sidebar.tsx
"use client";

import React, { useState } from "react";
import { Listbox, ListboxItem, ListboxSection } from "@heroui/listbox"; // Corrected import path
import { Avatar } from "@heroui/avatar"; // Corrected import path
import { User } from "@heroui/user";     // Corrected import path
import { Divider } from "@heroui/divider"; // Corrected import path
import { ScrollShadow } from "@heroui/scroll-shadow"; // Corrected import path
import { Link } from "@heroui/link";     // Assuming Link might be needed, add if used
// Import other components individually as needed (e.g., Image, Spacer)
// import { Image } from "@heroui/image";
// import { Spacer } from "@heroui/spacer";

// Placeholder Icons (Replace with actual icons from a library like react-icons or heroicons)
const PlaceholderIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className="opacity-50"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16m-7 6h7" // Example icon path
    ></path>
  </svg>
);

const DashboardIcon = PlaceholderIcon;
const TransactionsIcon = PlaceholderIcon;
const AccountsIcon = PlaceholderIcon;
const ReportsIcon = PlaceholderIcon;
const SettingsIcon = PlaceholderIcon;

// Navigation items data
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { key: "transactions", label: "Transactions", icon: <TransactionsIcon /> },
  { key: "accounts", label: "Accounts", icon: <AccountsIcon /> },
  { key: "reports", label: "Reports", icon: <ReportsIcon /> },
];

const settingsItem = {
    key: "settings", label: "Settings", icon: <SettingsIcon />
};


// Component Definition
export default function Sidebar() {
  const [selectedKey, setSelectedKey] = useState("dashboard"); // Example state for active item

  return (
    <aside className="h-screen w-64 flex flex-col border-r border-divider bg-content1 text-content1-foreground p-4 fixed top-0 left-0 z-40">
      {/* Branding Section */}
      <div className="flex items-center gap-2 px-2 mb-6 mt-2">
        {/* Optional: Replace with <Image /> if you have a logo */}
         <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            F
         </div>
        <span className="font-bold text-inherit text-lg">FinDash</span>
      </div>

      {/* Navigation Section */}
      <ScrollShadow hideScrollBar className="flex-grow overflow-y-auto -mr-4 pr-4">
        <Listbox
          aria-label="Main navigation"
          variant="flat" // Using flat variant for subtle hover
          color="primary"
          selectedKeys={[selectedKey]}
          onSelectionChange={(keys) => {
            // In a real app, handle navigation here (e.g., router.push)
            const key = Array.from(keys)[0];
            setSelectedKey(key as string);
            console.log("Navigate to:", key);
          }}
           itemClasses={{
              base: "px-3 py-2 data-[hover=true]:bg-default-100 rounded-md data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary",
              title: "font-medium",
           }}
        >
          {navItems.map((item) => (
            <ListboxItem
              key={item.key}
              startContent={item.icon}
              textValue={item.label} // Important for accessibility and typeahead
              // href={`/${item.key}`} // Uncomment and adjust if using routing integration
            >
              {item.label}
            </ListboxItem>
          ))}
        </Listbox>
      </ScrollShadow>

      {/* Settings Item (Optional Separated) */}
       <Listbox
          aria-label="Settings navigation"
          variant="flat" // Using flat variant for subtle hover
          color="primary"
          className="mt-4" // Add some space before settings
          selectedKeys={[selectedKey]}
           onSelectionChange={(keys) => {
            // In a real app, handle navigation here (e.g., router.push)
            const key = Array.from(keys)[0];
            setSelectedKey(key as string);
            console.log("Navigate to:", key);
          }}
           itemClasses={{
              base: "px-3 py-2 data-[hover=true]:bg-default-100 rounded-md data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary",
              title: "font-medium",
           }}
        >
            <ListboxItem
              key={settingsItem.key}
              startContent={settingsItem.icon}
              textValue={settingsItem.label}
            >
              {settingsItem.label}
            </ListboxItem>
       </Listbox>


      {/* User Profile Section */}
      <div className="mt-auto pt-4"> {/* Pushes to bottom */}
        <Divider className="mb-4"/>
        <User
            name="Jane Doe"
            description={<Link href="#" size="sm">View Profile</Link>}
            avatarProps={{
              src: "https://i.pravatar.cc/150?u=a042581f4e29026704d", // Placeholder avatar
              size: "sm",
            }}
            classNames={{
                base: "justify-start", // Align user content left
                wrapper: "flex-grow-0" // Prevent wrapper from expanding
            }}
         />
      </div>
    </aside>
  );
}