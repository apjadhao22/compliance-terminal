// CityDrilldown.tsx — Markers for city drilldown
import React from 'react';
import { Marker } from 'react-simple-maps';

const CITIES = [
  { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716] },
  { name: 'Chennai', coordinates: [80.2785, 13.0827] },
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850] },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Surat', coordinates: [72.8311, 21.1702] },
];

const CityDrilldown: React.FC<{ onSelect: (city: string) => void }> = ({ onSelect }) => (
  <g>
    {CITIES.map((city, i) => (
      <Marker key={i} coordinates={city.coordinates} onClick={() => onSelect(city.name)}>
        <circle r={6} fill="#3fb950" stroke="#fff" strokeWidth={2} />
        <title>{city.name}</title>
      </Marker>
    ))}
  </g>
);

export default CityDrilldown;
