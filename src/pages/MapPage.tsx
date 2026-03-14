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

// MapPage.tsx — Interactive India Compliance Map (Phase 6)
import React from 'react';
import IndiaMap from '@/components/map/IndiaMap';

const MapPage: React.FC = () => (
  <div className="w-full h-full min-h-screen bg-background">
    <IndiaMap />
  </div>
);

export default MapPage;
