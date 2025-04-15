import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Badge } from "@heroui/badge";

export function RoscaCard({ rosca, state }: { rosca: any; state: string }) {
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{rosca.name}</h3>
        <Badge color={state === "active" ? "success" : state === "completed" ? "default" : "primary"}>
          {state.charAt(0).toUpperCase() + state.slice(1)}
        </Badge>
      </CardHeader>
      <CardBody className="text-sm text-default-600">
        <p>Contribution: {rosca.contributionAmount} DOT / {rosca.contributionFrequency === "100800" ? "Weekly" : "Monthly"}</p>
        <p>Participants: {rosca.totalParticipants}</p>
      </CardBody>
      <CardFooter>
        <Button
          as={Link}
          href={`/rosca/${rosca.roscaId}`}
          color="primary"
          radius="full"
          fullWidth
        >
          {state === "invited" ? "Join Now" : "View"}
        </Button>
      </CardFooter>
    </Card>
  );
}
