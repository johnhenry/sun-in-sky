# Implementation Plan: Priority Enhancements

This document outlines a comprehensive implementation plan for priority features requested for the Sun in Sky application.

## Requested Features

1. **#2 - Visual Enhancements**
2. **#3 - Mobile Experience**
3. **#7 - Performance & Polish**
4. **#8 - Data & Sharing**
5. **#9 - Accessibility**
6. **#10 - Advanced Visualizations**

---

## Implementation Strategy

### Phase 1: Foundation & Quick Wins (Week 1-2)
Focus on features that provide immediate value with minimal risk.

### Phase 2: Core Functionality (Week 3-4)
Implement major features requiring state management changes.

### Phase 3: Polish & Advanced Features (Week 5-6)
Add sophisticated visualizations and final touches.

### Phase 4: Testing & Documentation (Week 7-8)
Comprehensive testing, bug fixes, and documentation updates.

---

# Phase 1: Foundation & Quick Wins

## 1.1 Visual Enhancements - Sun Disk (#2)

**Goal**: Add visual sun icon that moves along altitude curve

**Implementation**:
```javascript
// In App.jsx, add to SVG graph
<circle
  cx={currentX}  // X position on graph at current time
  cy={currentY}  // Y position based on current altitude
  r={8}
  fill="url(#sunGradient)"
  filter="url(#sunGlow)"
/>

// Add gradient definition
<defs>
  <radialGradient id="sunGradient">
    <stop offset="0%" stopColor="#FDB813" />
    <stop offset="100%" stopColor="#f4d03f" />
  </radialGradient>
  <filter id="sunGlow">
    <feGaussianBlur stdDeviation="2" />
  </filter>
</defs>
```

**Files to modify**:
- `src/App.jsx` (add sun disk component to SVG)

**Testing**:
- Verify sun moves correctly in day view
- Verify sun moves correctly in year view
- Check positioning at horizon crossings

**Time estimate**: 2 hours

---

## 1.2 Performance - Loading States (#7)

**Goal**: Show loading indicator while 3D Earth initializes

**Implementation**:
```javascript
// In App.jsx
const [earthLoading, setEarthLoading] = useState(true);

// In EarthVisualization.jsx
useEffect(() => {
  // After scene setup
  onLoadComplete();
}, []);

// Loading overlay
{earthLoading && (
  <div className="earth-loading-overlay">
    <div className="spinner"></div>
    <p>Loading 3D Earth...</p>
  </div>
)}
```

**Files to create/modify**:
- `src/App.jsx` (add loading state)
- `src/EarthVisualization.jsx` (emit load complete event)
- `src/App.css` (spinner styles)

**Testing**:
- Test on slow connections (throttle network)
- Verify spinner appears/disappears correctly
- Check mobile performance

**Time estimate**: 3 hours

---

## 1.3 Accessibility - ARIA Labels (#9a)

**Goal**: Add ARIA labels to all interactive elements

**Implementation**:
```javascript
// Example: Time slider
<input
  type="range"
  value={minuteOfYear}
  onChange={...}
  aria-label={`Time of year: ${formatDate(dayOfYear)}, ${formatTime(hourOfDay)}`}
  aria-valuemin={0}
  aria-valuemax={525599}
  aria-valuenow={minuteOfYear}
  aria-valuetext={`Day ${dayOfYear}, ${formatTime(hourOfDay)}`}
/>

// Example: Play button
<button
  onClick={togglePlay}
  aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
  aria-pressed={isPlaying}
>
  {isPlaying ? '⏸' : '▶'}
</button>
```

**Files to modify**:
- `src/App.jsx` (all controls)
- `src/components/panels/LearnPanel/LearnPanel.jsx`
- `src/components/panels/ChallengePanel/ChallengePanel.jsx`

**Testing**:
- Test with screen reader (NVDA, JAWS, or VoiceOver)
- Verify all controls are announced
- Check value changes are announced

