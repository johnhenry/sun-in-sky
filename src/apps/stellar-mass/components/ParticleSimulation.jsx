/**
 * ParticleSimulation.jsx
 *
 * Simplified particle simulation using ~100 cube meshes
 * Shows gravitational collapse and fusion effects
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 100;
const CUBE_SIZE = 0.05;

// Physical constants (in solar masses)
const HYDROSTATIC_EQUILIBRIUM_MASS = 2.5e-10; // ~Ceres mass
const DEUTERIUM_FUSION_MASS = 0.013;
const HYDROGEN_FUSION_MASS = 0.08;
const CARBON_FUSION_MASS = 8;

/**
 * Generate evenly distributed points on a sphere using Fibonacci sphere algorithm
 */
function fibonacciSphere(count, radius) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // y from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radiusAtY * radius;
    const yPos = y * radius;
    const z = Math.sin(theta) * radiusAtY * radius;

    points.push({ x, y: yPos, z });
  }

  return points;
}

/**
 * Cube particles with physics-based behavior
 */
function CubeParticles({ mass, radius, fusionState }) {
  const meshRef = useRef();
  const initialPositions = useRef([]);
  const targetPositions = useRef([]);
  const velocities = useRef([]);
  const collapseProgress = useRef(0);
  const collapseStartTime = useRef(null);
  const prevHasHydrostaticEquilibrium = useRef(null);

  // Determine if object has hydrostatic equilibrium
  const hasHydrostaticEquilibrium = mass >= HYDROSTATIC_EQUILIBRIUM_MASS;

  // Get cube color based on fusion state
  const cubeColor = useMemo(() => {
    switch (fusionState) {
      case 'none':
        return new THREE.Color('#8a8a9c'); // Light gray-blue (visible against dark background)
      case 'deuterium':
        return new THREE.Color('#fb923c'); // Amber
      case 'hydrogen':
        return new THREE.Color('#f4d03f'); // Yellow
      case 'massive':
        return new THREE.Color('#60a5fa'); // Blue-white
      default:
        return new THREE.Color('#8a8a9c');
    }
  }, [fusionState]);

  // Calculate emissive intensity
  const emissiveIntensity = useMemo(() => {
    switch (fusionState) {
      case 'none':
        return 0.2; // Small base emissive so cubes are always visible
      case 'deuterium':
        return 0.5;
      case 'hydrogen':
        return 1.5;
      case 'massive':
        return 3.0;
      default:
        return 0.2;
    }
  }, [fusionState]);

  // Calculate visual radius for sphere
  const visualRadius = useMemo(() => {
    // Scale radius logarithmically for better visualization
    return Math.max(1, Math.log10(mass + 1) * 2);
  }, [mass]);

  // Initialize positions when component mounts or particle count changes
  useEffect(() => {
    // Detect transition direction
    const wasAboveHE = prevHasHydrostaticEquilibrium.current;
    const isNowAboveHE = hasHydrostaticEquilibrium;

    // Only regenerate positions on first mount or when transitioning states
    const shouldRegeneratePositions =
      wasAboveHE === null || // First mount
      wasAboveHE !== isNowAboveHE; // State transition

    if (shouldRegeneratePositions) {
      // Random initial positions (irregular blob)
      const initial = [];
      const vels = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        // Create an irregular blob by using non-uniform radius distribution
        // Mix of different radii to create lumpy, non-spherical shape
        const r = (Math.random() * Math.random()) * 2 + 0.5; // Irregular radius 0.5-2.5 units

        // Add some asymmetry to make it look irregular
        const asymmetryX = 1 + (Math.random() - 0.5) * 0.5;
        const asymmetryY = 1 + (Math.random() - 0.5) * 0.5;
        const asymmetryZ = 1 + (Math.random() - 0.5) * 0.5;

        initial.push({
          x: r * Math.sin(phi) * Math.cos(theta) * asymmetryX,
          y: r * Math.sin(phi) * Math.sin(theta) * asymmetryY,
          z: r * Math.cos(phi) * asymmetryZ
        });

        vels.push({
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        });
      }

      // Target positions (collapsed sphere)
      const targets = fibonacciSphere(PARTICLE_COUNT, visualRadius);

      // If transitioning from sphere to blob, swap initial and target
      if (wasAboveHE && !isNowAboveHE) {
        // Going from sphere → blob: current positions are sphere, animate to blob
        initialPositions.current = targets; // Start from sphere
        targetPositions.current = initial; // Animate to blob
        collapseStartTime.current = Date.now();
        collapseProgress.current = 0;
      } else {
        // Going from blob → sphere OR first mount
        initialPositions.current = initial;
        targetPositions.current = targets;
        velocities.current = vels;

        if (isNowAboveHE) {
          collapseStartTime.current = Date.now();
          collapseProgress.current = 0;
        }
      }
    } else {
      // Just update targets if radius changed but HE state didn't
      targetPositions.current = fibonacciSphere(PARTICLE_COUNT, visualRadius);
    }

    // Update previous state
    prevHasHydrostaticEquilibrium.current = hasHydrostaticEquilibrium;
  }, [hasHydrostaticEquilibrium, visualRadius]);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return;

    // Safety check: ensure positions are initialized
    if (!targetPositions.current || targetPositions.current.length === 0) return;
    if (!initialPositions.current || initialPositions.current.length === 0) return;

    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    // Handle transition animation (both directions)
    const isAnimating = collapseStartTime.current !== null && collapseProgress.current < 1;

    if (isAnimating) {
      // Transitioning (either sphere→blob or blob→sphere)
      const elapsed = (Date.now() - collapseStartTime.current) / 1000;
      collapseProgress.current = Math.min(1, elapsed / 2.0);

      // Pulsing effect for fusion (only when in sphere state)
      let pulseScale = 1;
      if (hasHydrostaticEquilibrium && fusionState !== 'none') {
        const pulseSpeed = fusionState === 'carbon' ? 3 : fusionState === 'hydrogen' ? 2 : 1.5;
        const pulseAmount = fusionState === 'carbon' ? 0.1 : fusionState === 'hydrogen' ? 0.08 : 0.05;
        pulseScale = 1 + Math.sin(time * pulseSpeed) * pulseAmount;
      }

      // Update each cube's position
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const initial = initialPositions.current[i];
        const target = targetPositions.current[i];

        // Smooth interpolation with easing
        const t = collapseProgress.current;
        const easedT = t * t * (3 - 2 * t); // Smoothstep easing

        const x = THREE.MathUtils.lerp(initial.x, target.x, easedT) * pulseScale;
        const y = THREE.MathUtils.lerp(initial.y, target.y, easedT) * pulseScale;
        const z = THREE.MathUtils.lerp(initial.z, target.z, easedT) * pulseScale;

        dummy.position.set(x, y, z);

        // Random rotation for visual interest
        dummy.rotation.x = time * 0.5 + i;
        dummy.rotation.y = time * 0.7 + i * 0.5;

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      // If animation finished and now below HE, switch to Brownian motion
      if (collapseProgress.current >= 1 && !hasHydrostaticEquilibrium) {
        // Copy current positions to initialPositions for Brownian motion
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          initialPositions.current[i] = { ...targetPositions.current[i] };
        }
        collapseStartTime.current = null;
      } else if (collapseProgress.current >= 1) {
        // Animation finished, clear the start time
        collapseStartTime.current = null;
      }

    } else if (hasHydrostaticEquilibrium) {
      // Stable sphere state with pulsing
      let pulseScale = 1;
      if (fusionState !== 'none') {
        const pulseSpeed = fusionState === 'carbon' ? 3 : fusionState === 'hydrogen' ? 2 : 1.5;
        const pulseAmount = fusionState === 'carbon' ? 0.1 : fusionState === 'hydrogen' ? 0.08 : 0.05;
        pulseScale = 1 + Math.sin(time * pulseSpeed) * pulseAmount;
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const target = targetPositions.current[i];
        const x = target.x * pulseScale;
        const y = target.y * pulseScale;
        const z = target.z * pulseScale;

        dummy.position.set(x, y, z);
        dummy.rotation.x = time * 0.5 + i;
        dummy.rotation.y = time * 0.7 + i * 0.5;

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

    } else {
      // Brownian motion for irregular blob
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pos = initialPositions.current[i];
        const vel = velocities.current[i];

        // Random walk
        vel.x += (Math.random() - 0.5) * 0.001;
        vel.y += (Math.random() - 0.5) * 0.001;
        vel.z += (Math.random() - 0.5) * 0.001;

        // Damping
        vel.x *= 0.98;
        vel.y *= 0.98;
        vel.z *= 0.98;

        // Update position
        pos.x += vel.x;
        pos.y += vel.y;
        pos.z += vel.z;

        // Keep particles in bounds
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        if (dist > 10) {
          const scale = 10 / dist;
          pos.x *= scale;
          pos.y *= scale;
          pos.z *= scale;
        }

        dummy.position.set(pos.x, pos.y, pos.z);
        dummy.rotation.x = time * 0.3 + i;
        dummy.rotation.y = time * 0.5 + i * 0.3;

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          color={cubeColor}
          emissive={cubeColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.7}
        />
      </instancedMesh>

      {/* Point light for fusion states */}
      {fusionState !== 'none' && (
        <pointLight
          color={cubeColor}
          intensity={emissiveIntensity * 2}
          distance={30}
          decay={2}
        />
      )}
    </group>
  );
}

