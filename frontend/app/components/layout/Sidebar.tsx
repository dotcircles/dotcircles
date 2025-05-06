// app/components/layout/Sidebar.tsx
"use client";

import React from "react";
import { usePathname } from 'next/navigation'; // Use pathname for active state
import NextLink from 'next/link'; // Use Next.js Link for navigation

// --- Individual HeroUI Imports ---
import { Listbox, ListboxItem } from "@heroui/listbox";
import { Avatar } from "@heroui/avatar";
import { User } from "@heroui/user";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Link } from "@heroui/link"; // HeroUI Link for styling
import WalletConnectButton from "@/app/lib/wallet/WalletConnectButton";
import { useWallet } from "@/app/lib/wallet/WalletProvider";

// --- Icons (Replace with actual icons) ---
const PlaceholderIcon = ({ size = 20 }: { size?: number }) => ('');
const CreateIcon = PlaceholderIcon;
const InboxIcon = PlaceholderIcon;
const RoscasIcon = PlaceholderIcon;
const SettingsIcon = PlaceholderIcon;

const navItems = [
  { key: "/dashboard", label: "My Circles", icon: <RoscasIcon />, href: "/dashboard" },
  { key: "/dashboard/invited", label: "Invited", icon: <InboxIcon />, href: "/dashboard/invited" },
  { key: "/dashboard/create", label: "Create Circle", icon: <CreateIcon />, href: "/dashboard/create" },
];

const settingsItem = {
  key: "/dashboard/settings", label: "Settings", icon: <SettingsIcon />, href:"/dashboard/settings" // Example route
};

export default function Sidebar() {
  const pathname = usePathname(); 
  const { currentAccount } = useWallet();

  return (
    <aside className="h-screen w-64 flex flex-col border-r border-divider bg-content1 text-content1-foreground p-4 fixed top-0 left-0 z-40">
      {/* Branding */}
      <div className="flex items-center gap-2 px-2 mb-6 mt-2">
         <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            D
         </div>
        <span className="font-bold text-inherit text-lg">DotCircles</span>
      </div>

      <WalletConnectButton />
      {/* Navigation */}
      <ScrollShadow hideScrollBar className="flex-grow overflow-y-auto -mr-4 pr-4">
        <Listbox
          aria-label="Main navigation"
          variant="flat"
          color="primary"
          selectedKeys={new Set([pathname])} // Select based on current path
           itemClasses={{
              base: "px-3 data-[hover=true]:bg-default-100 rounded-md data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary",
              title: "font-medium",
           }}
        >
          {navItems.map((item) => (
            <ListboxItem
              key={item.href} // Use href as key for routing
              startContent={item.icon}
            //   textValue={item.label}
              href={item.href}
              as={NextLink} // Use Next.js Link for client-side routing
            >
              {item.label}
            </ListboxItem>
          ))}
        </Listbox>
      </ScrollShadow>

      {/* Settings */}
      <Listbox
          aria-label="Settings navigation"
          variant="flat"
          color="primary"
          className="mt-auto pt-4" // Use mt-auto here to push settings up slightly before user
          selectedKeys={new Set([pathname])}
           itemClasses={{
              base: "px-3 data-[hover=true]:bg-default-100 rounded-md data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary",
              title: "font-medium",
           }}
        >
            <ListboxItem
              key={settingsItem.href}
              startContent={settingsItem.icon}
            //   textValue={settingsItem.label}
              href={settingsItem.href}
              as={NextLink}
            >
              {settingsItem.label}
            </ListboxItem>
       </Listbox>


      {/* User Profile */}
      <div className="mt-4 pt-4 border-t border-divider"> {/* Pushes to bottom */}
        {/* <Divider className="mb-4"/> No longer needed with border-t */}
        <User
            name={currentAccount?.meta.name} // Replace with actual user data
            description={<Link href="#" size="sm" className="text-xs">View Profile</Link>} 
            avatarProps={{
              src: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
              size: "sm",
            }}
            classNames={{
                base: "justify-start",
                wrapper: "flex-grow-0",
                description: "text-xs" // Adjust description size
            }}
         />
      </div>
    </aside>
  );
}