**Time estimate**: 4 hours

---

## 1.4 Data & Sharing - URL State (#8a)

**Goal**: Encode app state in URL for sharing

**Implementation**:
```javascript
// URL parameter mapping
const stateToURL = (state) => {
  const params = new URLSearchParams({
    lat: state.latitude,
    time: state.minuteOfYear,
    tilt: state.axialTilt,
    view: state.viewMode,
    yAxis: state.yAxisMode,
    earth: state.showEarthViz ? '1' : '0'
  });
  return `?${params.toString()}`;
};

// Load from URL on mount
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('lat')) setLatitude(parseFloat(params.get('lat')));
  if (params.has('time')) setMinuteOfYear(parseInt(params.get('time')));
  if (params.has('tilt')) setAxialTilt(parseFloat(params.get('tilt')));
  // ... etc
}, []);

// Update URL on state change (debounced)
useEffect(() => {
  const timer = setTimeout(() => {
    const url = stateToURL({ latitude, minuteOfYear, axialTilt, viewMode, yAxisMode, showEarthViz });
    window.history.replaceState(null, '', url);
  }, 500);
  return () => clearTimeout(timer);
}, [latitude, minuteOfYear, axialTilt, viewMode, yAxisMode, showEarthViz]);

// Add "Share" button
<button onClick={() => {
  const url = window.location.href;
  navigator.clipboard.writeText(url);
  // Show toast: "Link copied!"
}}>
  📋 Share
</button>
```

**Files to modify**:
- `src/App.jsx` (URL state management)
- `src/components/Toast.jsx` (NEW - toast notification)

**Testing**:
- Verify URL updates when changing parameters
- Test sharing link (open in new tab/incognito)
- Check edge cases (missing params, invalid values)
- Test on mobile (share button)

**Time estimate**: 5 hours

---

# Phase 2: Core Functionality

## 2.1 Visual Enhancements - Twilight Zones (#2)

**Goal**: Show civil, nautical, and astronomical twilight regions

**Implementation**:
```javascript
// Calculate twilight times
const getTwilightZones = (latitude, declination) => {
  // Civil twilight: sun altitude -6° to 0°
  // Nautical twilight: sun altitude -12° to -6°
  // Astronomical twilight: sun altitude -18° to -12°

  const zones = [];

  // For each hour, check sun altitude
  for (let h = 0; h < 24; h += 0.1) {
    const alt = getAltitude(h, declination);

    if (alt < 0 && alt >= -6) {
      zones.push({ hour: h, type: 'civil', altitude: alt });
    } else if (alt < -6 && alt >= -12) {
      zones.push({ hour: h, type: 'nautical', altitude: alt });
    } else if (alt < -12 && alt >= -18) {
      zones.push({ hour: h, type: 'astronomical', altitude: alt });
    }
  }

  return zones;
};

// Render twilight zones in SVG
<g className="twilight-zones">
  {/* Civil twilight (light blue) */}
  <path
    d={civilTwilightPath}
    fill="rgba(135, 206, 250, 0.2)"
    stroke="rgba(135, 206, 250, 0.5)"
    strokeWidth={1}
  />
  {/* Nautical twilight (medium blue) */}
  <path
    d={nauticalTwilightPath}
    fill="rgba(70, 130, 180, 0.2)"
    stroke="rgba(70, 130, 180, 0.5)"
    strokeWidth={1}
  />
  {/* Astronomical twilight (dark blue) */}
  <path
    d={astronomicalTwilightPath}
    fill="rgba(25, 25, 112, 0.2)"
    stroke="rgba(25, 25, 112, 0.5)"
    strokeWidth={1}
  />
</g>

// Add legend
<div className="twilight-legend">
  <div><span style={{background: 'rgba(135,206,250,0.5)'}}>■</span> Civil Twilight (-6° to 0°)</div>
  <div><span style={{background: 'rgba(70,130,180,0.5)'}}>■</span> Nautical Twilight (-12° to -6°)</div>
  <div><span style={{background: 'rgba(25,25,112,0.5)'}}>■</span> Astronomical Twilight (-18° to -12°)</div>
</div>
```

