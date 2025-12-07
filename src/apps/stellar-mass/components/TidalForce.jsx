/**
 * TidalForce.jsx
 *
 * Interactive visualization of tidal forces
 * Shows:
 * - Test object (human figure or sphere) at varying distances
 * - Stretching effect (spaghettification)
 * - Roche limit marker
 * - Tidal force magnitude
 * - Animation of object being torn apart inside Roche limit
 */

import React, { useState, useMemo } from 'react';

/**
 * Physical constants
 */
const G = 6.674e-11; // Gravitational constant
const SOLAR_MASS_KG = 1.989e30;

/**
 * Calculate Roche limit for a fluid body
 * d = 2.456 × R × (ρ_M / ρ_m)^(1/3)
 * Simplified: assumes object density ~ 1000 kg/m³ (water)
 */
function calculateRocheLimit(mass, radius) {
  // For simplicity, assume test object is similar to Earth
  const primaryDensity = (mass * SOLAR_MASS_KG) / ((4/3) * Math.PI * Math.pow(radius * 1000, 3));
  const objectDensity = 5500; // Earth-like density (kg/m³)

  const rocheLimit = 2.456 * radius * Math.pow(primaryDensity / objectDensity, 1/3);
  return rocheLimit;
}

/**
 * Calculate tidal force magnitude
 * F_tidal = 2 × G × M × h / r³
 * where h is object height, r is distance from center
 */
function calculateTidalForce(mass, distance, objectSize = 2) {
  const massKg = mass * SOLAR_MASS_KG;
  const distanceM = distance * 1000;
  const objectSizeM = objectSize * 1000;

  const tidalForce = (2 * G * massKg * objectSizeM) / Math.pow(distanceM, 3);
  return tidalForce; // in Newtons
}

/**
 * Human figure SVG component with stretching effect
 */
function HumanFigure({ stretchFactor, tearApart }) {
  const baseHeight = 60;
  const baseWidth = 20;
  const height = baseHeight * stretchFactor;
  const width = baseWidth / Math.sqrt(stretchFactor);

  if (tearApart) {
    // Show fragments
    return (
      <g>
        {/* Head */}
        <ellipse
          cx={0}
          cy={-height / 2 - 15}
          rx={width / 3}
          ry={width / 3}
          fill="#8c7ae6"
          opacity={0.6}
        />
        {/* Upper body */}
        <ellipse
          cx={0}
          cy={-height / 4}
          rx={width / 2}
          ry={height / 8}
          fill="#8c7ae6"
          opacity={0.6}
        />
        {/* Lower body */}
        <ellipse
          cx={0}
          cy={height / 4}
          rx={width / 2}
          ry={height / 8}
          fill="#8c7ae6"
          opacity={0.6}
        />
        {/* Legs */}
        <ellipse
          cx={-width / 4}
          cy={height / 2 + 15}
          rx={width / 4}
          ry={height / 6}
          fill="#8c7ae6"
          opacity={0.6}
        />
        <ellipse
          cx={width / 4}
          cy={height / 2 + 15}
          rx={width / 4}
          ry={height / 6}
          fill="#8c7ae6"
          opacity={0.6}
        />
      </g>
    );
  }

  return (
    <g>
      {/* Head */}
      <circle
        cx={0}
        cy={-height / 2 - width / 3}
        r={width / 3}
        fill="#8c7ae6"
      />
      {/* Body */}
      <rect
        x={-width / 3}
        y={-height / 2}
        width={width * 2 / 3}
        height={height * 0.6}
        fill="#8c7ae6"
        rx={width / 6}
      />
      {/* Arms */}
      <rect
        x={-width * 0.8}
        y={-height / 2 + height * 0.1}
        width={width * 0.2}
        height={height * 0.4}
        fill="#8c7ae6"
        rx={width / 10}
      />
      <rect
        x={width * 0.6}
        y={-height / 2 + height * 0.1}
        width={width * 0.2}
        height={height * 0.4}
        fill="#8c7ae6"
        rx={width / 10}
      />
      {/* Legs */}
      <rect
        x={-width * 0.2}
        y={height * 0.1}
        width={width * 0.25}
        height={height * 0.4}
        fill="#8c7ae6"
        rx={width / 10}
      />
      <rect
        x={width * 0.05}
        y={height * 0.1}
        width={width * 0.25}
        height={height * 0.4}
        fill="#8c7ae6"
        rx={width / 10}
      />
    </g>
  );
}

