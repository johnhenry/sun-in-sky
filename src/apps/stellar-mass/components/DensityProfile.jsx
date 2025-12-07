/**
 * DensityProfile.jsx
 *
 * Graph showing density as a function of radius
 * Different profiles for different object types:
 * - Rocky planets: Relatively flat with dense core
 * - Gas giants: Decreases outward from core
 * - Stars: High central density, gradual decrease
 * - White dwarfs: Very high uniform density
 * - Neutron stars: Extremely high density with shell structure
 * - Black holes: Infinite density at singularity
 */

import React, { useMemo } from 'react';

/**
 * Physical constants
 */
const SOLAR_MASS_KG = 1.989e30;

/**
 * Generate density profile data points based on object type
 * Returns array of {radius: fraction (0-1), density: kg/m³}
 */
function generateDensityProfile(mass, radius, objectType) {
  const points = [];
  const numPoints = 100;
  const massKg = mass * SOLAR_MASS_KG;
  const radiusM = radius * 1000;

  // Average density
  const avgDensity = massKg / ((4/3) * Math.PI * Math.pow(radiusM, 3));

  if (mass < 0.001) {
    // Sub-planetary: roughly uniform, low density
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      points.push({ radius: r, density: 2000 * (1 + Math.random() * 0.2) });
    }
  } else if (mass < 0.013) {
    // Gas giant: dense core, decreasing outward
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.15) {
        // Rocky core
        points.push({ radius: r, density: 10000 - r * 20000 });
      } else if (r < 0.5) {
        // Metallic hydrogen
        points.push({ radius: r, density: 4000 - (r - 0.15) * 5000 });
      } else {
        // Molecular hydrogen
        points.push({ radius: r, density: 1000 * Math.exp(-2 * (r - 0.5)) });
      }
    }
  } else if (mass < 0.08) {
    // Brown dwarf: degenerate core, convective envelope
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.3) {
        // Degenerate core
        points.push({ radius: r, density: avgDensity * 3 * (1 - r) });
      } else {
        // Convective envelope
        points.push({ radius: r, density: avgDensity * Math.exp(-3 * (r - 0.3)) });
      }
    }
  } else if (mass < 0.45) {
    // Red dwarf: relatively uniform due to full convection
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      points.push({ radius: r, density: avgDensity * 1.5 * (1 - 0.8 * r) });
    }
  } else if (mass < 8) {
    // Sun-like star: dense core, radiative/convective zones
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.2) {
        // Core: very dense
        points.push({ radius: r, density: avgDensity * 100 * (1 - r * 0.5) });
      } else if (r < 0.7) {
        // Radiative zone
        points.push({ radius: r, density: avgDensity * 10 * Math.exp(-5 * (r - 0.2)) });
      } else {
        // Convective zone and photosphere
        points.push({ radius: r, density: avgDensity * Math.exp(-10 * (r - 0.7)) });
      }
    }
  } else if (objectType.includes('White Dwarf')) {
    // White dwarf: electron-degenerate matter, very high uniform density
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.99) {
        // Core: nearly uniform
        points.push({ radius: r, density: avgDensity * (1 + 0.5 * (1 - r)) });
      } else {
        // Thin atmosphere: rapid drop
        points.push({ radius: r, density: avgDensity * 0.01 });
      }
    }
  } else if (objectType.includes('Neutron Star')) {
    // Neutron star: extremely dense with shell structure
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.2) {
        // Inner core: exotic matter
        points.push({ radius: r, density: 1e18 });
      } else if (r < 0.8) {
        // Outer core: neutron superfluid
        points.push({ radius: r, density: 5e17 * (1 - r * 0.5) });
      } else if (r < 0.95) {
        // Crust: neutron-rich nuclei
        points.push({ radius: r, density: 1e17 * Math.exp(-10 * (r - 0.8)) });
      } else {
        // Atmosphere: rapid drop
        points.push({ radius: r, density: 1e10 });
      }
    }
  } else {
    // Black hole: singularity (infinite density)
    for (let i = 0; i <= numPoints; i++) {
      const r = i / numPoints;
      if (r < 0.01) {
        points.push({ radius: r, density: 1e30 }); // Represent "infinite" as very large
      } else {
        points.push({ radius: r, density: 0 }); // No matter outside singularity
      }
    }
  }

  return points;
}

