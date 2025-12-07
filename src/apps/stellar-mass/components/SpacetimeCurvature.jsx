/**
 * SpacetimeCurvature.jsx
 *
 * 2D visualization of spacetime curvature caused by mass
 * Shows:
 * - Warped grid representing curved spacetime
 * - Deeper curvature = stronger gravity
 * - Event horizon and photon sphere for black holes
 * - Test particles moving on geodesics
 */

import React, { useMemo, useState, useEffect } from 'react';

/**
 * Physical constants
 */
const G = 6.674e-11; // Gravitational constant (m^3 kg^-1 s^-2)
const C = 299792458; // Speed of light (m/s)
const SOLAR_MASS_KG = 1.989e30;

/**
 * Calculate Schwarzschild radius (event horizon)
 * r_s = 2GM/c^2
 */
function calculateSchwarzschildRadius(mass) {
  const massKg = mass * SOLAR_MASS_KG;
  return (2 * G * massKg) / (C * C) / 1000; // in km
}

/**
 * Calculate curvature depth at distance r from object
 * Using simplified potential well visualization
 */
function getCurvatureDepth(mass, radius, distance) {
  const rs = calculateSchwarzschildRadius(mass);

  // Prevent division by zero
  if (distance < radius * 0.1) distance = radius * 0.1;

  // Simplified curvature metric (not exact GR, but visually representative)
  const depth = rs / distance;

  // Scale for visualization
  return Math.min(depth * 100, 200);
}

/**
 * Generate warped grid points
 */
function generateWarpedGrid(mass, radius, gridSize = 20) {
  const points = [];
  const maxDist = 500; // Maximum distance to visualize (in visual units)

  for (let i = 0; i <= gridSize; i++) {
    const row = [];
    for (let j = 0; j <= gridSize; j++) {
      // Map to radial coordinates
      const x = (j / gridSize - 0.5) * maxDist * 2;
      const y = (i / gridSize - 0.5) * maxDist * 2;
      const r = Math.sqrt(x * x + y * y);

      // Calculate curvature at this distance
      const depth = getCurvatureDepth(mass, radius, Math.max(r, 1));

      row.push({ x, y, z: -depth });
    }
    points.push(row);
  }

  return points;
}

/**
 * Test particle following geodesic
 */
