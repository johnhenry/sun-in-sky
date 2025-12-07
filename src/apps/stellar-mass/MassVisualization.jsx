import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Celestial body component that changes based on mass
function CelestialBody({ mass, objectType }) {
  const meshRef = useRef();
  const glowRef = useRef();

  // Calculate visual size (logarithmic scale for better visualization)
  const visualSize = useMemo(() => {
    const logMass = Math.log10(mass);
    // Scale from 0.5 to 3 units based on log mass
    return 0.5 + (logMass + 10) / 12 * 2.5;
  }, [mass]);

  // Determine color based on object type
  const bodyColor = useMemo(() => {
    switch (objectType) {
      case 'Planet':
        return mass < 1e-5 ? '#60a5fa' : '#fb923c'; // Blue for small, orange for gas giants
      case 'Brown Dwarf':
        return '#a16207';
      case 'Red Dwarf':
        return '#ef4444';
      case 'Sun-like Star':
        return '#f4d03f';
      case 'Massive Star':
        return '#60a5fa';
      case 'Stellar Remnant':
        return mass > 3 ? '#000000' : '#a78bfa'; // Black for black hole, purple for neutron star
      default:
        return '#f4d03f';
    }
  }, [objectType, mass]);

  // Determine if object should have glow
  const hasGlow = useMemo(() => {
    return objectType !== 'Planet' && objectType !== 'Brown Dwarf';
  }, [objectType]);

  // Determine if it's a black hole
  const isBlackHole = useMemo(() => {
    return objectType === 'Stellar Remnant' && mass > 3;
  }, [objectType, mass]);

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
    <group>
      {/* Main body */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[visualSize, 64, 64]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={hasGlow ? bodyColor : '#000000'}
          emissiveIntensity={hasGlow ? 0.5 : 0}
          roughness={isBlackHole ? 0 : 0.5}
          metalness={isBlackHole ? 1 : 0.2}
        />
      </mesh>

      {/* Outer glow for stars */}
      {hasGlow && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[visualSize * 1.2, 32, 32]} />
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
          <torusGeometry args={[visualSize * 2, visualSize * 0.3, 16, 100]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#f97316"
            emissiveIntensity={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Point light for stars */}
      {hasGlow && !isBlackHole && (
        <pointLight
          color={bodyColor}
          intensity={2}
          distance={20}
          decay={2}
        />
      )}
    </group>
  );
}

// Info label component
function InfoLabel({ mass, objectType }) {
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

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 10
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold', color: '#f4d03f' }}>
        {objectType}
      </div>
      <div style={{ color: '#a1a1a8' }}>
        Mass: {formatMass(mass)}
      </div>
    </div>
  );
}

// Main visualization component
export default function MassVisualization({ mass, objectType, onLoad }) {
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      if (onLoad) onLoad();
    }, 500);
    return () => clearTimeout(timer);
  }, [onLoad]);

  return (
    <>
      <InfoLabel mass={mass} objectType={objectType} />
      <Canvas
        camera={{ position: [0, 5, 15], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.3} />

        {/* Directional light */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.5}
          castShadow
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

        {/* Celestial body */}
        <CelestialBody mass={mass} objectType={objectType} />

        {/* Orbital ring for reference */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[8, 0.02, 16, 100]} />
          <meshBasicMaterial color="#393941" transparent opacity={0.3} />
        </mesh>

        {/* Grid helper for scale */}
        <gridHelper args={[20, 20, '#393941', '#252528']} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          autoRotate={false}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </>
  );
}