**Files to modify**:
- `src/App.jsx` (twilight calculation and rendering)
- `src/App.css` (twilight legend styles)

**Testing**:
- Verify twilight zones appear only in day view
- Check accuracy at different latitudes
- Test at equator (symmetric twilight)
- Test near poles (long twilight periods)

**Time estimate**: 6 hours

---

## 2.2 Performance - Keyboard Shortcuts (#7)

**Goal**: Add keyboard controls for common actions

**Implementation**:
```javascript
// In App.jsx
useEffect(() => {
  const handleKeyPress = (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch(e.key) {
      case ' ':  // Space: play/pause
        e.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'ArrowLeft':  // Left: -1 hour (day) or -1 day (year)
        e.preventDefault();
        const decrement = viewMode === 'day' ? 60 : 24 * 60;
        setMinuteOfYear(prev => Math.max(0, prev - decrement));
        break;
      case 'ArrowRight':  // Right: +1 hour (day) or +1 day (year)
        e.preventDefault();
        const increment = viewMode === 'day' ? 60 : 24 * 60;
        setMinuteOfYear(prev => Math.min(525599, prev + increment));
        break;
      case 'ArrowUp':  // Up: +5° latitude
        e.preventDefault();
        setLatitude(prev => Math.min(90, prev + 5));
        break;
      case 'ArrowDown':  // Down: -5° latitude
        e.preventDefault();
        setLatitude(prev => Math.max(-90, prev - 5));
        break;
      case 'd':  // D: toggle day/year view
        setViewMode(prev => prev === 'day' ? 'year' : 'day');
        break;
      case 'y':  // Y: toggle y-axis mode
        setYAxisMode(prev => {
          if (prev === 'dynamic') return 'fixed';
          if (prev === 'fixed') return 'wide';
          return 'dynamic';
        });
        break;
      case '3':  // 3: toggle 3D Earth
        setShowEarthViz(prev => !prev);
        break;
      case '?':  // ?: show keyboard shortcuts help
        setShowKeyboardHelp(true);
        break;
      case 'Escape':  // Esc: close modals
        setShowKeyboardHelp(false);
        setLearnPanelOpen(false);
        setChallengePanelOpen(false);
        break;
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [viewMode]);

// Keyboard shortcuts help modal
{showKeyboardHelp && (
  <div className="keyboard-help-modal">
    <h2>Keyboard Shortcuts</h2>
    <table>
      <tr><td>Space</td><td>Play/Pause</td></tr>
      <tr><td>←/→</td><td>Previous/Next hour or day</td></tr>
      <tr><td>↑/↓</td><td>Increase/Decrease latitude</td></tr>
      <tr><td>D</td><td>Toggle day/year view</td></tr>
      <tr><td>Y</td><td>Cycle y-axis mode</td></tr>
      <tr><td>3</td><td>Toggle 3D Earth</td></tr>
      <tr><td>?</td><td>Show this help</td></tr>
      <tr><td>Esc</td><td>Close panels</td></tr>
    </table>
  </div>
)}
```

**Files to modify**:
- `src/App.jsx` (keyboard event handlers)
- `src/App.css` (keyboard help modal)

**Testing**:
- Test all shortcuts
- Verify shortcuts don't interfere with typing
- Test on Mac (Cmd) and PC (Ctrl)
- Check focus management

**Time estimate**: 4 hours

---

## 2.3 Accessibility - Keyboard Navigation (#9b)

**Goal**: Full keyboard control without mouse

