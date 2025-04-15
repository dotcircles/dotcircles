import { RoscaCard } from "./RoscaCard";

export function RoscaList({ roscas, state }: { roscas: any[]; state: string }) {
  if (!roscas?.length) {
    return <p className="text-default-500 py-6">No circles found in this category.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roscas.map((rosca) => (
        <RoscaCard key={rosca.id} rosca={rosca} state={state} />
      ))}
    </div>
  );
}