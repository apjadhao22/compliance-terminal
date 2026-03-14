// SectorDropdown.tsx — Top nav dropdown for sector dashboards
import React from 'react';
import { Link } from 'react-router-dom';

const SECTORS = [
  { name: 'Manufacturing / Factories', route: '/sectors/manufacturing' },
  { name: 'IT / ITES', route: '/sectors/it' },
  { name: 'Food & Beverage', route: '/sectors/food' },
  { name: 'Construction', route: '/sectors/construction' },
  { name: 'Healthcare', route: '/sectors/healthcare' },
  { name: 'Retail', route: '/sectors/retail' },
  { name: 'BFSI', route: '/sectors/bfsi' },
];

const SectorDropdown: React.FC = () => (
  <div className="relative group">
    <button className="font-mono px-3 py-1 rounded hover:bg-secondary transition">Sectors ▾</button>
    <div className="absolute left-0 mt-1 bg-card border border-border rounded shadow-lg z-50 hidden group-hover:block">
      {SECTORS.map(sector => (
        <Link key={sector.route} to={sector.route} className="block px-4 py-2 text-sm font-mono hover:bg-secondary">
          {sector.name}
        </Link>
      ))}
    </div>
  </div>
);

export default SectorDropdown;