**Implementation**:
```javascript
// Ensure all interactive elements are focusable
<button
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click me
</button>

// Add focus styles
.button:focus,
.slider:focus,
.preset-button:focus {
  outline: 2px solid #f4d03f;
  outline-offset: 2px;
}

// Skip to main content link
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// Focus management for modals
useEffect(() => {
  if (learnPanelOpen) {
    // Save current focus
    const previousFocus = document.activeElement;

    // Focus first element in panel
    const firstElement = panelRef.current?.querySelector('button, input, a');
    firstElement?.focus();

    // Restore focus on close
    return () => previousFocus?.focus();
  }
}, [learnPanelOpen]);

// Tab trap in modals
const handleTabKey = (e) => {
  const focusableElements = modalRef.current?.querySelectorAll(
    'button, input, a, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
};
```

**Files to modify**:
- `src/App.jsx` (focus management)
- `src/App.css` (focus styles)
- `src/components/panels/shared/Panel.jsx` (tab trap)

**Testing**:
- Navigate entire app with Tab key only
- Verify focus indicators are visible
- Test modal focus trapping
- Check focus restoration

**Time estimate**: 5 hours

---

## 2.4 Data & Sharing - Screenshot Export (#8b)

**Goal**: Export current visualization as PNG

**Implementation**:
```javascript
// Using html2canvas library
import html2canvas from 'html2canvas';

const exportScreenshot = async () => {
  const element = svgRef.current;

  // Create canvas from SVG
  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a1c',
    scale: 2  // High DPI
  });

  // Convert to blob
  canvas.toBlob((blob) => {
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sun-in-sky-${dayOfYear}-${latitude}.png`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Show success toast
  showToast('Screenshot saved!');
};

// Add metadata to image
const addMetadata = (canvas, state) => {
  const ctx = canvas.getContext('2d');

  // Add watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '12px monospace';
  ctx.fillText(
    `Lat: ${state.latitude}° | Day: ${state.dayOfYear} | Tilt: ${state.axialTilt}° | sun-in-sky.app`,
    10,
    canvas.height - 10
  );
};

// Screenshot button
<button onClick={exportScreenshot} aria-label="Export screenshot">
  📸 Screenshot
</button>
```

**Dependencies to add**:
```bash
npm install html2canvas
```

**Files to create/modify**:
- `src/App.jsx` (screenshot function)
- `package.json` (add html2canvas)

**Testing**:
- Test on different view modes
- Verify high resolution (2x scale)
- Check metadata is included
- Test on mobile

**Time estimate**: 4 hours

---

## 2.5 Accessibility - Motion Reduction (#9c)

**Goal**: Respect prefers-reduced-motion setting

**Implementation**:
```javascript
// Detect motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply to animations
const animationDuration = prefersReducedMotion ? 0 : 300;

// CSS approach
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Disable auto-play if motion is reduced
useEffect(() => {
  if (prefersReducedMotion && isPlaying) {
    setIsPlaying(false);
    showToast('Animation paused (motion reduction enabled)');
  }
}, []);

// Provide option to override
<label>
  <input
    type="checkbox"
    checked={!animationsEnabled}
    onChange={() => setAnimationsEnabled(prev => !prev)}
  />
  Reduce motion
</label>
```

**Files to modify**:
- `src/App.jsx` (motion detection)
- `src/App.css` (media query)
- `src/EarthVisualization.jsx` (disable rotation animation)

**Testing**:
- Enable "Reduce motion" in OS settings
- Verify animations are disabled
- Check override option works
- Test on different browsers

**Time estimate**: 3 hours

---

# Phase 3: Advanced Features

## 3.1 Mobile Experience - Touch Gestures (#3)

**Goal**: Add touch interactions for 2D graph

**Implementation**:
```javascript
// Touch gesture handling
const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 });
const [pinchDistance, setPinchDistance] = useState(0);

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    });
  } else if (e.touches.length === 2) {
    // Pinch gesture
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    setPinchDistance(dist);
  }
};

