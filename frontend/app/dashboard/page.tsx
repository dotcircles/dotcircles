"use client"

import { Tabs, Tab } from "@heroui/tabs";
import { fetchRoscasForUser } from "@/lib/queries";
import { RoscaList } from "@/app/components/dashboard/RoscaList";
// import { getConnectedAddress } from "@/lib/auth";
import CreateRosca from "@/app/components/roscas/CreateRosca";
import { Card, CardBody } from "@heroui/card";
import DashboardTabs from "@/app/components/dashboard/DashboardTabs";


export default async function DashboardPage() {
//   const address = await getConnectedAddress();
  const { pending, active, completed } = await fetchRoscasForUser("5FEda1GYvjMYcBiuRE7rb85QbD5bQNHuZajhRvHYTxm4PPz5");

    console.log(pending, active, completed)

  return (
    <section className="py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">My Circles</h1>
      <CreateRosca />
      <DashboardTabs pending={pending} active={active} completed={completed} />
    </section>
  );
}