/**
 * Info overlay showing current state
 */
function InfoOverlay({ mass, objectType }) {
  const getStateDescription = () => {
    if (mass < HYDROSTATIC_EQUILIBRIUM_MASS) return 'Irregular blob - gravity too weak';
    if (mass < DEUTERIUM_FUSION_MASS) return 'Spherical - hydrostatic equilibrium achieved';
    if (mass < HYDROGEN_FUSION_MASS) return 'Deuterium fusion - brown dwarf glowing';
    if (mass < CARBON_FUSION_MASS) return 'Hydrogen fusion - main sequence star';
    return 'Massive star - intense fusion';
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#e9e9ea',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      zIndex: 10,
      maxWidth: '350px',
      pointerEvents: 'none'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#8c7ae6', fontSize: '16px' }}>
        Particle Simulation
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#a1a1a8' }}>State:</span>{' '}
        <span style={{ color: '#4ade80' }}>{getStateDescription()}</span>
      </div>
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#a1a1a8', lineHeight: '1.6' }}>
        {mass < HYDROSTATIC_EQUILIBRIUM_MASS ? (
          'Below 2.5×10⁻¹⁰ M☉: Irregular blob - gravity too weak to form a sphere'
        ) : mass < DEUTERIUM_FUSION_MASS ? (
          'Above 2.5×10⁻¹⁰ M☉: Gravity wins! Blob becomes spherical'
        ) : (
          'Fusion has begun - particles glow with nuclear energy'
        )}
      </div>
    </div>
  );
}

/**
 * Main ParticleSimulation component
 */
export default function ParticleSimulation({ mass, radius, objectType, fusionState }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: '600px' }}>
      <InfoOverlay mass={mass} objectType={objectType} />
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.3} />

        {/* Directional light */}
        <directionalLight position={[10, 10, 5]} intensity={0.5} />

        {/* Stars background */}
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          saturation={0}
          fade
          speed={0.3}
        />

        {/* Cube particles */}
        <CubeParticles mass={mass} radius={radius} fusionState={fusionState} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
