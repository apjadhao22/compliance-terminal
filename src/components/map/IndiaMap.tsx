// IndiaMap.tsx — Interactive SVG map using React Simple Maps
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import StatePanel from './StatePanel';
import SEZOverlay from './SEZOverlay';
import CityDrilldown from './CityDrilldown';

const INDIA_TOPO_JSON = '/india.topo.json'; // Place topojson in public/
const PRIORITY_STATES = ['MH', 'KA', 'GJ', 'TN', 'TS', 'AP'];

const IndiaMap: React.FC = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showSEZ, setShowSEZ] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  // TODO: Fetch state-wise doc counts, heatmap data, SEZ/MIDC overlays, city markers

  return (
    <div className="relative w-full h-full flex">
      <div className="flex-1">
        <ComposableMap projection="geoMercator" width={900} height={900}>
          <Geographies geography={INDIA_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map(geo => {
                const stateCode = geo.properties.ST_CODE;
                // TODO: Color by doc count (heatmap)
                const isPriority = PRIORITY_STATES.includes(stateCode);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => setSelectedState(stateCode)}
                    style={{
                      default: {
                        fill: '#1a2e1a',
                        stroke: isPriority ? '#f59e42' : '#3fb950',
                        strokeWidth: isPriority ? 2 : 1,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      hover: { fill: '#3fb950', outline: 'none' },
                      pressed: { fill: '#f0883e', outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {/* TODO: Add SEZ/MIDC/EPZ markers if showSEZ */}
          {showSEZ && <SEZOverlay />}
          {/* TODO: Add city markers for drilldown */}
          <CityDrilldown onSelect={setSelectedCity} />
        </ComposableMap>
        <button className="absolute top-4 right-4 bg-terminal-cyan px-3 py-1 rounded font-mono" onClick={() => setShowSEZ(s => !s)}>
          {showSEZ ? 'Hide SEZ/MIDC' : 'Show SEZ/MIDC'}
        </button>
      </div>
      {selectedState && <StatePanel state={selectedState} onClose={() => setSelectedState(null)} />}
      {/* City drilldown panel if city selected */}
      {selectedCity && <StatePanel city={selectedCity} onClose={() => setSelectedCity(null)} />}
    </div>
  );
};

export default IndiaMap;
