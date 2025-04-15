// src/components/rosca/RoscaPageCompleted.tsx
import { Card, CardBody, CardHeader } from "@heroui/card";

export function RoscaPageCompleted({ rosca }: { rosca: any }) {
  return (
    <section className="py-10 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{rosca.name}</h1>

      <p className="mb-4 text-default-500">
        This circle has been completed. All rounds have been paid out.
      </p>

      <h2 className="text-xl font-semibold mb-4">Final Payout Order</h2>
      <div className="space-y-2">
        {rosca.rounds.map((round: any) => (
          <Card key={round.id}>
            <CardBody>
              Round {round.roundNumber}: Recipient {round.recipient}
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
