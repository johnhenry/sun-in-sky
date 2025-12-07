/**
 * ParticleSimulation.jsx
 *
 * Three.js-based particle simulation showing gravitational collapse and fusion
 * Particle behavior changes based on mass thresholds:
 * - Below 0.001 M☉: Diffuse cloud (no hydrostatic equilibrium)
 * - 0.001+ M☉: Gravitational collapse into sphere
 * - 0.013+ M☉: Deuterium fusion (faint amber glow)
 * - 0.08+ M☉: Hydrogen fusion (bright yellow-white glow)
 * - 8+ M☉: Massive star (intense white-blue glow)
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Particle system component with physics-based behavior
 */
function ParticleCloud({ mass, radius, objectType }) {
  const particlesRef = useRef();
  const initialPositions = useRef(null);
  const targetPositions = useRef(null);
  const velocities = useRef(null);
  const collapseProgress = useRef(0);

  // Determine particle count based on mass
  const particleCount = useMemo(() => {
    if (mass < 0.001) return 5000;
    if (mass < 0.013) return 3000;
    if (mass < 0.08) return 2500;
    if (mass < 8) return 2000;
    return 1500;
  }, [mass]);

  // Calculate visual size (in Three.js units)
  const visualRadius = useMemo(() => {
    const logMass = Math.log10(mass);
    return 0.5 + (logMass + 10) / 12 * 2.5;
  }, [mass]);

  // Determine if object has hydrostatic equilibrium
  const hasHydrostaticEquilibrium = mass >= 0.001;

  // Determine fusion state
  const fusionState = useMemo(() => {
    if (mass < 0.013) return 'none';
    if (mass < 0.08) return 'deuterium';
    if (mass < 8) return 'hydrogen';
    return 'massive';
  }, [mass]);

  // Get particle color based on fusion state
  const getParticleColor = useMemo(() => {
    switch (fusionState) {
      case 'none':
        return new THREE.Color('#60a5fa'); // Blue
      case 'deuterium':
        return new THREE.Color('#fb923c'); // Amber
      case 'hydrogen':
        return new THREE.Color('#f4d03f'); // Yellow-white
      case 'massive':
        return new THREE.Color('#60a5fa'); // White-blue
      default:
        return new THREE.Color('#a1a1a8'); // Gray
    }
  }, [fusionState]);

  // Initialize particle positions
  useEffect(() => {
    const positions = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);

    // Initial diffuse cloud
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 10; // Large diffuse cloud

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Random velocities for Brownian motion
      vels[i3] = (Math.random() - 0.5) * 0.02;
      vels[i3 + 1] = (Math.random() - 0.5) * 0.02;
      vels[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    // Target positions (collapsed sphere)
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = visualRadius * (0.8 + Math.random() * 0.4); // Some variation

      targets[i3] = r * Math.sin(phi) * Math.cos(theta);
      targets[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      targets[i3 + 2] = r * Math.cos(phi);
    }

    initialPositions.current = positions;
    targetPositions.current = targets;
    velocities.current = vels;

    if (particlesRef.current) {
      particlesRef.current.geometry.attributes.position.array = positions;
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Reset collapse progress when mass changes significantly
    collapseProgress.current = hasHydrostaticEquilibrium ? 1 : 0;
  }, [particleCount, visualRadius, hasHydrostaticEquilibrium]);

  // Animation loop
  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array;

    if (hasHydrostaticEquilibrium) {
      // Collapse animation
      if (collapseProgress.current < 1) {
        collapseProgress.current = Math.min(1, collapseProgress.current + delta * 0.5);
      }

      // Interpolate between initial and target positions
      for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = THREE.MathUtils.lerp(
          initialPositions.current[i],
          targetPositions.current[i],
          collapseProgress.current
        );
      }

      // Add pulsing effect for fusion
      if (fusionState !== 'none') {
        const pulseIntensity = fusionState === 'massive' ? 0.15 : 0.08;
        const pulseSpeed = fusionState === 'massive' ? 3 : 2;
        const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseIntensity + 1;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const dx = positions[i3] - 0;
          const dy = positions[i3 + 1] - 0;
          const dz = positions[i3 + 2] - 0;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist > 0) {
            positions[i3] = dx * pulse;
            positions[i3 + 1] = dy * pulse;
            positions[i3 + 2] = dz * pulse;
          }
        }
      }
    } else {
      // Brownian motion for diffuse cloud
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Update velocities with random walk
        velocities.current[i3] += (Math.random() - 0.5) * 0.001;
        velocities.current[i3 + 1] += (Math.random() - 0.5) * 0.001;
        velocities.current[i3 + 2] += (Math.random() - 0.5) * 0.001;

        // Damping
        velocities.current[i3] *= 0.98;
        velocities.current[i3 + 1] *= 0.98;
        velocities.current[i3 + 2] *= 0.98;

        // Update positions
        positions[i3] += velocities.current[i3];
        positions[i3 + 1] += velocities.current[i3 + 1];
        positions[i3 + 2] += velocities.current[i3 + 2];

        // Keep particles in a rough sphere
        const dist = Math.sqrt(
          positions[i3] * positions[i3] +
          positions[i3 + 1] * positions[i3 + 1] +
          positions[i3 + 2] * positions[i3 + 2]
        );

        if (dist > 15) {
          const scale = 15 / dist;
          positions[i3] *= scale;
          positions[i3 + 1] *= scale;
          positions[i3 + 2] *= scale;
        }
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Custom shader material for glowing particles
  const particleMaterial = useMemo(() => {
    const glowIntensity = fusionState === 'massive' ? 3.0 :
                         fusionState === 'hydrogen' ? 2.0 :
                         fusionState === 'deuterium' ? 1.0 : 0.3;

    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: getParticleColor },
        glowIntensity: { value: glowIntensity },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = ${fusionState !== 'none' ? '4.0' : '2.0'} * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float glowIntensity;
        varying vec3 vPosition;

        void main() {
          float distanceToCenter = length(gl_PointCoord - vec2(0.5, 0.5));
          float alpha = smoothstep(0.5, 0.0, distanceToCenter);

          vec3 finalColor = color * (1.0 + glowIntensity * alpha);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [fusionState, getParticleColor]);

  return (
    <group>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={initialPositions.current || new Float32Array(particleCount * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <primitive object={particleMaterial} attach="material" />
      </points>

      {/* Point light for fusion states */}
      {fusionState !== 'none' && (
        <pointLight
          color={getParticleColor}
          intensity={fusionState === 'massive' ? 3 : fusionState === 'hydrogen' ? 2 : 1}
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
function InfoOverlay({ mass, objectType, fusionState }) {
  const getStateDescription = () => {
    if (mass < 0.001) return 'Diffuse cloud - no hydrostatic equilibrium';
    if (mass < 0.013) return 'Gravitationally bound - no fusion';
    if (mass < 0.08) return 'Deuterium fusion - brown dwarf';
    if (mass < 8) return 'Hydrogen fusion - main sequence star';
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
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 10,
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#8c7ae6', fontSize: '16px' }}>
        Particle Simulation
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#a1a1a8' }}>Object Type:</span>{' '}
        <span style={{ color: '#f4d03f' }}>{objectType}</span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#a1a1a8' }}>State:</span>{' '}
        <span style={{ color: '#4ade80' }}>{getStateDescription()}</span>
      </div>
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#a1a1a8', lineHeight: '1.5' }}>
        Each particle represents a portion of the object's mass. Watch how gravity causes
        collapse when mass exceeds hydrostatic equilibrium threshold.
      </div>
    </div>
  );
}

/**
 * Main ParticleSimulation component
 */
export default function ParticleSimulation({ mass, radius, objectType }) {
  const fusionState = useMemo(() => {
    if (mass < 0.013) return 'none';
    if (mass < 0.08) return 'deuterium';
    if (mass < 8) return 'hydrogen';
    return 'massive';
  }, [mass]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <InfoOverlay mass={mass} objectType={objectType} fusionState={fusionState} />
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.2} />

        {/* Stars background */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />

        {/* Particle cloud */}
        <ParticleCloud mass={mass} radius={radius} objectType={objectType} />

        {/* Reference grid */}
        <gridHelper args={[30, 30, '#393941', '#252528']} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
