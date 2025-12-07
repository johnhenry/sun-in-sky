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
  const [debugInfo, setDebugInfo] = useState({ alpha: 0, beta: 0, gamma: 0 });

  // Device orientation state
  const deviceOrientationRef = useRef({
    alpha: 0,  // Compass heading (0-360°)
    beta: 0,   // Front-to-back tilt (-180 to 180°)
    gamma: 0   // Left-to-right tilt (-90 to 90°)
  });

  // Store update function in ref so animation loop can call it
  const updateArrowOrientationRef = useRef(null);

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

    // Camera - will be controlled by device orientation
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0); // Camera at origin
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

    // Position arrow in front of camera - will be camera child so it moves with device
    arrowGroup.position.set(0, 0, -5); // 5 units in front
    arrowGroup.rotation.x = 0;
    arrowRef.current = arrowGroup;

    // Make arrow a child of camera so it's always in view (like HUD)
    camera.add(arrowGroup);
    scene.add(camera); // Add camera to scene so its children render

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
      // Call update function if it exists
      if (updateArrowOrientationRef.current) {
        updateArrowOrientationRef.current();
      }
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

  // Define arrow update function that captures latest props
  useEffect(() => {
    updateArrowOrientationRef.current = () => {
      if (!arrowRef.current || !glowRef.current || !cameraRef.current) return;

      const { alpha, beta, gamma } = deviceOrientationRef.current;

      // STEP 1: Update camera to match device orientation
      // DeviceOrientation: alpha=compass, beta=pitch, gamma=roll
      const alphaRad = (alpha * Math.PI) / 180;
      const betaRad = (beta * Math.PI) / 180;
      const gammaRad = (gamma * Math.PI) / 180;

      // Set camera orientation from device
      const cameraEuler = new THREE.Euler(betaRad, alphaRad, -gammaRad, 'YXZ');
      cameraRef.current.setRotationFromEuler(cameraEuler);

      // STEP 2: Calculate sun direction in WORLD space (fixed position)
      const sunAzimuthRad = (sunAzimuth * Math.PI) / 180;
      const sunAltitudeRad = (sunAltitude * Math.PI) / 180;

      // Sun direction in world coordinates
      const sunX = Math.cos(sunAltitudeRad) * Math.sin(sunAzimuthRad);
      const sunY = Math.sin(sunAltitudeRad);
      const sunZ = -Math.cos(sunAltitudeRad) * Math.cos(sunAzimuthRad);
      const sunDirectionWorld = new THREE.Vector3(sunX, sunY, sunZ);

      // STEP 3: Transform sun direction from world space to camera-local space
      // Arrow is a child of camera, so we need direction in camera's local coordinates
      const cameraQuaternion = new THREE.Quaternion().setFromEuler(cameraEuler);
      const cameraQuaternionInverse = cameraQuaternion.clone().invert();

      const sunDirectionLocal = sunDirectionWorld.clone();
      sunDirectionLocal.applyQuaternion(cameraQuaternionInverse);

      // STEP 4: Point arrow at sun direction (in camera-local space)
      // Arrow points up (+Y) by default, rotate it to point at sun
      const up = new THREE.Vector3(0, 1, 0);
      const arrowQuaternion = new THREE.Quaternion();
      arrowQuaternion.setFromUnitVectors(up, sunDirectionLocal.normalize());
      arrowRef.current.setRotationFromQuaternion(arrowQuaternion);

      // Check if aligned - is camera looking toward sun?
      const cameraForward = new THREE.Vector3(0, 0, -1);
      const angleBetween = cameraForward.angleTo(sunDirectionLocal) * (180 / Math.PI);
      const aligned = angleBetween < 10;
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
  }, [sunAzimuth, sunAltitude]);

  // Handle device orientation
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event) => {
      // IMPORTANT: alpha can be null if device has no magnetometer
      // On iOS, alpha needs motion permissions AND magnetometer
      // On some Android devices, alpha might be null or undefined

      const alpha = event.alpha !== null && event.alpha !== undefined ? event.alpha : 0;
      const beta = event.beta !== null && event.beta !== undefined ? event.beta : 0;
      const gamma = event.gamma !== null && event.gamma !== undefined ? event.gamma : 0;

      deviceOrientationRef.current = { alpha, beta, gamma };
      setDebugInfo({ alpha, beta, gamma }); // Update state for debug display

      // Debug logging (can be removed in production)
      console.log('Device Orientation:', {
        alpha: alpha.toFixed(1) + '°',
        beta: beta.toFixed(1) + '°',
        gamma: gamma.toFixed(1) + '°',
        absolute: event.absolute
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    // Also try with 'deviceorientationabsolute' for better compass data
    const handleOrientationAbsolute = (event) => {
      if (event.alpha !== null) {
        const alpha = event.alpha;
        const beta = event.beta || 0;
        const gamma = event.gamma || 0;
        deviceOrientationRef.current = { alpha, beta, gamma };
        setDebugInfo({ alpha, beta, gamma });
      }
    };

    // Some browsers support absolute orientation (true north vs magnetic north)
    window.addEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientationAbsolute, true);
    };
  }, [permissionGranted]);

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

      {/* Debug info - Device sensors */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 12px',
        borderRadius: '8px',
        color: '#e9e9ea',
        fontSize: '10px',
        fontFamily: 'monospace',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ marginBottom: '4px', color: '#f4d03f', fontWeight: 600 }}>DEVICE SENSORS</div>
        <div>Compass (α): {debugInfo.alpha.toFixed(1)}°</div>
        <div>Pitch (β): {debugInfo.beta.toFixed(1)}°</div>
        <div>Roll (γ): {debugInfo.gamma.toFixed(1)}°</div>
        <div style={{ marginTop: '4px', color: '#4ade80' }}>
          {debugInfo.alpha === 0 && debugInfo.beta === 0 && debugInfo.gamma === 0
            ? '⚠️ No sensor data'
            : '✓ Sensors active'}
        </div>
      </div>

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
        <div style={{ fontSize: '10px', color: '#a1a1a8', marginTop: '4px' }}>
          Target: {sunAzimuth.toFixed(1)}° azimuth, {sunAltitude.toFixed(1)}° altitude
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
