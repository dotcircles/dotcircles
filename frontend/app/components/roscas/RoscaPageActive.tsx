import { Card, CardBody, CardHeader } from "@heroui/card";

export function RoscaPageActive({ rosca }: { rosca: any }) {
  return (
    <section className="py-10 px-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{rosca.name}</h1>

      <p className="mb-4 text-default-500">
        Contribution: {rosca.contributionAmount} DOT / {rosca.contributionFrequency === "100800" ? "Weekly" : "Monthly"}
      </p>

      <Card>
        <CardHeader>Current Recipient</CardHeader>
        <CardBody>
          {rosca.currentRecipient}
        </CardBody>
      </Card>

      <h2 className="text-xl font-semibold mt-8 mb-4">Round History</h2>
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