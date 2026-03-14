// SEZOverlay.tsx — Overlay for SEZ/MIDC/EPZ markers
import React from 'react';
import { Marker } from 'react-simple-maps';

// Example static data, replace with real SEZ/MIDC/EPZ data
const ZONES = [
  { name: 'Navi Mumbai SEZ', coordinates: [72.9971, 19.0330], notes: 'SEZ compliance notes here' },
  { name: 'MIDC Pune', coordinates: [73.8567, 18.5204], notes: 'MIDC compliance notes here' },
  // ...more zones
];

const SEZOverlay: React.FC = () => (
  <g>
    {ZONES.map((zone, i) => (
      <Marker key={i} coordinates={zone.coordinates}>
        <circle r={7} fill="#f59e42" stroke="#fff" strokeWidth={2} />
        <title>{zone.name + ': ' + zone.notes}</title>
      </Marker>
    ))}
  </g>
);

export default SEZOverlay;
