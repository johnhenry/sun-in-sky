import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// Latitude circles helper
function LatitudeCircles({ earthRadius }) {
  const latitudes = [-66.5, -23.5, 0, 23.5, 66.5]; // Arctic, Tropic, Equator

  return (
    <>
      {latitudes.map((lat) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const circleRadius = earthRadius * Math.sin(phi);
        const yPosition = earthRadius * Math.cos(phi);

        return (
          <mesh
            key={lat}
            position={[0, yPosition, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[circleRadius + 0.02, 0.004, 8, 100]} />
            <meshBasicMaterial
              color={lat === 0 ? '#ff9800' : '#4fc3f7'}
              transparent
              opacity={lat === 0 ? 0.5 : 0.25}
            />
          </mesh>
        );
      })}
    </>
  );
}

// Longitude meridians helper
function LongitudeMeridians({ earthRadius }) {
  const meridians = 12; // Every 30 degrees

  return (
    <>
      {Array.from({ length: meridians }).map((_, i) => {
        const angle = (i * 360 / meridians) * (Math.PI / 180);

        return (
          <mesh
            key={i}
            rotation={[0, angle, 0]}
          >
            <torusGeometry args={[earthRadius + 0.02, 0.003, 8, 100]} />
            <meshBasicMaterial color="#81c784" transparent opacity={0.15} />
          </mesh>
        );
      })}
    </>
  );
}

// Earth sphere with day/night shading and observer marker
function Earth({
  latitude,
  longitude,
  axialTilt,
  dayOfYear,
  hourOfDay,
  sunPosition
}) {
  const earthGroupRef = useRef();
  const earthRef = useRef();
  const observerConeRef = useRef();
  const observerGlowRef = useRef();
  const earthRadius = 2;

  // Calculate Earth's rotation based on hour of day
  // Earth rotates 360° in 24 hours, or 15° per hour
  const earthRotation = useMemo(() => {
    return (hourOfDay / 24) * Math.PI * 2;
  }, [hourOfDay]);

  // Calculate observer position on Earth surface (before rotation)
  const observerPosition = useMemo(() => {
    const phi = (90 - latitude) * (Math.PI / 180); // Polar angle
    const theta = longitude * (Math.PI / 180); // Azimuthal angle

    const x = earthRadius * Math.sin(phi) * Math.cos(theta);
    const y = earthRadius * Math.cos(phi);
    const z = earthRadius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }, [latitude, longitude, earthRadius]);

  // Observer normal vector (pointing outward from Earth surface)
  const observerNormal = useMemo(() => {
    return observerPosition.clone().normalize();
  }, [observerPosition]);

  // Apply Earth rotation and update observer marker
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y = -earthRotation;
    }

    // Rotate observer marker with Earth
    if (observerConeRef.current && observerGlowRef.current) {
      const rotatedPosition = observerPosition.clone();
      rotatedPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), -earthRotation);

      observerConeRef.current.position.copy(rotatedPosition);
      observerGlowRef.current.position.copy(rotatedPosition);

      // Make observer marker point outward
      const rotatedNormal = observerNormal.clone();
      rotatedNormal.applyAxisAngle(new THREE.Vector3(0, 1, 0), -earthRotation);
      observerConeRef.current.lookAt(
        observerConeRef.current.position.clone().add(rotatedNormal)
      );
    }
  });

  return (
    <group ref={earthGroupRef} rotation={[0, 0, axialTilt * Math.PI / 180]}>
      {/* Earth sphere with grid */}
      <group ref={earthRef}>
        {/* Main Earth sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[earthRadius, 64, 64]} />
          <meshStandardMaterial
            color="#0d47a1"
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>

        {/* Landmasses (simplified) */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[earthRadius + 0.01, 64, 64]} />
          <meshStandardMaterial
            color="#1b5e20"
            roughness={0.9}
            metalness={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Latitude circles */}
        <LatitudeCircles earthRadius={earthRadius} />

        {/* Longitude meridians */}
        <LongitudeMeridians earthRadius={earthRadius} />
      </group>

      {/* Observer marker (purple cone pointing outward) */}
      <mesh ref={observerConeRef} position={observerPosition}>
        <coneGeometry args={[0.12, 0.35, 8]} />
        <meshStandardMaterial
          color="#9c27b0"
          emissive="#9c27b0"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Observer glow effect */}
      <mesh ref={observerGlowRef} position={observerPosition}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#e1bee7" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Sun visualization (directional light + visual sun sphere)
