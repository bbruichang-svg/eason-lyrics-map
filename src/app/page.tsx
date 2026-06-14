'use client';

import { AuthProvider } from '@/components/AuthProvider';
import MapWrapper from '@/components/MapWrapper';

export default function HomePage() {
  return (
    <AuthProvider>
      <main className="h-screen w-screen overflow-hidden bg-background">
        <MapWrapper />
      </main>
    </AuthProvider>
  );
}