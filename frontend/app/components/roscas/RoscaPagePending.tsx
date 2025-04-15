import { Button } from "@heroui/button";

export function RoscaPagePending({ rosca }: { rosca: any }) {
  const isInvited = rosca.eligibleParticipants.includes(rosca.currentUser);

  return (
    <section className="py-10 px-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{rosca.name}</h1>

      <p className="mb-4 text-default-500">
        Contribution: {rosca.contributionAmount} DOT / {rosca.contributionFrequency === "100800" ? "Weekly" : "Monthly"}
      </p>

      <p className="mb-6 text-default-500">Participants Joined: {rosca.totalParticipants}</p>

      {isInvited ? (
        <Button color="primary" size="lg" radius="full">
          Join Now
        </Button>
      ) : (
        <p className="text-default-400">You are not invited to this circle.</p>
      )}
    </section>
  );
}
