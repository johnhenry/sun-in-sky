/**
 * InternalStructure.jsx
 *
 * Cross-section visualization showing internal layers of celestial objects
 * Different layer structures for:
 * - Planets: Core, Mantle, Crust
 * - Brown Dwarfs: Degenerate Core, Convective Envelope
 * - Main Sequence Stars: Core (fusion), Radiative Zone, Convective Zone, Photosphere
 * - Giants: He Core, H Shell, Envelope
 * - White Dwarfs: Degenerate Core, Thin Atmosphere
 * - Neutron Stars: Crust, Outer Core, Inner Core
 * - Black Holes: Event Horizon, Photon Sphere, Singularity
 */

import React, { useMemo } from 'react';

/**
 * Get temperature color based on value (Kelvin)
 * Blue (cool) -> Red (hot) -> White (extreme)
 */
function getTemperatureColor(tempK) {
  if (tempK < 1000) return '#60a5fa'; // Blue (cool)
  if (tempK < 3000) return '#4ade80'; // Green
  if (tempK < 5000) return '#f4d03f'; // Yellow
  if (tempK < 10000) return '#fb923c'; // Orange
  if (tempK < 50000) return '#ef4444'; // Red
  if (tempK < 1e6) return '#f97316'; // Deep red
  if (tempK < 1e7) return '#fbbf24'; // Hot yellow
  return '#f0f0f0'; // White (extreme)
}

/**
 * Define layer structure based on object type and mass
 */
function getLayers(mass, radius, objectType) {
  const layers = [];

  if (mass < 0.001) {
    // Sub-planetary object - irregular, possibly differentiated
    return [
      { name: 'Mixed Material', fraction: 1.0, temp: 300, description: 'Undifferentiated material' }
    ];
  } else if (mass < 0.013) {
    // Gas giant planet
    return [
      { name: 'Rocky Core', fraction: 0.15, temp: 20000, description: 'High-pressure solid core' },
      { name: 'Metallic Hydrogen', fraction: 0.40, temp: 10000, description: 'Liquid metallic hydrogen' },
      { name: 'Molecular Hydrogen', fraction: 0.85, temp: 2000, description: 'Liquid/gas H2 and He' },
      { name: 'Atmosphere', fraction: 1.0, temp: 150, description: 'Visible cloud layers' }
    ];
  } else if (mass < 0.08) {
    // Brown dwarf
    return [
      { name: 'Degenerate Core', fraction: 0.30, temp: 3e6, description: 'Electron-degenerate matter' },
      { name: 'Fusion Zone', fraction: 0.50, temp: 1.5e6, description: 'Deuterium burning (if any)' },
      { name: 'Convective Envelope', fraction: 0.90, temp: 5e5, description: 'Convecting gas' },
      { name: 'Photosphere', fraction: 1.0, temp: 1000, description: 'Visible surface' }
    ];
  } else if (mass < 0.45) {
    // Red dwarf - fully convective
    return [
      { name: 'Fusion Core', fraction: 0.25, temp: 1.5e7 * mass, description: 'Hydrogen fusion' },
      { name: 'Convective Zone', fraction: 1.0, temp: 3000, description: 'Fully convective interior' }
    ];
  } else if (mass < 2) {
    // Sun-like star
    return [
      { name: 'Fusion Core', fraction: 0.20, temp: 1.5e7, description: 'Hydrogen → Helium' },
      { name: 'Radiative Zone', fraction: 0.70, temp: 7e6, description: 'Energy transport by radiation' },
      { name: 'Convective Zone', fraction: 0.95, temp: 2e6, description: 'Convecting plasma' },
      { name: 'Photosphere', fraction: 1.0, temp: 5800, description: 'Visible surface' }
    ];
  } else if (mass < 8) {
    // Massive star
    return [
      { name: 'Fusion Core', fraction: 0.15, temp: 3e7 * Math.sqrt(mass), description: 'CNO cycle fusion' },
      { name: 'Convective Core', fraction: 0.35, temp: 2e7, description: 'Mixing zone' },
      { name: 'Radiative Zone', fraction: 0.90, temp: 1e7, description: 'Energy transport' },
      { name: 'Photosphere', fraction: 1.0, temp: 20000, description: 'Hot blue surface' }
    ];
  } else if (objectType.includes('White Dwarf')) {
    // White dwarf
    return [
      { name: 'Carbon-Oxygen Core', fraction: 0.99, temp: 1e7, description: 'Electron-degenerate matter' },
      { name: 'Thin Atmosphere', fraction: 1.0, temp: 10000, description: 'H or He atmosphere' }
    ];
  } else if (objectType.includes('Neutron Star')) {
    // Neutron star
    return [
      { name: 'Inner Core', fraction: 0.20, temp: 1e9, description: 'Exotic matter (quarks?)' },
      { name: 'Outer Core', fraction: 0.80, temp: 5e8, description: 'Neutron superfluid' },
      { name: 'Crust', fraction: 0.95, temp: 1e8, description: 'Neutron-rich nuclei' },
      { name: 'Atmosphere', fraction: 1.0, temp: 1e6, description: 'Iron plasma (~cm thick)' }
    ];
  } else {
    // Black hole
    return [
      { name: 'Singularity', fraction: 0.0, temp: Infinity, description: 'Infinite density point' },
      { name: 'Event Horizon', fraction: 0.70, temp: 0, description: 'Point of no return' },
      { name: 'Photon Sphere', fraction: 1.0, temp: 0, description: '1.5× Schwarzschild radius' }
    ];
  }
}

