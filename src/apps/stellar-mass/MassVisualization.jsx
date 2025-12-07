/**
 * MassVisualization.jsx
 *
 * Enhanced 3D visualization of celestial bodies
 * Features:
 * - Mass and radius-dependent sizing
 * - Comparison mode showing reference objects side-by-side
 * - Improved lighting and materials
 * - Auto-rotation option
 * - Scale indicators
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Celestial body component that changes based on mass and radius
 */
function CelestialBody({ mass, radius, objectType, position = [0, 0, 0], showLabel = false, label = '' }) {
  const meshRef = useRef();
  const glowRef = useRef();

  // Calculate visual size based on actual radius
  const visualSize = useMemo(() => {
    const logRadius = Math.log10(radius);
    // Scale from 0.3 to 4 units based on log radius
    return Math.max(0.3, 0.5 + (logRadius + 3) / 10 * 3);
  }, [radius]);

  // Determine color based on object type
  const bodyColor = useMemo(() => {
    if (objectType.includes('Sub-planetary')) return '#a1a1a8';
    if (objectType.includes('Gas Giant')) return mass < 5e-6 ? '#60a5fa' : '#fb923c';
    if (objectType.includes('Brown Dwarf')) return '#a16207';
    if (objectType.includes('Red Dwarf')) return '#ef4444';
    if (objectType.includes('Sun-like')) return '#f4d03f';
    if (objectType.includes('Massive Star')) return '#60a5fa';
    if (objectType.includes('White Dwarf')) return '#f0f0f0';
    if (objectType.includes('Neutron Star')) return '#a78bfa';
    if (objectType.includes('Black Hole')) return '#000000';
    return '#f4d03f';
  }, [objectType, mass]);

  // Determine if object should have glow
  const hasGlow = useMemo(() => {
    return objectType.includes('Dwarf Star') ||
           objectType.includes('Sun-like') ||
           objectType.includes('Massive Star');
  }, [objectType]);

  // Determine if it's a black hole
  const isBlackHole = useMemo(() => {
    return objectType.includes('Black Hole');
  }, [objectType]);

  // Rotation animation
  useFrame((state, delta) => {
    if (meshRef.current && !isBlackHole) {
      meshRef.current.rotation.y += delta * 0.2;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[visualSize, 64, 64]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={hasGlow ? bodyColor : '#000000'}
          emissiveIntensity={hasGlow ? 0.6 : 0}
          roughness={isBlackHole ? 0 : 0.5}
          metalness={isBlackHole ? 1 : 0.2}
        />
      </mesh>

      {/* Outer glow for stars */}
      {hasGlow && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[visualSize * 1.3, 32, 32]} />
          <meshBasicMaterial
            color={bodyColor}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Accretion disk for black holes */}
      {isBlackHole && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[visualSize * 2.5, visualSize * 0.4, 16, 100]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={1.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Event horizon indicator for black holes */}
      {isBlackHole && (
        <mesh>
          <sphereGeometry args={[visualSize * 1.8, 32, 32]} />
          <meshBasicMaterial
            color="#8c7ae6"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Point light for stars */}
      {hasGlow && !isBlackHole && (
        <pointLight
          color={bodyColor}
          intensity={3}
          distance={25}
          decay={2}
        />
      )}

      {/* Label */}
      {showLabel && label && (
        <Text
          position={[0, visualSize + 1, 0]}
          fontSize={0.5}
          color="#e9e9ea"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}

      {/* Scale indicator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[visualSize * 1.5, 0.02, 8, 64]} />
        <meshBasicMaterial color="#393941" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Comparison objects for side-by-side viewing
 */
function ComparisonBodies({ mass, radius, objectType }) {
  // Reference objects to compare against
  const referenceObjects = useMemo(() => {
    const refs = [];

    // Always show the current object
    refs.push({
      mass,
      radius,
      objectType,
      position: [0, 0, 0],
      label: 'Current'
    });

    // Add comparison object based on mass range
    if (mass < 0.001) {
      refs.push({
        mass: 0.001,
        radius: 71000,
        objectType: 'Gas Giant Planet',
        position: [6, 0, 0],
        label: 'Jupiter'
      });
    } else if (mass < 0.08) {
      refs.push({
        mass: 0.05,
        radius: 80000,
        objectType: 'Brown Dwarf',
        position: [6, 0, 0],
        label: 'Brown Dwarf'
      });
    } else if (mass < 2) {
      refs.push({
        mass: 1.0,
        radius: 696000,
        objectType: 'Sun-like Star',
        position: [8, 0, 0],
        label: 'Sun'
      });
    } else if (mass < 8) {
      refs.push({
        mass: 2.1,
        radius: 696000 * 1.7,
        objectType: 'Massive Star',
        position: [10, 0, 0],
        label: 'Sirius'
      });
    } else {
      refs.push({
        mass: 1.0,
        radius: 696000,
        objectType: 'Sun-like Star',
        position: [8, 0, 0],
        label: 'Sun (reference)'
      });
    }

    return refs;
  }, [mass, radius, objectType]);

  return (
    <group>
      {referenceObjects.map((obj, i) => (
        <CelestialBody
          key={i}
          mass={obj.mass}
          radius={obj.radius}
          objectType={obj.objectType}
          position={obj.position}
          showLabel={true}
          label={obj.label}
        />
      ))}
    </group>
  );
}

/**
 * Info label component
 */
function InfoLabel({ mass, radius, objectType }) {
  const formatMass = (massValue) => {
    if (massValue < 0.001) {
      return `${(massValue * 1e6).toFixed(2)} × 10⁻⁶ M☉`;
    } else if (massValue < 0.1) {
      return `${(massValue * 1000).toFixed(2)} × 10⁻³ M☉`;
    } else if (massValue < 100) {
      return `${massValue.toFixed(2)} M☉`;
    } else {
      return `${massValue.toFixed(0)} M☉`;
    }
  };

  const formatRadius = (radiusKm) => {
    if (radiusKm < 100) {
      return `${radiusKm.toFixed(2)} km`;
    } else if (radiusKm < 100000) {
      return `${radiusKm.toFixed(0)} km`;
    } else {
      return `${(radiusKm / 696000).toFixed(2)} R☉`;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#e9e9ea',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      zIndex: 10,
      border: '1px solid #393941'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#f4d03f', fontSize: '15px' }}>
        {objectType}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <span style={{ color: '#a1a1a8' }}>Mass:</span>{' '}
        <span style={{ color: '#8c7ae6' }}>{formatMass(mass)}</span>
      </div>
      <div>
        <span style={{ color: '#a1a1a8' }}>Radius:</span>{' '}
        <span style={{ color: '#4ade80' }}>{formatRadius(radius)}</span>
      </div>
    </div>
  );
}

/**
 * Camera controls panel
 */
function ControlsPanel({ autoRotate, setAutoRotate }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#e9e9ea',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 10,
      border: '1px solid #393941'
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={autoRotate}
          onChange={(e) => setAutoRotate(e.target.checked)}
          style={{ accentColor: '#8c7ae6' }}
        />
        <span>Auto-Rotate</span>
      </label>
    </div>
  );
}

/**
 * Main visualization component
 */
export default function MassVisualization({ mass, radius, objectType, onLoad, showComparison = false }) {
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      if (onLoad) onLoad();
    }, 500);
    return () => clearTimeout(timer);
  }, [onLoad]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <InfoLabel mass={mass} radius={radius} objectType={objectType} />
      <ControlsPanel autoRotate={autoRotate} setAutoRotate={setAutoRotate} />

      <Canvas
        camera={{ position: [0, 5, 15], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.4} />

        {/* Directional lights */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.6}
          castShadow
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.3}
        />

        {/* Stars background */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Celestial bodies */}
        {showComparison ? (
          <ComparisonBodies mass={mass} radius={radius} objectType={objectType} />
        ) : (
          <CelestialBody mass={mass} radius={radius} objectType={objectType} />
        )}

        {/* Reference orbital ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[10, 0.03, 16, 100]} />
          <meshBasicMaterial color="#393941" transparent opacity={0.3} />
        </mesh>

        {/* Grid helper for scale */}
        <gridHelper args={[30, 30, '#393941', '#252528']} position={[0, -5, 0]} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          dampingFactor={0.05}
          enableDamping={true}
        />
      </Canvas>
    </div>
  );
}
