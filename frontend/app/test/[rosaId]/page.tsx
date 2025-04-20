"use client";

import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs"; // individual import :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import { Card, CardHeader, CardBody } from "@heroui/card";            // individual import :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}
import { Accordion, AccordionItem } from "@heroui/accordion";         // individual import :contentReference[oaicite:4]{index=4}&#8203;:contentReference[oaicite:5]{index=5}
import { Avatar, AvatarGroup } from "@heroui/avatar";                // individual import :contentReference[oaicite:6]{index=6}&#8203;:contentReference[oaicite:7]{index=7}

interface RoscaPageProps {
  params: { roscaId: string };
}

export default function RoscaPage({ params }: RoscaPageProps) {
  const { roscaId } = params;

  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumb navigation */}
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/rosca">Circles</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{roscaId}</BreadcrumbItem>
      </Breadcrumbs>

      {/* Page title */}
      <h1 className="text-3xl font-bold">Circle {roscaId}</h1>

      {/* Summary card */}
      <Card>
        <CardHeader>Circle Summary</CardHeader>
        <CardBody className="space-y-2">
          <div>Total Rounds: <strong>12</strong></div>
          <div>Participants: <strong>10</strong></div>
          <div>Contribution Amount: <strong>0.1 ETH</strong></div>
        </CardBody>
      </Card>

      {/* Past rounds */}
      <Card>
        <CardHeader>Past Rounds</CardHeader>
        <CardBody>
          <Accordion selectionMode="single">
            <AccordionItem title="Round 1 – Completed">
              <div className="grid grid-cols-2 gap-4 p-4">
                <div><strong>Recipient:</strong> 0x123…AbC</div>
                <div><strong>Contribution:</strong> 0.1 ETH</div>
                <div><strong>Contributors:</strong> 10</div>
                <div><strong>Defaulters:</strong> 0</div>
              </div>
            </AccordionItem>
            <AccordionItem title="Round 2 – Completed">
              <div className="grid grid-cols-2 gap-4 p-4">
                <div><strong>Recipient:</strong> 0x456…DeF</div>
                <div><strong>Contribution:</strong> 0.1 ETH</div>
                <div><strong>Contributors:</strong> 10</div>
                <div><strong>Defaulters:</strong> 1</div>
              </div>
            </AccordionItem>
            {/* Add more AccordionItem for each past round as needed */}
          </Accordion>
        </CardBody>
      </Card>

      {/* Upcoming rounds */}
      <Card>
        <CardHeader>Upcoming Rounds</CardHeader>
        <CardBody>
          <Accordion selectionMode="single">
            <AccordionItem title="Round 8 – Scheduled">
              <div className="space-y-2 p-4">
                <div><strong>Expected Participants:</strong> 8</div>
                <div><strong>Payment Date:</strong> 2025‑05‑01</div>
              </div>
            </AccordionItem>
            <AccordionItem title="Round 9 – Scheduled">
              <div className="space-y-2 p-4">
                <div><strong>Expected Participants:</strong> 9</div>
                <div><strong>Payment Date:</strong> 2025‑06‑01</div>
              </div>
            </AccordionItem>
            {/* Add more AccordionItem for each future round as needed */}
          </Accordion>
        </CardBody>
      </Card>

      {/* Payment progression */}
      <Card>
        <CardHeader>Payment Progression</CardHeader>
        <CardBody className="space-y-4">
          <div>Participants who have received payments:</div>
          <AvatarGroup max={5} total={10}>
            <Avatar name="Alice" />
            <Avatar name="Bob" />
            <Avatar name="Carol" />
            <Avatar name="Dave" />
            <Avatar name="Eve" />
            {/* Avatars beyond max will be counted in the "+X" indicator */}
          </AvatarGroup>
        </CardBody>
      </Card>
    </div>
);
}
