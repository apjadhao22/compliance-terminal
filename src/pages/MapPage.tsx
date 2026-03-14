import React from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { MapPin } from 'lucide-react';

const STATES_DATA = [
  { name: 'Maharashtra', count: 8, x: 30, y: 55 },
  { name: 'Karnataka', count: 5, x: 32, y: 68 },
  { name: 'Gujarat', count: 4, x: 22, y: 48 },
  { name: 'Tamil Nadu', count: 3, x: 38, y: 78 },
  { name: 'Telangana', count: 3, x: 38, y: 62 },
  { name: 'Andhra Pradesh', count: 2, x: 40, y: 70 },
  { name: 'Central', count: 20, x: 50, y: 38 },
];

const MapPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <AuthModal />

      <div className="flex-1 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono font-bold text-primary glow-green">JURISDICTION MAP</span>
          <span className="text-xs font-mono text-terminal-dim">— Compliance document distribution by state</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 bg-card border border-border rounded p-6 relative min-h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-terminal-dim">
                Interactive map coming in Phase 2
              </span>
            </div>
            {/* State pins */}
            {STATES_DATA.map((state) => (
              <div
                key={state.name}
                className="absolute flex flex-col items-center"
                style={{ left: `${state.x}%`, top: `${state.y}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-primary">{state.count}</span>
                </div>
                <span className="text-[8px] font-mono text-muted-foreground mt-0.5">{state.name}</span>
              </div>
            ))}
          </div>

          {/* Stats sidebar */}
          <div className="bg-card border border-border rounded p-4 space-y-3">
            <span className="text-xs font-mono font-bold text-primary">BY JURISDICTION</span>
            {STATES_DATA.sort((a, b) => b.count - a.count).map((state) => (
              <div key={state.name} className="flex items-center justify-between">
                <span className="text-xs font-mono text-foreground">{state.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(state.count / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-terminal-dim w-6 text-right">{state.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