const handleTouchMove = (e) => {
  if (e.touches.length === 1) {
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;

    // Swipe left/right to change time
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const direction = deltaX > 0 ? -1 : 1;
      const increment = viewMode === 'day' ? 60 : 24 * 60;
      setMinuteOfYear(prev => Math.max(0, Math.min(525599, prev + direction * increment)));
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
    }
  } else if (e.touches.length === 2) {
    // Pinch to zoom y-axis
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );

    const scale = dist / pinchDistance;
    // Adjust y-axis range based on pinch
    // (Implementation depends on dynamic y-axis calculation)
    setPinchDistance(dist);
  }
};

const handleTouchEnd = (e) => {
  const duration = Date.now() - touchStart.time;

  // Long press for tooltip
  if (duration > 500) {
    // Show tooltip at touch position
    const touch = e.changedTouches[0];
    showTooltipAtPosition(touch.clientX, touch.clientY);
  }
};

// Apply to SVG
<svg
  ref={svgRef}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* ... */}
</svg>
```

**Files to modify**:
- `src/App.jsx` (touch handlers)

**Testing**:
- Test swipe left/right on mobile
- Test pinch zoom (if implemented)
- Test long press tooltip
- Check on iOS and Android

**Time estimate**: 6 hours

---

## 3.2 Mobile Experience - Haptic Feedback (#3)

**Goal**: Vibrate on key events

**Implementation**:
```javascript
// Haptic utility
const haptic = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }
};

// Use in event handlers
const handleHorizonCrossing = () => {
  haptic.medium();
  // ... rest of logic
};

const handleQuizCorrect = () => {
  haptic.success();
  // ... rest of logic
};

// Settings toggle
<label>
  <input
    type="checkbox"
    checked={hapticsEnabled}
    onChange={() => setHapticsEnabled(prev => !prev)}
  />
  Enable haptic feedback
</label>

// Check if crossing horizon
useEffect(() => {
  const prevAltitude = prevAltitudeRef.current;

  if (hapticsEnabled && prevAltitude !== null) {
    if ((prevAltitude < 0 && currentAltitude >= 0) || (prevAltitude >= 0 && currentAltitude < 0)) {
      haptic.medium();  // Crossing horizon
    }
  }

  prevAltitudeRef.current = currentAltitude;
}, [currentAltitude, hapticsEnabled]);
```

**Files to modify**:
- `src/App.jsx` (haptic utility and usage)
- `src/components/panels/ChallengePanel/ChallengePanel.jsx` (quiz haptics)

**Testing**:
- Test on physical mobile device
- Verify different vibration patterns
- Check settings toggle
- Test battery impact

**Time estimate**: 3 hours

---

## 3.3 Advanced Visualizations - Sky Dome (#10)

**Goal**: Create 180° hemisphere showing sun's path

**Implementation**:
```javascript
// New component: SkyDome.jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';

