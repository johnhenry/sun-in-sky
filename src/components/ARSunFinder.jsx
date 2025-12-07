import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * AR Sun Finder - Uses device sensors to point a 3D arrow at the sun's position
 *
 * Sensors used:
 * - DeviceOrientationEvent: compass (alpha), pitch (beta), roll (gamma)
 * - DeviceMotionEvent: accelerometer for stabilization
 *
 * @param {number} sunAzimuth - Compass bearing to sun (0-360°, 0=North)
 * @param {number} sunAltitude - Elevation angle of sun (-90 to 90°)
 * @param {function} onClose - Callback when user closes AR mode
 */
export default function ARSunFinder({ sunAzimuth, sunAltitude, onClose }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const arrowRef = useRef(null);
  const glowRef = useRef(null);

  const [isAligned, setIsAligned] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Device orientation state
  const deviceOrientationRef = useRef({
    alpha: 0,  // Compass heading (0-360°)
    beta: 0,   // Front-to-back tilt (-180 to 180°)
    gamma: 0   // Left-to-right tilt (-90 to 90°)
  });

  // Request permissions (required on iOS 13+)
  useEffect(() => {
    const requestPermission = async () => {
      // iOS 13+ requires explicit permission
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            setPermissionGranted(true);
          } else {
            setPermissionDenied(true);
          }
        } catch (error) {
          console.error('Permission request failed:', error);
          setPermissionDenied(true);
        }
      } else {
        // Android and older iOS - no permission needed
        setPermissionGranted(true);
      }
    };

    requestPermission();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !permissionGranted) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create 3D arrow
    const arrowGroup = new THREE.Group();

    // Arrow shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4d03f,
      emissive: 0xf4d03f,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.3
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = -1.5;
    arrowGroup.add(shaft);

    // Arrow head (cone)
    const headGeometry = new THREE.ConeGeometry(0.5, 1.5, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4d03f,
      emissive: 0xf4d03f,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.3
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.75;
    arrowGroup.add(head);

    // Glow effect (larger transparent cone)
    const glowGeometry = new THREE.ConeGeometry(0.8, 2, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.75;
    arrowGroup.add(glow);
    glowRef.current = glow;

    // Position arrow pointing up initially
    arrowGroup.rotation.x = 0;
    scene.add(arrowGroup);
    arrowRef.current = arrowGroup;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Stars background
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [permissionGranted]);

  // Handle device orientation
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event) => {
      deviceOrientationRef.current = {
        alpha: event.alpha || 0,  // Compass (0-360°)
        beta: event.beta || 0,    // Pitch (-180 to 180°)
        gamma: event.gamma || 0   // Roll (-90 to 90°)
      };

      updateArrowOrientation();
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permissionGranted, sunAzimuth, sunAltitude]);

  // Update arrow orientation based on device sensors
  const updateArrowOrientation = () => {
    if (!arrowRef.current || !glowRef.current) return;

    const { alpha, beta, gamma } = deviceOrientationRef.current;

    // Calculate device's pointing direction
    // alpha: compass heading (0° = North, 90° = East, 180° = South, 270° = West)
    // beta: pitch (tilt forward/back)
    // gamma: roll (tilt left/right)

    // Convert to radians
    const deviceHeading = alpha * (Math.PI / 180);
    const devicePitch = beta * (Math.PI / 180);

    // Sun's position in spherical coordinates
    const sunHeading = sunAzimuth * (Math.PI / 180);
    const sunElevation = sunAltitude * (Math.PI / 180);

    // Calculate difference angles
    let headingDiff = sunHeading - deviceHeading;

    // Normalize to -π to π
    while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
    while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;

    const elevationDiff = sunElevation - devicePitch;

    // Rotate arrow to point at sun
    // Y-axis rotation = horizontal (left/right)
    // X-axis rotation = vertical (up/down)
    arrowRef.current.rotation.y = -headingDiff;
    arrowRef.current.rotation.x = elevationDiff;

    // Check if device is pointing at sun (within 10° tolerance)
    const headingError = Math.abs(headingDiff) * (180 / Math.PI);
    const elevationError = Math.abs(elevationDiff) * (180 / Math.PI);
    const totalError = Math.sqrt(headingError * headingError + elevationError * elevationError);

    const aligned = totalError < 10;
    setIsAligned(aligned);

    // Animate glow when aligned
    if (aligned) {
      glowRef.current.material.opacity = 0.4 + 0.2 * Math.sin(Date.now() * 0.005);
      // Make arrow brighter
      arrowRef.current.children[0].material.emissiveIntensity = 0.8;
      arrowRef.current.children[1].material.emissiveIntensity = 1.0;
    } else {
      glowRef.current.material.opacity = 0;
      arrowRef.current.children[0].material.emissiveIntensity = 0.3;
      arrowRef.current.children[1].material.emissiveIntensity = 0.5;
    }
  };

  if (permissionDenied) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        color: '#e9e9ea'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
        <h2 style={{ fontSize: '20px', marginBottom: '10px', textAlign: 'center' }}>
          Motion Sensors Required
        </h2>
        <p style={{ fontSize: '14px', color: '#a1a1a8', textAlign: 'center', maxWidth: '300px', marginBottom: '30px' }}>
          Please allow access to motion and orientation sensors in your browser settings to use AR Sun Finder.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #393941',
            backgroundColor: '#8c7ae6',
            color: '#1a1a1c',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
      zIndex: 10000
    }}>
      {/* Three.js mount point */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Status indicator */}
      {isAligned && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '64px',
          animation: 'pulse 1s infinite',
          pointerEvents: 'none'
        }}>
          ☀️
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}
      >
        ✕
      </button>

      {/* Sun info */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '12px 20px',
        borderRadius: '20px',
        color: '#e9e9ea',
        fontSize: '14px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '12px', color: '#a1a1a8', marginBottom: '4px' }}>
          Sun Position
        </div>
        <div style={{ fontWeight: 600 }}>
          {sunAzimuth.toFixed(0)}° • {sunAltitude.toFixed(0)}° elevation
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