function TestParticle({ mass, radius, index }) {
  const [angle, setAngle] = useState((index * Math.PI * 2) / 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle(a => a + 0.01);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const orbitRadius = 50 + index * 30;
  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <circle
      cx={x}
      cy={y}
      r={3}
      fill="#8c7ae6"
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

/**
 * Main SpacetimeCurvature component
 */
export default function SpacetimeCurvature({ mass, radius, objectType }) {
  const [viewAngle, setViewAngle] = useState(45); // 3D viewing angle

  const schwarzschildRadius = useMemo(() => calculateSchwarzschildRadius(mass), [mass]);
  const photonSphere = schwarzschildRadius * 1.5;
  const isBlackHole = objectType.includes('Black Hole');

  // Generate grid
  const gridPoints = useMemo(() => generateWarpedGrid(mass, radius), [mass, radius]);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 600;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const scale = 0.8;

  // Project 3D grid to 2D for visualization
  const project3Dto2D = (x, y, z) => {
    const angleRad = (viewAngle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    // Simple perspective projection
    const x2D = x * scale;
    const y2D = y * cosAngle * scale - z * sinAngle * 0.5;

    return {
      x: centerX + x2D,
      y: centerY + y2D
    };
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
        Spacetime Curvature: {objectType}
      </h2>

      {/* View angle control */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <label style={{ color: '#a1a1a8', fontSize: '0.9rem' }}>
          View Angle: {viewAngle}°
        </label>
        <input
          type="range"
          min={0}
          max={90}
          value={viewAngle}
          onChange={(e) => setViewAngle(parseInt(e.target.value))}
          style={{
            width: '200px',
            accentColor: '#8c7ae6'
          }}
        />
      </div>

      {/* Main visualization */}
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{
          backgroundColor: '#000',
          borderRadius: '8px',
          border: '2px solid #393941'
        }}
      >
        <defs>
          {/* Gradient for grid */}
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8c7ae6" stopOpacity="0.3" />
          </linearGradient>

          {/* Radial gradient for black hole */}
          <radialGradient id="blackHoleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <stop offset="70%" stopColor="#1a1a1c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#393941" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Draw grid lines (latitude lines) */}
        {gridPoints.map((row, i) => {
          const pathData = row.map((point, j) => {
            const projected = project3Dto2D(point.x, point.y, point.z);
            return `${j === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
          }).join(' ');

          return (
            <path
              key={`row-${i}`}
              d={pathData}
              stroke="url(#gridGradient)"
              strokeWidth={1}
              fill="none"
              opacity={0.6}
            />
          );
        })}

        {/* Draw grid lines (longitude lines) */}
        {gridPoints[0].map((_, j) => {
          const pathData = gridPoints.map((row, i) => {
            const point = row[j];
            const projected = project3Dto2D(point.x, point.y, point.z);
            return `${i === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
          }).join(' ');

          return (
            <path
              key={`col-${j}`}
              d={pathData}
              stroke="url(#gridGradient)"
              strokeWidth={1}
              fill="none"
              opacity={0.6}
            />
          );
        })}

        {/* Central object */}
        <circle
          cx={centerX}
          cy={centerY}
          r={isBlackHole ? 30 : 20}
          fill={isBlackHole ? "url(#blackHoleGradient)" : "#f4d03f"}
          stroke={isBlackHole ? "#8c7ae6" : "#fff"}
          strokeWidth={2}
        />

        {/* Event horizon (for black holes and massive objects) */}
        {schwarzschildRadius > 0.1 && (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={Math.min(schwarzschildRadius * 50, 100)}
              fill="none"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.8}
            />
            <text
              x={centerX + Math.min(schwarzschildRadius * 50, 100) + 10}
              y={centerY}
              fill="#ef4444"
              fontSize="11"
              fontWeight="bold"
            >
              Event Horizon
            </text>
          </g>
        )}

        {/* Photon sphere (for black holes) */}
        {isBlackHole && (
          <g>
            <circle
              cx={centerX}
              cy={centerY}
              r={Math.min(photonSphere * 50, 150)}
              fill="none"
              stroke="#f4d03f"
              strokeWidth={2}
              strokeDasharray="3,3"
              opacity={0.6}
            />
            <text
              x={centerX + Math.min(photonSphere * 50, 150) + 10}
              y={centerY + 10}
              fill="#f4d03f"
              fontSize="11"
            >
              Photon Sphere
            </text>
          </g>
        )}

        {/* Test particles on geodesics */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {[0, 1, 2, 3, 4].map(i => (
            <TestParticle key={i} mass={mass} radius={radius} index={i} />
          ))}
        </g>

        {/* Center marker */}
        <circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="#fff"
        />
      </svg>

      {/* Information panels */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        width: '100%',
        maxWidth: '800px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Schwarzschild Radius
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>
            {schwarzschildRadius < 1
              ? `${(schwarzschildRadius * 1000).toFixed(2)} m`
              : schwarzschildRadius < 1000
                ? `${schwarzschildRadius.toFixed(2)} km`
                : `${(schwarzschildRadius / 1000).toFixed(2)} × 10³ km`
            }
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Photon Sphere Radius
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f4d03f' }}>
            {photonSphere < 1
              ? `${(photonSphere * 1000).toFixed(2)} m`
              : photonSphere < 1000
                ? `${photonSphere.toFixed(2)} km`
                : `${(photonSphere / 1000).toFixed(2)} × 10³ km`
            }
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          border: '1px solid #393941'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
            Surface Gravity Effect
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#8c7ae6' }}>
            {isBlackHole ? 'Infinite at Horizon' : 'Finite'}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#1a1a1c',
        borderRadius: '8px',
        maxWidth: '800px',
        border: '1px solid #393941'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#4ade80' }}>
          Understanding Spacetime Curvature
        </h3>
        <p style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '10px' }}>
          Mass warps the fabric of spacetime, creating what we perceive as gravity. The grid
          visualization shows how spacetime curves more steeply near massive objects.
        </p>
        <ul style={{ color: '#a1a1a8', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li>
            <strong style={{ color: '#ef4444' }}>Event Horizon:</strong> The boundary where escape
            velocity equals the speed of light. Nothing can escape from within this radius.
          </li>
          <li>
            <strong style={{ color: '#f4d03f' }}>Photon Sphere:</strong> At 1.5× the Schwarzschild
            radius, light can orbit the object. Unstable circular orbits exist here.
          </li>
          <li>
            <strong style={{ color: '#8c7ae6' }}>Test Particles:</strong> Purple dots follow geodesics
            (straight paths in curved spacetime), appearing as orbits in our reference frame.
          </li>
        </ul>
        {isBlackHole && (
          <p style={{ color: '#fb923c', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px' }}>
            For a black hole, spacetime curvature becomes so extreme at the event horizon that
            not even light can escape. The singularity at the center represents a breakdown
            of our physical theories.
          </p>
        )}
      </div>
    </div>
  );
}