function Sun({ position, intensity = 2.0 }) {
  return (
    <>
      {/* Directional light from sun */}
      <directionalLight
        position={position}
        intensity={intensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Visual sun sphere */}
      <mesh position={position}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Sun glow layers */}
      <mesh position={position}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.4} />
      </mesh>

      <mesh position={position}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// Sun direction indicator (arrow from Earth to Sun)
function SunRay({ sunPosition }) {
  const direction = useMemo(() => {
    return new THREE.Vector3(...sunPosition).normalize();
  }, [sunPosition]);

  const arrowLength = 3;
  const arrowPos = useMemo(() => {
    return direction.clone().multiplyScalar(arrowLength);
  }, [direction, arrowLength]);

  return (
    <group>
      {/* Line from Earth center to sun direction */}
      <mesh position={[arrowPos.x / 2, arrowPos.y / 2, arrowPos.z / 2]}>
        <cylinderGeometry args={[0.015, 0.015, arrowLength, 8]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.4} />
        <meshBasicMaterial attach="material" color="#FFD700" transparent opacity={0.4} />
        {/* Rotate to point toward sun */}
      </mesh>
    </group>
  );
}

// Orbital path ring
function OrbitalPath({ radius = 15 }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.02, 8, 100]} />
      <meshBasicMaterial color="#616161" transparent opacity={0.2} />
    </mesh>
  );
}

// Main 3D scene
function Scene({
  latitude,
  longitude,
  axialTilt,
  dayOfYear,
  hourOfDay,
  currentAzimuth,
  currentAltitude
}) {
  // Calculate sun position in 3D space
  // This matches the calculation in App.jsx for consistency
  const sunPosition = useMemo(() => {
    const sunDistance = 50;

    // Solar declination (angle of sun above/below equator)
    // This formula matches the one in App.jsx
    const declination = axialTilt * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    const declinationRad = (declination * Math.PI) / 180;

    // Hour angle (0° at solar noon, 15° per hour)
    const hourAngle = (hourOfDay - 12) * 15;
    const hourAngleRad = (hourAngle * Math.PI) / 180;

    // Convert to Cartesian coordinates
    // The sun's position relative to Earth's equatorial plane
    // Using standard celestial coordinate conversion
    const x = sunDistance * Math.cos(declinationRad) * Math.sin(hourAngleRad);
    const y = sunDistance * Math.sin(declinationRad);
    const z = sunDistance * Math.cos(declinationRad) * Math.cos(hourAngleRad);

    return [x, y, z];
  }, [axialTilt, dayOfYear, hourOfDay]);

  return (
    <>
      {/* Ambient light for visibility of dark side */}
      <ambientLight intensity={0.2} />

      {/* Soft fill light to see details */}
      <hemisphereLight intensity={0.15} groundColor="#000033" color="#4444ff" />

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

      {/* Earth with observer marker */}
      <Earth
        latitude={latitude}
        longitude={longitude}
        axialTilt={axialTilt}
        dayOfYear={dayOfYear}
        hourOfDay={hourOfDay}
        sunPosition={sunPosition}
      />

      {/* Sun */}
      <Sun position={sunPosition} intensity={2.2} />

      {/* Orbital path (shows Earth's orbital plane) */}
      <OrbitalPath radius={50} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={25}
        autoRotate={false}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  );
}

// Main component
function EarthVisualization({
  latitude = 45,
  longitude = 0,
  axialTilt = 23.45,
  dayOfYear = 172,
  hourOfDay = 12,
  currentAzimuth = 0,
  currentAltitude = 0
}) {
  return (
    <Canvas
      camera={{ position: [5, 3, 5], fov: 50 }}
      style={{ background: '#0a0a0a' }}
      shadows
    >
      <Scene
        latitude={latitude}
        longitude={longitude}
        axialTilt={axialTilt}
        dayOfYear={dayOfYear}
        hourOfDay={hourOfDay}
        currentAzimuth={currentAzimuth}
        currentAltitude={currentAltitude}
      />
    </Canvas>
  );
}

export default EarthVisualization;