/**
 * Main TidalForce component
 */
export default function TidalForce({ mass, radius, objectType }) {
  const [distance, setDistance] = useState(radius * 10); // Start at 10× radius

  const rocheLimit = useMemo(() => calculateRocheLimit(mass, radius), [mass, radius]);
  const tidalForce = useMemo(() => calculateTidalForce(mass, distance), [mass, distance]);

  // Calculate stretch factor based on distance
  const stretchFactor = useMemo(() => {
    const ratio = distance / rocheLimit;
    if (ratio > 2) return 1; // No stretching far away
    if (ratio > 1) return 1 + (2 - ratio) * 0.5; // Mild stretching
    return 1 + (1 - ratio) * 5; // Extreme stretching near/inside Roche limit
  }, [distance, rocheLimit]);

  const isTornApart = distance < rocheLimit * 0.8;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 500;
  const centerX = 100;
  const centerY = svgHeight / 2;

  // Scale for visualization
  const maxDistance = radius * 20;
  const minDistance = radius * 0.5;
  const distanceScale = (svgWidth - 200) / maxDistance;

  // Object position
  const objectX = centerX + distance * distanceScale;

  // Format numbers for display
  const formatDistance = (d) => {
    if (d < 1) return `${(d * 1000).toFixed(0)} m`;
    if (d < 1000) return `${d.toFixed(1)} km`;
    return `${(d / 1000).toFixed(2)} × 10³ km`;
  };

  const formatForce = (f) => {
    if (f < 1) return `${(f * 1000).toFixed(2)} mN`;
    if (f < 1000) return `${f.toFixed(2)} N`;
    if (f < 1e6) return `${(f / 1000).toFixed(2)} kN`;
    return `${(f / 1e6).toFixed(2)} MN`;
  };

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
        Tidal Forces: {objectType}
      </h2>

      {/* Distance slider */}
      <div style={{
        marginBottom: '20px',
        width: '100%',
        maxWidth: '700px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          color: '#a1a1a8',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          Distance from Center: {formatDistance(distance)}
        </label>
        <input
          type="range"
          min={minDistance}
          max={maxDistance}
          step={radius * 0.1}
          value={distance}
          onChange={(e) => setDistance(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#8c7ae6'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '5px',
          fontSize: '0.8rem',
          color: '#a1a1a8'
        }}>
          <span>Surface ({formatDistance(radius)})</span>
          <span>Far ({formatDistance(maxDistance)})</span>
        </div>
      </div>

      {/* Main visualization */}
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{
          backgroundColor: '#000',
          borderRadius: '8px',
          border: '2px solid #393941',
          marginBottom: '20px'
        }}
      >
        <defs>
          <radialGradient id="objectGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4d03f" />
            <stop offset="100%" stopColor="#fb923c" />
          </radialGradient>
        </defs>

        {/* Central massive object */}
        <circle
          cx={centerX}
          cy={centerY}
          r={Math.min(radius * distanceScale, 50)}
          fill="url(#objectGradient)"
          stroke="#fff"
          strokeWidth={2}
        />

        {/* Roche limit circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={rocheLimit * distanceScale}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.8}
        />

        {/* Roche limit label */}
        <text
          x={centerX}
          y={centerY - rocheLimit * distanceScale - 10}
          textAnchor="middle"
          fill="#ef4444"
          fontSize="12"
          fontWeight="bold"
        >
          Roche Limit
        </text>

        {/* Distance line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={objectX}
          y2={centerY}
          stroke="#60a5fa"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.5}
        />

        {/* Test object (human figure) */}
        <g transform={`translate(${objectX}, ${centerY})`}>
          <HumanFigure stretchFactor={stretchFactor} tearApart={isTornApart} />
        </g>

        {/* Tidal force arrows */}
        {!isTornApart && (
          <g>
            {/* Stretching arrow (up) */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 5, 0 10"
                  fill="#fb923c"
                />
              </marker>
            </defs>
            <line
              x1={objectX}
              y1={centerY - 40 * stretchFactor}
              x2={objectX}
              y2={centerY - 60 * stretchFactor}
              stroke="#fb923c"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
            {/* Stretching arrow (down) */}
            <line
              x1={objectX}
              y1={centerY + 40 * stretchFactor}
              x2={objectX}
              y2={centerY + 60 * stretchFactor}
              stroke="#fb923c"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          </g>
        )}

        {/* Warning text if inside Roche limit */}
        {distance < rocheLimit && (
          <text
            x={svgWidth / 2}
            y={30}
            textAnchor="middle"
            fill="#ef4444"
            fontSize="16"
            fontWeight="bold"
          >
            ⚠ INSIDE ROCHE LIMIT - TIDAL DISRUPTION!
          </text>
        )}
      </svg>

      {/* Information panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Roche Limit
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>
            {formatDistance(rocheLimit)}
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Tidal Force
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fb923c' }}>
            {formatForce(tidalForce)}
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Stretch Factor
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#8c7ae6' }}>
            {stretchFactor.toFixed(2)}×
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Status
          </div>
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: isTornApart ? '#ef4444' : distance < rocheLimit ? '#fb923c' : '#4ade80'
          }}>
            {isTornApart ? 'Disrupted' : distance < rocheLimit ? 'Stretching' : 'Safe'}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1a1a1c',
        borderRadius: '8px',
        maxWidth: '800px',
        border: '1px solid #393941'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#4ade80' }}>
          Understanding Tidal Forces
        </h3>
        <p style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '10px' }}>
          Tidal forces arise because gravity decreases with distance. The near side of an object
          experiences stronger gravitational pull than the far side, creating a stretching effect.
        </p>
        <ul style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li>
            <strong style={{ color: '#ef4444' }}>Roche Limit:</strong> The distance at which tidal
            forces overcome the object's self-gravity. Fluid bodies disintegrate inside this radius.
          </li>
          <li>
            <strong style={{ color: '#fb923c' }}>Spaghettification:</strong> Extreme stretching that
            occurs near massive compact objects, especially black holes.
          </li>
          <li>
            <strong style={{ color: '#8c7ae6' }}>Force Scaling:</strong> Tidal force ∝ M/r³, so it
            increases rapidly as you approach the object.
          </li>
        </ul>
        {objectType.includes('Black Hole') && (
          <p style={{ color: '#f4d03f', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
            Near a black hole, tidal forces can become so extreme that atoms themselves are torn
            apart well before reaching the event horizon!
          </p>
        )}
      </div>

      {/* Quick distance buttons */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setDistance(radius)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#393941',
            color: '#e9e9ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Surface
        </button>
        <button
          onClick={() => setDistance(rocheLimit * 1.5)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#393941',
            color: '#e9e9ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Near Roche Limit
        </button>
        <button
          onClick={() => setDistance(rocheLimit)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#ef4444',
            color: '#e9e9ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          At Roche Limit
        </button>
        <button
          onClick={() => setDistance(rocheLimit * 0.7)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#ef4444',
            color: '#e9e9ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Inside Roche Limit
        </button>
        <button
          onClick={() => setDistance(radius * 15)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#393941',
            color: '#e9e9ea',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Safe Distance
        </button>
      </div>
    </div>
  );
}
