import { mockedRoscas } from "@/mocks/mockData";

export async function fetchRoscasForUser(address: string) {
  const invited = mockedRoscas.filter(
    (r) => r.startedBy === null && r.eligibleParticipants.includes(address)
  );

  const active = mockedRoscas.filter(
    (r) => r.startedBy !== null && !r.completed && r.eligibleParticipants.includes(address)
  );

  const completed = mockedRoscas.filter(
    (r) => r.completed && r.eligibleParticipants.includes(address)
  );

  return {
    pending: invited,
    active,
    completed,
  };
}

export async function fetchRoscaById(roscaId: number) {
  return mockedRoscas.find((r) => r.roscaId === roscaId);
}