/**
 * Main InternalStructure component
 */
export default function InternalStructure({ mass, radius, objectType }) {
  const layers = useMemo(() => getLayers(mass, radius, objectType), [mass, radius, objectType]);

  // SVG dimensions
  const svgSize = 500;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const maxRadius = svgSize / 2 - 50;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      {/* Title */}
      <h2 style={{
        fontSize: '1.8rem',
        marginBottom: '20px',
        color: '#f4d03f',
        textAlign: 'center'
      }}>
        Internal Structure: {objectType}
      </h2>

      {/* Cross-section visualization */}
      <svg
        width={svgSize}
        height={svgSize}
        style={{ marginBottom: '30px' }}
      >
        {/* Draw layers from outermost to innermost */}
        {[...layers].reverse().map((layer, index) => {
          const actualIndex = layers.length - 1 - index;
          const layerRadius = maxRadius * layer.fraction;
          const color = getTemperatureColor(layer.temp);

          return (
            <g key={actualIndex}>
              {/* Layer circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={layerRadius}
                fill={color}
                fillOpacity={0.8}
                stroke="#000"
                strokeWidth={2}
              />

              {/* Layer boundary line */}
              {actualIndex < layers.length - 1 && (
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={layerRadius}
                  fill="none"
                  stroke="#1a1a1c"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
            </g>
          );
        })}

        {/* Center line for reference */}
        <line
          x1={centerX}
          y1={centerY - maxRadius - 20}
          x2={centerX}
          y2={centerY + maxRadius + 20}
          stroke="#393941"
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* Labels pointing to each layer */}
        {layers.map((layer, index) => {
          const prevRadius = index > 0 ? maxRadius * layers[index - 1].fraction : 0;
          const layerRadius = maxRadius * layer.fraction;
          const midRadius = (prevRadius + layerRadius) / 2;

          // Label position (alternating left and right)
          const angle = (index % 2 === 0) ? -Math.PI / 4 : Math.PI / 4;
          const labelX = centerX + Math.cos(angle) * midRadius;
          const labelY = centerY + Math.sin(angle) * midRadius;

          const lineEndX = centerX + Math.cos(angle) * (maxRadius + 30);
          const lineEndY = centerY + Math.sin(angle) * (maxRadius + 30);

          return (
            <g key={`label-${index}`}>
              {/* Line to label */}
              <line
                x1={labelX}
                y1={labelY}
                x2={lineEndX}
                y2={lineEndY}
                stroke="#e9e9ea"
                strokeWidth={1}
              />

              {/* Label text */}
              <text
                x={lineEndX + (angle < 0 ? -10 : 10)}
                y={lineEndY}
                textAnchor={angle < 0 ? 'end' : 'start'}
                fill="#e9e9ea"
                fontSize="12"
                fontWeight="bold"
              >
                {layer.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Layer details table */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#1a1a1c',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #393941'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #393941' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1a8' }}>Layer</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1a8' }}>Radius</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1a8' }}>Temperature</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1a8' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((layer, index) => {
              const prevRadius = index > 0 ? layers[index - 1].fraction : 0;
              const thickness = (layer.fraction - prevRadius) * 100;
              const tempStr = layer.temp === Infinity ? '∞' :
                             layer.temp > 1e6 ? `${(layer.temp / 1e6).toFixed(1)} MK` :
                             layer.temp > 1e3 ? `${(layer.temp / 1e3).toFixed(0)} kK` :
                             `${layer.temp.toFixed(0)} K`;

              return (
                <tr key={index} style={{ borderBottom: '1px solid #393941' }}>
                  <td style={{
                    padding: '12px',
                    color: '#e9e9ea',
                    fontWeight: 'bold'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      backgroundColor: getTemperatureColor(layer.temp),
                      borderRadius: '50%',
                      marginRight: '8px'
                    }} />
                    {layer.name}
                  </td>
                  <td style={{ padding: '12px', color: '#a1a1a8' }}>
                    {thickness.toFixed(1)}%
                  </td>
                  <td style={{ padding: '12px', color: '#fb923c' }}>
                    {tempStr}
                  </td>
                  <td style={{ padding: '12px', color: '#a1a1a8' }}>
                    {layer.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Temperature scale legend */}
      <div style={{
        marginTop: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <span style={{ color: '#a1a1a8', fontSize: '0.9rem', fontWeight: 'bold' }}>
          Temperature Scale:
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {[
            { color: '#60a5fa', label: 'Cool' },
            { color: '#4ade80', label: 'Warm' },
            { color: '#f4d03f', label: 'Hot' },
            { color: '#fb923c', label: 'Very Hot' },
            { color: '#ef4444', label: 'Extreme' },
            { color: '#f0f0f0', label: 'Stellar Core' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: item.color,
                borderRadius: '50%',
                border: '1px solid #393941'
              }} />
              <span style={{ color: '#a1a1a8', fontSize: '0.8rem' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional info for special cases */}
      {objectType.includes('Black Hole') && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          maxWidth: '600px',
          textAlign: 'center',
          border: '1px solid #393941'
        }}>
          <p style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            Note: Black holes have no traditional "interior structure." The singularity is a
            point of infinite density where our understanding of physics breaks down. The event
            horizon and photon sphere are spatial boundaries, not physical layers.
          </p>
        </div>
      )}
    </div>
  );
}
