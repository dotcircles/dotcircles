// app/components/rosca/RoscaList.tsx
import React from 'react';
import { Rosca } from '@/app/lib/types';
import RoscaCard from './RoscaCard';

interface RoscaListProps {
  roscas: Rosca[];
}

export default function RoscaList({ roscas }: RoscaListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {roscas.map((rosca) => (
        <RoscaCard key={rosca.id} rosca={rosca} />
      ))}
    </div>
  );
}