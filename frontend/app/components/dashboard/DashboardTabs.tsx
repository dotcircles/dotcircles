"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { RoscaList } from "./RoscaList";

export default function DashboardTabs({ pending, active, completed }: {
  pending: any[], active: any[], completed: any[]
}) {
  return (
    <Tabs aria-label="Rosca status tabs" color="primary">
      <Tab key="invited" title="Invited"><RoscaList roscas={pending} state="invited" /> </Tab>
      <Tab key="active" title="Active"> <RoscaList roscas={active} state="active" /></Tab>
      <Tab key="completed" title="Completed"><RoscaList roscas={completed} state="completed" /></Tab>
    </Tabs>
  );
}