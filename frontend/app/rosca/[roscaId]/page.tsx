// src/app/rosca/[roscaId]/page.tsx
import { fetchRoscaById } from "@/lib/queries";
import { RoscaPagePending } from "@/app/components/roscas/RoscaPagePending";
import { RoscaPageActive } from "@/app/components/roscas/RoscaPageActive";
import { RoscaPageCompleted } from "@/app/components/roscas/RoscaPageCompleted";

export default async function RoscaPage({ params }: { params: { roscaId: number } }) {
  const rosca = await fetchRoscaById(params.roscaId);

  if (rosca && rosca.startedBy === null) {
    return <RoscaPagePending rosca={rosca} />;
  }

  if (rosca && rosca.completed) {
    return <RoscaPageCompleted rosca={rosca} />;
  }

  return <RoscaPageActive rosca={rosca} />;
}