/**
 * Get zone labels for different object types
 */
function getZoneLabels(objectType) {
  if (objectType.includes('Gas Giant')) {
    return [
      { start: 0, end: 0.15, label: 'Core', color: '#ef4444' },
      { start: 0.15, end: 0.5, label: 'Metallic H', color: '#fb923c' },
      { start: 0.5, end: 1, label: 'Molecular H', color: '#60a5fa' }
    ];
  } else if (objectType.includes('Brown Dwarf')) {
    return [
      { start: 0, end: 0.3, label: 'Degenerate Core', color: '#ef4444' },
      { start: 0.3, end: 1, label: 'Convective Envelope', color: '#fb923c' }
    ];
  } else if (objectType.includes('Red Dwarf')) {
    return [
      { start: 0, end: 0.25, label: 'Fusion Core', color: '#f4d03f' },
      { start: 0.25, end: 1, label: 'Convective', color: '#fb923c' }
    ];
  } else if (objectType.includes('Sun-like') || objectType.includes('Massive Star')) {
    return [
      { start: 0, end: 0.2, label: 'Core', color: '#f4d03f' },
      { start: 0.2, end: 0.7, label: 'Radiative', color: '#fb923c' },
      { start: 0.7, end: 1, label: 'Convective', color: '#60a5fa' }
    ];
  } else if (objectType.includes('White Dwarf')) {
    return [
      { start: 0, end: 0.99, label: 'Degenerate Core', color: '#a78bfa' },
      { start: 0.99, end: 1, label: 'Atmosphere', color: '#60a5fa' }
    ];
  } else if (objectType.includes('Neutron Star')) {
    return [
      { start: 0, end: 0.2, label: 'Inner Core', color: '#ef4444' },
      { start: 0.2, end: 0.8, label: 'Outer Core', color: '#fb923c' },
      { start: 0.8, end: 0.95, label: 'Crust', color: '#f4d03f' },
      { start: 0.95, end: 1, label: 'Atm.', color: '#60a5fa' }
    ];
  } else if (objectType.includes('Black Hole')) {
    return [
      { start: 0, end: 0.01, label: 'Singularity', color: '#000' }
    ];
  }
  return [];
}

/**
 * Main DensityProfile component
 */
