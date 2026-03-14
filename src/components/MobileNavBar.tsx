// MobileNavBar.tsx — Bottom nav for mobile
import React from 'react';
import { Link } from 'react-router-dom';

const NAV = [
  { label: 'Feed', to: '/' },
  { label: 'Map', to: '/map' },
  { label: 'Calculator', to: '/liability' },
  { label: 'Alerts', to: '/alerts' },
  { label: 'Profile', to: '/settings' },
];

const MobileNavBar: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around items-center h-12 z-50 md:hidden">
    {NAV.map(item => (
      <Link key={item.to} to={item.to} className="flex flex-col items-center text-xs font-mono text-primary">
        {item.label}
      </Link>
    ))}
  </nav>
);

export default MobileNavBar;
