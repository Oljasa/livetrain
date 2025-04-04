'use client';

import TrainMap from '@/components/TrainMap';
import { TrainProvider } from '@/lib/TrainContext';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6"></h1>
        <TrainProvider>
          <TrainMap />
        </TrainProvider>
      </div>
    </main>
  );
}