export default function DensityProfile({ mass, radius, objectType }) {
  const densityData = useMemo(() => generateDensityProfile(mass, radius, objectType),
    [mass, radius, objectType]);
  const zones = useMemo(() => getZoneLabels(objectType), [objectType]);

  // Chart dimensions
  const chartWidth = 700;
  const chartHeight = 500;
  const padding = { top: 40, right: 100, bottom: 60, left: 100 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Find min and max density for scaling (log scale)
  const densities = densityData.map(d => d.density).filter(d => d > 0);
  const minDensity = Math.min(...densities);
  const maxDensity = Math.max(...densities);
  const logMinDensity = Math.log10(minDensity);
  const logMaxDensity = Math.log10(maxDensity);
  const logRange = logMaxDensity - logMinDensity;

  // Scaling functions
  const xScale = (r) => r * plotWidth;
  const yScale = (density) => {
    if (density <= 0) return plotHeight;
    const logDensity = Math.log10(density);
    return plotHeight - ((logDensity - logMinDensity) / logRange) * plotHeight;
  };

  // Generate SVG path
  const pathData = densityData
    .map((point, i) => {
      const x = xScale(point.radius);
      const y = yScale(point.density);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Y-axis ticks (log scale)
  const yTicks = [];
  const startPower = Math.floor(logMinDensity);
  const endPower = Math.ceil(logMaxDensity);
  for (let power = startPower; power <= endPower; power++) {
    const density = Math.pow(10, power);
    yTicks.push({ density, y: yScale(density), label: `10^${power}` });
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'auto'
    }}>
      {/* Title */}
      <h2 style={{
        fontSize: '1.8rem',
        marginBottom: '15px',
        color: '#f4d03f',
        textAlign: 'center'
      }}>
        Density Profile: {objectType}
      </h2>

      {/* Chart */}
      <svg
        width={chartWidth}
        height={chartHeight}
        style={{
          backgroundColor: '#1a1a1c',
          borderRadius: '8px',
          border: '2px solid #393941',
          marginBottom: '30px'
        }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Zone backgrounds */}
          {zones.map((zone, i) => (
            <rect
              key={i}
              x={xScale(zone.start)}
              y={0}
              width={xScale(zone.end) - xScale(zone.start)}
              height={plotHeight}
              fill={zone.color}
              opacity={0.1}
            />
          ))}

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={i}
              x1={0}
              y1={tick.y}
              x2={plotWidth}
              y2={tick.y}
              stroke="#393941"
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.5}
            />
          ))}

          {/* Density curve */}
          <path
            d={pathData}
            fill="none"
            stroke="#8c7ae6"
            strokeWidth={3}
          />

          {/* Fill under curve */}
          <path
            d={`${pathData} L ${plotWidth} ${plotHeight} L 0 ${plotHeight} Z`}
            fill="#8c7ae6"
            opacity={0.2}
          />

          {/* X-axis */}
          <line
            x1={0}
            y1={plotHeight}
            x2={plotWidth}
            y2={plotHeight}
            stroke="#e9e9ea"
            strokeWidth={2}
          />

          {/* Y-axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={plotHeight}
            stroke="#e9e9ea"
            strokeWidth={2}
          />

          {/* X-axis ticks and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <g key={i}>
              <line
                x1={xScale(r)}
                y1={plotHeight}
                x2={xScale(r)}
                y2={plotHeight + 6}
                stroke="#e9e9ea"
                strokeWidth={2}
              />
              <text
                x={xScale(r)}
                y={plotHeight + 20}
                textAnchor="middle"
                fill="#e9e9ea"
                fontSize="12"
              >
                {(r * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={-6}
                y1={tick.y}
                x2={0}
                y2={tick.y}
                stroke="#e9e9ea"
                strokeWidth={2}
              />
              <text
                x={-10}
                y={tick.y + 4}
                textAnchor="end"
                fill="#e9e9ea"
                fontSize="11"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={plotWidth / 2}
            y={plotHeight + 45}
            textAnchor="middle"
            fill="#e9e9ea"
            fontSize="14"
            fontWeight="bold"
          >
            Radius (% of total)
          </text>

          <text
            x={-plotHeight / 2}
            y={-60}
            textAnchor="middle"
            fill="#e9e9ea"
            fontSize="14"
            fontWeight="bold"
            transform={`rotate(-90, -60, ${plotHeight / 2})`}
          >
            Density (kg/m³, log scale)
          </text>

          {/* Zone labels */}
          {zones.map((zone, i) => {
            const midX = xScale((zone.start + zone.end) / 2);
            return (
              <text
                key={i}
                x={midX}
                y={-10}
                textAnchor="middle"
                fill={zone.color}
                fontSize="11"
                fontWeight="bold"
              >
                {zone.label}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        width: '100%',
        maxWidth: '700px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Central Density
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>
            {maxDensity.toExponential(2)} kg/m³
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Surface Density
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#60a5fa' }}>
            {minDensity.toExponential(2)} kg/m³
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Density Contrast
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#8c7ae6' }}>
            {(maxDensity / minDensity).toExponential(2)}×
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1a1a1c',
        borderRadius: '8px',
        maxWidth: '700px',
        border: '1px solid #393941'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#4ade80' }}>
          Understanding Density Profiles
        </h3>
        <p style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '10px' }}>
          Density varies dramatically from the center to the surface of celestial objects due to
          gravity compressing material inward.
        </p>
        <ul style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li>
            <strong style={{ color: '#ef4444' }}>Core:</strong> Highest density due to gravitational
            compression and (for stars) fusion pressure.
          </li>
          <li>
            <strong style={{ color: '#fb923c' }}>Interior Zones:</strong> Density decreases outward,
            with different transport mechanisms (radiation vs. convection).
          </li>
          <li>
            <strong style={{ color: '#60a5fa' }}>Surface:</strong> Lowest density, where the object
            transitions to space or atmosphere.
          </li>
        </ul>
        {objectType.includes('Neutron Star') && (
          <p style={{ color: '#f4d03f', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
            Neutron star matter is the densest stable matter in the universe - a teaspoon would
            weigh billions of tons on Earth!
          </p>
        )}
      </div>
    </div>
  );
}