const SkyDome = ({ latitude, declination, hourOfDay, axialTilt }) => {
  // Calculate sun path for entire day
  const sunPath = useMemo(() => {
    const points = [];
    for (let h = 0; h < 24; h += 0.25) {
      const altitude = getAltitude(h, declination);
      const azimuth = getAzimuth(h, declination, altitude);

      if (altitude >= 0) {  // Only visible part
        // Convert to 3D coordinates (hemisphere)
        const altRad = (altitude * Math.PI) / 180;
        const azRad = (azimuth * Math.PI) / 180;

        const radius = 10;  // Hemisphere radius
        const x = radius * Math.cos(altRad) * Math.sin(azRad);
        const y = radius * Math.sin(altRad);
        const z = radius * Math.cos(altRad) * Math.cos(azRad);

        points.push([x, y, z]);
      }
    }
    return points;
  }, [latitude, declination]);

  return (
    <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
      {/* Sky dome */}
      <Sphere args={[10, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]}>
        <meshBasicMaterial color="#87CEEB" opacity={0.3} transparent side={DoubleSide} />
      </Sphere>

      {/* Horizon plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#228B22" opacity={0.5} transparent />
      </mesh>

      {/* Sun path */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={sunPath.length}
            array={new Float32Array(sunPath.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FDB813" linewidth={2} />
      </line>

      {/* Current sun position */}
      <mesh position={currentSunPosition}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {/* Compass markers */}
      <CompassMarkers />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
      />
    </Canvas>
  );
};
```

**Files to create**:
- `src/components/SkyDome.jsx`
- `src/components/SkyDome.css`

**Files to modify**:
- `src/App.jsx` (add sky dome toggle)

**Testing**:
- Verify sun path is accurate
- Test at different latitudes
- Check performance
- Verify horizon is level

**Time estimate**: 8 hours

---

## 3.4 Advanced Visualizations - Horizon Panorama (#10)

**Goal**: 360° compass view with sun position on horizon

**Implementation**:
```javascript
// New component: HorizonPanorama.jsx
const HorizonPanorama = ({ azimuth, altitude, declination }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1c';
    ctx.fillRect(0, 0, width, height);

    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#000033');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height / 2);

    // Draw ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, height / 2, width, height / 2);

    // Draw horizon line
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw compass markers (N, E, S, W)
    const directions = [
      { angle: 0, label: 'N' },
      { angle: 90, label: 'E' },
      { angle: 180, label: 'S' },
      { angle: 270, label: 'W' }
    ];

    ctx.fillStyle = '#e9e9ea';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';

    directions.forEach(({ angle, label }) => {
      const x = (angle / 360) * width;

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(x, height / 2 - 10);
      ctx.lineTo(x, height / 2 + 10);
      ctx.stroke();

      // Label
      ctx.fillText(label, x, height / 2 + 30);
    });

    // Draw degree markers every 30°
    ctx.font = '10px monospace';
    for (let deg = 0; deg < 360; deg += 30) {
      const x = (deg / 360) * width;
      ctx.fillText(`${deg}°`, x, height / 2 - 20);
    }

    // Draw sun position
    if (altitude >= 0) {
      const sunX = (azimuth / 360) * width;
      const sunY = height / 2 - (altitude / 90) * (height / 2);

      // Sun glow
      const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30);
      gradient.addColorStop(0, 'rgba(253, 184, 19, 0.8)');
      gradient.addColorStop(1, 'rgba(253, 184, 19, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(sunX - 30, sunY - 30, 60, 60);

      // Sun disk
      ctx.fillStyle = '#FDB813';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Sun info
      ctx.fillStyle = '#e9e9ea';
      ctx.font = '12px monospace';
      ctx.fillText(`${azimuth.toFixed(0)}° • ${altitude.toFixed(0)}° elevation`, sunX, sunY + 40);
    }
  }, [azimuth, altitude, declination]);

  return (
    <div className="horizon-panorama">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};
```

**Files to create**:
- `src/components/HorizonPanorama.jsx`
- `src/components/HorizonPanorama.css`

**Files to modify**:
- `src/App.jsx` (add horizon panorama toggle)

**Testing**:
- Verify azimuth accuracy
- Test at sunrise/sunset
- Check at different times of day
- Verify responsive behavior

**Time estimate**: 6 hours

---

## 3.5 Mobile Experience - AR Mode Improvements (#3)

**Goal**: Debug and improve AR Sun Finder

**Current Issues**:
- Lateral movement not working
- Sensor accuracy varies by device

**Debugging Strategy**:
1. Add comprehensive sensor logging
2. Test on multiple devices
3. Compare calculated vs actual sun position
4. Verify coordinate transformations

**Implementation**:
```javascript
// Enhanced sensor debugging
const [sensorLog, setSensorLog] = useState([]);

const logSensorData = (data) => {
  setSensorLog(prev => [
    ...prev.slice(-100),  // Keep last 100 entries
    {
      timestamp: Date.now(),
      ...data
    }
  ]);
};

// More robust orientation handling
const handleOrientation = (event) => {
  const { alpha, beta, gamma } = event;

  logSensorData({
    alpha: alpha?.toFixed(2),
    beta: beta?.toFixed(2),
    gamma: gamma?.toFixed(2),
    absolute: event.absolute
  });

  // Validate sensor data
  if (alpha === null || beta === null || gamma === null) {
    console.warn('Incomplete sensor data');
    return;
  }

  // Update orientation with validation
  deviceOrientationRef.current = { alpha, beta, gamma };
};

// Export sensor log for analysis
const exportSensorLog = () => {
  const csv = sensorLog.map(entry =>
    `${entry.timestamp},${entry.alpha},${entry.beta},${entry.gamma},${entry.absolute}`
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sensor-log.csv';
  link.click();
};

// Add calibration mode
const [calibrationMode, setCalibrationMode] = useState(false);

// Visual compass overlay for debugging
{calibrationMode && (
  <div className="calibration-overlay">
    <div>Alpha (compass): {alpha}°</div>
    <div>Beta (pitch): {beta}°</div>
    <div>Gamma (roll): {gamma}°</div>
    <div>Calculated sun azimuth: {sunAzimuth}°</div>
    <div>Calculated sun altitude: {sunAltitude}°</div>
  </div>
)}
```

**Alternative Approach**:
If AR mode continues to be problematic, replace with simpler camera overlay:

```javascript
// Simplified camera overlay (no 3D)
const CameraSunPointer = ({ sunAzimuth, sunAltitude }) => {
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0 });

  // Calculate offset from device pointing direction to sun
  const offsetAzimuth = sunAzimuth - deviceOrientation.alpha;
  const offsetAltitude = sunAltitude - (90 - deviceOrientation.beta);

  return (
    <div className="camera-overlay">
      <video ref={videoRef} autoPlay playsInline />

      {/* Simple arrow pointing to sun */}
      <div
        className="sun-pointer"
        style={{
          transform: `translate(calc(50% + ${offsetAzimuth * 5}px), calc(50% - ${offsetAltitude * 5}px))`
        }}
      >
        ☀️
      </div>

      <div className="sun-info">
        Sun is {Math.abs(offsetAzimuth).toFixed(0)}° to the {offsetAzimuth > 0 ? 'right' : 'left'}
        and {Math.abs(offsetAltitude).toFixed(0)}° {offsetAltitude > 0 ? 'above' : 'below'}
      </div>
    </div>
  );
};
```

**Files to modify**:
- `src/components/ARSunFinder.jsx` (debugging and improvements)

**Testing**:
- Test on 5+ different mobile devices
- Compare with actual sun position
- Test indoors vs outdoors
- Check compass calibration

**Time estimate**: 10 hours (debugging is time-consuming)

---

# Phase 4: Testing & Documentation

## 4.1 Comprehensive Testing

**Unit Tests**:
```javascript
// Using Vitest (Vite's test framework)
npm install -D vitest @testing-library/react @testing-library/jest-dom

// tests/astronomical.test.js
import { describe, it, expect } from 'vitest';
import { getAltitude, getAzimuth, getDeclination } from '../src/utils/astronomical';

describe('Astronomical calculations', () => {
  it('calculates correct altitude at solar noon on equinox', () => {
    const altitude = getAltitude(12, 0);  // noon, declination 0
    expect(altitude).toBeCloseTo(45, 1);  // at 45° latitude
  });

  it('calculates declination correctly', () => {
    const declination = getDeclination(172, 23.45);  // June solstice
    expect(declination).toBeCloseTo(23.45, 1);
  });
});
```

**Integration Tests**:
```javascript
// tests/App.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';

describe('App integration', () => {
  it('updates graph when latitude changes', async () => {
    const { container } = render(<App />);
    const slider = screen.getByLabelText(/latitude/i);

    await userEvent.type(slider, '60');

    // Verify graph updated
    const altitudeValue = screen.getByText(/altitude/i);
    expect(altitudeValue).toBeInTheDocument();
  });
});
```

**Accessibility Tests**:
```javascript
// tests/accessibility.test.jsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('has no WCAG violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Time estimate**: 12 hours

---

## 4.2 Documentation Updates

**Update CLAUDE.md**:
- Add new features to feature list
- Document keyboard shortcuts
- Add accessibility section
- Update component architecture
- Add troubleshooting for new features

**Update README.md**:
- Add screenshots of new features
- Update feature list
- Add keyboard shortcuts reference
- Update browser compatibility

**Create USER_GUIDE.md**:
- Getting started
- Feature walkthroughs
- Tips and tricks
- Troubleshooting
- FAQ

**Time estimate**: 6 hours

---

## 4.3 Performance Optimization

**Bundle Analysis**:
```bash
npm install -D rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true })
]

npm run build
# Opens bundle visualization
```

**Code Splitting**:
```javascript
// Lazy load heavy components
const SkyDome = lazy(() => import('./components/SkyDome'));
const HorizonPanorama = lazy(() => import('./components/HorizonPanorama'));

// With suspense
<Suspense fallback={<LoadingSpinner />}>
  {showSkyDome && <SkyDome {...props} />}
</Suspense>
```

**Image Optimization**:
- Compress screenshots
- Use WebP format with fallbacks
- Lazy load images

**Time estimate**: 4 hours

---

# Summary & Timeline

## Total Time Estimate: ~90 hours (11-12 weeks at 8 hours/week)

### Phase 1: Foundation (Week 1-2)
- [x] Sun disk visual (2h)
- [x] Loading states (3h)
- [x] ARIA labels (4h)
- [x] URL state (5h)
**Total: 14 hours**

### Phase 2: Core Functionality (Week 3-6)
- [x] Twilight zones (6h)
- [x] Keyboard shortcuts (4h)
- [x] Keyboard navigation (5h)
- [x] Screenshot export (4h)
- [x] Motion reduction (3h)
**Total: 22 hours**

### Phase 3: Advanced Features (Week 7-10)
- [x] Touch gestures (6h)
- [x] Haptic feedback (3h)
- [x] Sky dome (8h)
- [x] Horizon panorama (6h)
- [x] AR improvements (10h)
**Total: 33 hours**

### Phase 4: Testing & Documentation (Week 11-12)
- [x] Comprehensive testing (12h)
- [x] Documentation updates (6h)
- [x] Performance optimization (4h)
**Total: 22 hours**

---

# Dependencies to Add

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-axe": "^8.0.0",
    "rollup-plugin-visualizer": "^5.12.0"
  }
}
```

---

# Risk Mitigation

## High Risk Items:
1. **AR Mode debugging** - May need to replace with simpler approach
2. **3D performance on mobile** - May need quality settings
3. **Touch gestures** - Complex interaction patterns

## Mitigation Strategies:
1. Build MVP first, iterate based on device testing
2. Add performance monitoring and quality toggles
3. Start simple (swipe), add complexity gradually

---

# Success Metrics

## User Experience:
- [ ] All features keyboard accessible
- [ ] 90+ Lighthouse accessibility score
- [ ] <3s load time on mobile
- [ ] 60fps animation on desktop

## Code Quality:
- [ ] 80%+ test coverage
- [ ] Zero WCAG AAA violations
- [ ] <500KB bundle size
- [ ] All console errors resolved

## Educational Impact:
- [ ] Share feature used >10% of sessions
- [ ] Keyboard shortcuts adopted by power users
- [ ] Mobile usage increases with touch gestures
- [ ] Positive feedback on accessibility

---

Last Updated: December 2025
