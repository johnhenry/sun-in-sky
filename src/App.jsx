import { useState, useMemo, useRef, useEffect } from 'react';
import EarthVisualization from './EarthVisualization.jsx';

const SunPositionViz = () => {
  const [latitude, setLatitude] = useState(45);
  const [minuteOfYear, setMinuteOfYear] = useState(171 * 24 * 60 + 12 * 60);
  const [axialTilt, setAxialTilt] = useState(23.45);
  const [viewMode, setViewMode] = useState('day');
  const [yAxisMode, setYAxisMode] = useState('dynamic');
  const [containerWidth, setContainerWidth] = useState(800);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({ x: 0, y: 0, altitude: 0, hour: 0, day: 0 });

  const containerRef = useRef(null);
  const playRef = useRef(null);
  const svgRef = useRef(null);
  const compassRotationRef = useRef(0); // Track cumulative rotation for smooth compass animation
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  useEffect(() => {
    if (isPlaying) {
      const step = viewMode === 'day' ? 15 : 120;
      playRef.current = setInterval(() => {
        setMinuteOfYear(m => (m + step) % (365 * 24 * 60));
      }, 50);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, viewMode]);
  
  const width = containerWidth;
  const height = 280;
  const padding = { top: 25, right: 15, bottom: 45, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;
  
  const totalMinutesInYear = 365 * 24 * 60;
  
  const dayOfYear = Math.floor(minuteOfYear / (24 * 60)) + 1;
  const hourOfDay = (minuteOfYear % (24 * 60)) / 60;
  
  // Key astronomical values derived from tilt
  const tropicLat = axialTilt;
  const arcticLat = 90 - axialTilt;
  
  const getDeclination = (day) => axialTilt * Math.sin((2 * Math.PI / 365) * (day - 81));
  const declination = getDeclination(dayOfYear);
  
  const getDateTimeLabel = () => {
    const date = new Date(2024, 0, 1);
    date.setDate(dayOfYear);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const hours = Math.floor(hourOfDay);
    const mins = Math.round((hourOfDay % 1) * 60);
    return `${dateStr}, ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const getAltitude = (hour, decl) => {
    const decRad = (decl * Math.PI) / 180;
    const latRad = (latitude * Math.PI) / 180;
    const hourAngle = ((hour - 12) * 15 * Math.PI) / 180;
    const sinAltitude =
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle);
    return (Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180) / Math.PI;
  };

  // Calculate azimuth (compass direction of sun)
  const getAzimuth = (hour, decl) => {
    const decRad = (decl * Math.PI) / 180;
    const latRad = (latitude * Math.PI) / 180;
    const hourAngle = ((hour - 12) * 15 * Math.PI) / 180;

    const altitude = getAltitude(hour, decl);
    const altRad = (altitude * Math.PI) / 180;

    const cosAzimuth = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
                       (Math.cos(altRad) * Math.cos(latRad));

    let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;

    // Adjust for afternoon (west side)
    if (hour > 12) {
      azimuth = 360 - azimuth;
    }

    return azimuth;
  };

  const currentAzimuth = getAzimuth(hourOfDay, declination);

  // FIX ISSUE #2: Calculate smooth compass rotation that doesn't "swing back"
  // We need to track cumulative rotation to avoid the 359° -> 1° jump
  const getSmoothedRotation = (newAzimuth) => {
    const prevRotation = compassRotationRef.current;
    const prevAzimuth = prevRotation % 360;

    // Calculate the shortest angular difference
    let delta = newAzimuth - prevAzimuth;

    // Normalize delta to [-180, 180] range
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Update cumulative rotation
    const newRotation = prevRotation + delta;
    compassRotationRef.current = newRotation;

    return newRotation;
  };

  const compassRotation = getSmoothedRotation(currentAzimuth);

  // Get cardinal direction from azimuth
  const getCardinalDirection = (azimuth) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };
  
  const getAltitudeAtMinute = (minute) => {
    const day = Math.floor(minute / (24 * 60)) + 1;
    const hour = (minute % (24 * 60)) / 60;
    const decl = getDeclination(day);
    return getAltitude(hour, decl);
  };
  
  // FIX #2: Ensure path generation works at poles
  const computeDayAltitudes = (decl) => {
    const points = [];
    // At the poles (latitude ±90), sun altitude is constant throughout the day
    // It equals the declination. We still need to generate points for rendering.
    for (let i = 0; i <= 240; i++) {
      const hour = i / 10;
      points.push({ hour, altitude: getAltitude(hour, decl) });
    }
    return points;
  };
  
  const yearAltitudes = useMemo(() => {
    const points = [];
    const step = 90; // Every 1.5 hours for smoother curve
    for (let minute = 0; minute < totalMinutesInYear; minute += step) {
      points.push({ minute, altitude: getAltitudeAtMinute(minute) });
    }
    return points;
  }, [latitude, axialTilt]);
  
  const dayAltitudes = useMemo(() => computeDayAltitudes(declination), [latitude, declination]);
  const equinoxAltitudes = useMemo(() => computeDayAltitudes(0), [latitude]);
  
  const rawData = viewMode === 'day' ? dayAltitudes : yearAltitudes;
  
  const { yMin, yMax, yRange } = useMemo(() => {
    if (yAxisMode === 'fixed') return { yMin: -90, yMax: 90, yRange: 180 };
    if (yAxisMode === 'wide') return { yMin: -135, yMax: 135, yRange: 270 };
    
    const altitudes = rawData.map(p => p.altitude);
    const dataMin = Math.min(...altitudes);
    const dataMax = Math.max(...altitudes);
    const range = dataMax - dataMin;
    const pad = Math.max(range * 0.15, 8);
    
    let niceMin = Math.floor((dataMin - pad) / 10) * 10;
    let niceMax = Math.ceil((dataMax + pad) / 10) * 10;
    
    // Always include horizon if data crosses it
    if (dataMin < 0 && dataMax > 0) {
      niceMin = Math.min(niceMin, -15);
      niceMax = Math.max(niceMax, 15);
    }
    
    return { 
      yMin: Math.max(niceMin, -90), 
      yMax: Math.min(niceMax, 90), 
      yRange: Math.min(niceMax, 90) - Math.max(niceMin, -90) 
    };
  }, [rawData, yAxisMode]);
  
  const altToY = (alt) => padding.top + ((yMax - alt) / yRange) * graphHeight;
  
  const curveData = useMemo(() => {
    return rawData.map((p) => ({
      ...p,
      x: padding.left + ((viewMode === 'day' ? p.hour / 24 : p.minute / totalMinutesInYear)) * graphWidth,
      y: altToY(p.altitude)
    }));
  }, [rawData, graphWidth, yMax, yRange, viewMode]);
  
  const equinoxCurve = useMemo(() => {
    if (viewMode !== 'day') return null;
    return equinoxAltitudes.map((p) => ({
      ...p,
      x: padding.left + (p.hour / 24) * graphWidth,
      y: altToY(p.altitude)
    }));
  }, [equinoxAltitudes, graphWidth, yMax, yRange, viewMode]);
  
  // FIX #2: Ensure path is always generated even at poles where altitude is constant
  // At poles, the path becomes a horizontal line. We need to ensure it renders visibly.
  const pathD = curveData.length > 0 ? curveData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';
  const equinoxPathD = equinoxCurve ? equinoxCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';

  // FIX: Detect poles directly from latitude (most reliable)
  // At poles (lat ≈ ±90°), sun altitude is constant all day
  // Previous buggy check: first altitude === last altitude (false positives at ALL latitudes!)
  const isAtPole = viewMode === 'day' && Math.abs(latitude) > 89.9;

  // Debug logging for verification (can be removed in production)
  if (viewMode === 'day') {
    const altitudes = curveData.map(p => p.altitude);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    const altitudeRange = maxAlt - minAlt;
    console.log(`[Pole Detection] Lat: ${latitude}° | isAtPole: ${isAtPole} | Alt Range: ${altitudeRange.toFixed(2)}° | Min: ${minAlt.toFixed(1)}° Max: ${maxAlt.toFixed(1)}°`);
  }
  
  const horizonY = altToY(0);
  const horizonVisible = yMin <= 0 && yMax >= 0;
  const zenithY = altToY(90);
  const nadirY = altToY(-90);
  const zenithVisible = yMax >= 90;
  const nadirVisible = yMin <= -90;
  
  const currentAltitude = getAltitudeAtMinute(minuteOfYear);
  const currentX = viewMode === 'day' 
    ? padding.left + (hourOfDay / 24) * graphWidth
    : padding.left + (minuteOfYear / totalMinutesInYear) * graphWidth;
  const currentY = altToY(currentAltitude);
  
  const dayType = viewMode === 'day' ? (() => {
    const minAlt = Math.min(...rawData.map(p => p.altitude));
    const maxAlt = Math.max(...rawData.map(p => p.altitude));
    return minAlt > 0 ? 'midnight-sun' : maxAlt < 0 ? 'polar-night' : 'normal';
  })() : 'normal';
  
  const sunrisePoint = viewMode === 'day' ? curveData.find((p, i) => i > 0 && curveData[i-1].altitude < 0 && p.altitude >= 0) : null;
  const sunsetPoint = viewMode === 'day' ? curveData.find((p, i) => i > 0 && curveData[i-1].altitude >= 0 && p.altitude < 0) : null;
  
  const daylightHours = viewMode === 'day' ? (
    dayType === 'midnight-sun' ? 24 
    : dayType === 'polar-night' ? 0 
    : (curveData.filter(p => p.altitude >= 0).length / curveData.length) * 24
  ) : null;
  
  // FIX #5: All planet axial tilts as bookmarks (sorted 0° to 90°)
  const tiltPresets = [
    { value: 0.034, label: '0.0° Mercury' },
    { value: 2.6, label: '2.6° Venus' },
    { value: 3.1, label: '3.1° Jupiter' },
    { value: 23.4, label: '23.4° Earth' },
    { value: 25.2, label: '25.2° Mars' },
    { value: 26.7, label: '26.7° Saturn' },
    { value: 28.3, label: '28.3° Neptune' },
    { value: 82.2, label: '82.2° Uranus' },
    { value: 90, label: '90° Extreme' },
  ];
  
  // FIX #3: Fixed latitude bookmarks with proper geographic labels
  const latPresets = [
    { value: -90, label: '-90° South Pole' },
    { value: -66.5, label: '-66.5° Antarctic Circle' },
    { value: -23.5, label: '-23.5° Tropic of Capricorn' },
    { value: 0, label: '0° Equator' },
    { value: 23.5, label: '23.5° Tropic of Cancer' },
    { value: 45, label: '45° Mid-Latitudes' },
    { value: 66.5, label: '66.5° Arctic Circle' },
    { value: 90, label: '90° North Pole' },
  ];
  
  // Key dates with accurate day numbers
  const datePresets = [
    { minute: 0, label: 'Jan 1', day: 1 },
    { minute: 79 * 24 * 60, label: 'Mar Equinox', day: 80 },
    { minute: 171 * 24 * 60 + 12 * 60, label: 'Jun Solstice', day: 172 },
    { minute: 265 * 24 * 60, label: 'Sep Equinox', day: 266 },
    { minute: 354 * 24 * 60, label: 'Dec Solstice', day: 355 },
  ];
  
  // Time of day presets
  const timePresets = [
    { hour: 0, label: 'Midnight' },
    { hour: 6, label: 'Dawn' },
    { hour: 12, label: 'Noon' },
    { hour: 18, label: 'Dusk' },
  ];
  
  const yGridLines = useMemo(() => {
    const lines = [];
    const step = yRange <= 50 ? 10 : yRange <= 100 ? 15 : yRange <= 150 ? 20 : 30;
    for (let alt = Math.ceil(yMin / step) * step; alt <= yMax; alt += step) {
      lines.push(alt);
    }
    return lines;
  }, [yMin, yMax, yRange]);
  
  // Season markers for year view
  const seasonMarkers = useMemo(() => {
    if (viewMode !== 'year') return [];
    return [
      { day: 80, label: 'Spring', color: '#4ade80' },
      { day: 172, label: 'Summer', color: '#f4d03f' },
      { day: 266, label: 'Fall', color: '#fb923c' },
      { day: 355, label: 'Winter', color: '#60a5fa' },
    ].map(s => ({
      ...s,
      x: padding.left + ((s.day - 1) * 24 * 60 / totalMinutesInYear) * graphWidth
    }));
  }, [viewMode, graphWidth]);

  // Helper to set time while preserving date
  const setTimeOfDay = (hour) => {
    const currentDay = Math.floor(minuteOfYear / (24 * 60));
    setMinuteOfYear(currentDay * 24 * 60 + hour * 60);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default only for keys we handle
      const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' '].includes(e.key);
      if (!handled) return;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

      e.preventDefault();

      const step = viewMode === 'day' ? 15 : 120; // 15 min for day, 2 hours for year
      const bigStep = viewMode === 'day' ? 60 : 1440; // 1 hour for day, 1 day for year

      if (e.key === 'ArrowRight') {
        setMinuteOfYear(m => (m + (e.shiftKey ? bigStep : step)) % totalMinutesInYear);
      } else if (e.key === 'ArrowLeft') {
        setMinuteOfYear(m => (m - (e.shiftKey ? bigStep : step) + totalMinutesInYear) % totalMinutesInYear);
      } else if (e.key === 'ArrowUp') {
        setLatitude(lat => Math.min(90, lat + (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'ArrowDown') {
        setLatitude(lat => Math.max(-90, lat - (e.shiftKey ? 10 : 1)));
      } else if (e.key === ' ' || e.key === 'Space') {
        setIsPlaying(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Interactive tooltip on hover
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is within graph bounds
    if (mouseX < padding.left || mouseX > padding.left + graphWidth ||
        mouseY < padding.top || mouseY > padding.top + graphHeight) {
      setShowTooltip(false);
      return;
    }

    // Convert mouse X to time/date
    const fraction = (mouseX - padding.left) / graphWidth;
    let tooltipHour, tooltipDay, tooltipMinute;

    if (viewMode === 'day') {
      tooltipHour = fraction * 24;
      tooltipDay = dayOfYear;
      tooltipMinute = Math.floor(minuteOfYear / (24 * 60)) * 24 * 60 + tooltipHour * 60;
    } else {
      tooltipMinute = fraction * totalMinutesInYear;
      tooltipDay = Math.floor(tooltipMinute / (24 * 60)) + 1;
      tooltipHour = (tooltipMinute % (24 * 60)) / 60;
    }

    const tooltipAltitude = getAltitudeAtMinute(tooltipMinute);

    setTooltipData({
      x: mouseX,
      y: mouseY,
      altitude: tooltipAltitude,
      hour: tooltipHour,
      day: tooltipDay
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Interactive Solar Altitude Visualization"
      style={{
        backgroundColor: '#1a1a1c',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e9e9ea',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>
            Solar Altitude Throughout {viewMode === 'day' ? 'the Day' : 'the Year'}
          </h2>
          <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#a1a1a8' }}>
            Use arrow keys to navigate, Space to play/pause
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#27272a', padding: '2px', borderRadius: '5px' }} role="group" aria-label="Y-axis mode">
            {['dynamic', 'fixed', 'wide'].map(mode => (
              <button
                key={mode}
                onClick={() => setYAxisMode(mode)}
                aria-pressed={yAxisMode === mode}
                aria-label={`Y-axis ${mode === 'dynamic' ? 'automatic' : mode === 'fixed' ? 'fixed ±90°' : 'wide ±135°'} mode`}
                onMouseOver={(e) => {
                  if (yAxisMode !== mode) e.target.style.backgroundColor = 'rgba(106, 176, 243, 0.2)';
                }}
                onMouseOut={(e) => {
                  if (yAxisMode !== mode) e.target.style.backgroundColor = 'transparent';
                }}
                style={{
                  padding: '3px 7px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  backgroundColor: yAxisMode === mode ? '#6ab0f3' : 'transparent',
                  color: yAxisMode === mode ? '#1a1a1c' : '#a1a1a8',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode === 'dynamic' ? 'Auto' : mode === 'fixed' ? '±90°' : '±135°'}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#27272a', padding: '2px', borderRadius: '5px' }} role="group" aria-label="View mode">
            {['day', 'year'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                aria-label={`${mode === 'day' ? '24 Hours' : '365 Days'} view`}
                onMouseOver={(e) => {
                  if (viewMode !== mode) e.target.style.backgroundColor = 'rgba(140, 122, 230, 0.2)';
                }}
                onMouseOut={(e) => {
                  if (viewMode !== mode) e.target.style.backgroundColor = 'transparent';
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10px',
                  backgroundColor: viewMode === mode ? '#8c7ae6' : 'transparent',
                  color: viewMode === mode ? '#1a1a1c' : '#a1a1a8',
                  transition: 'all 0.15s ease',
                }}
              >
                {mode === 'day' ? '24 Hours' : '365 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Graph */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={`Solar altitude graph showing altitude from ${yMin.toFixed(0)}° to ${yMax.toFixed(0)}°. Current altitude: ${currentAltitude.toFixed(1)}°`}
      >
        <rect 
          x={padding.left} y={padding.top} 
          width={graphWidth} height={graphHeight} 
          fill="#27272a" rx="4"
        />
        
        <defs>
          <clipPath id="graphClip">
            <rect x={padding.left} y={padding.top} width={graphWidth} height={graphHeight} />
          </clipPath>
          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f4d03f" />
            <stop offset="100%" stopColor="#e67e22" />
          </linearGradient>
        </defs>
        
        {/* Impossible zones (wide mode) */}
        {yAxisMode === 'wide' && (
          <>
            <rect x={padding.left} y={padding.top} width={graphWidth} height={Math.max(0, zenithY - padding.top)}
              fill="rgba(226, 95, 115, 0.12)" clipPath="url(#graphClip)" />
            <rect x={padding.left} y={nadirY} width={graphWidth} height={Math.max(0, padding.top + graphHeight - nadirY)}
              fill="rgba(226, 95, 115, 0.12)" clipPath="url(#graphClip)" />
          </>
        )}
        
        {/* Night region */}
        {horizonVisible && (
          <rect 
            x={padding.left} y={horizonY} 
            width={graphWidth} height={Math.min(yAxisMode === 'wide' ? nadirY : padding.top + graphHeight, padding.top + graphHeight) - horizonY}
            fill="rgba(35, 35, 52, 0.5)"
            clipPath="url(#graphClip)"
          />
        )}
        
        {/* Season markers (year view) */}
        {seasonMarkers.map(s => (
          <g key={s.day}>
            <line x1={s.x} y1={padding.top} x2={s.x} y2={padding.top + graphHeight} 
              stroke={s.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
          </g>
        ))}
        
        {/* Physical limits */}
        {zenithVisible && (
          <>
            <line x1={padding.left} y1={zenithY} x2={padding.left + graphWidth} y2={zenithY}
              stroke="#e25f73" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            <text x={padding.left + graphWidth - 4} y={zenithY + 11} fill="#e25f73" fontSize="9" textAnchor="end">
              zenith +90°
            </text>
          </>
        )}
        {nadirVisible && (
          <>
            <line x1={padding.left} y1={nadirY} x2={padding.left + graphWidth} y2={nadirY}
              stroke="#e25f73" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            <text x={padding.left + graphWidth - 4} y={nadirY - 4} fill="#e25f73" fontSize="9" textAnchor="end">
              nadir -90°
            </text>
          </>
        )}
        
        {/* Horizon */}
        {horizonVisible && (
          <>
            <line x1={padding.left} y1={horizonY} x2={padding.left + graphWidth} y2={horizonY}
              stroke="#e67e22" strokeWidth="1.5" strokeDasharray="6,3" />
            <text x={padding.left + graphWidth - 4} y={horizonY - 4} fill="#e67e22" fontSize="9" textAnchor="end">
              horizon 0°
            </text>
          </>
        )}
        
        {/* Grid - altitude */}
        {yGridLines.map(alt => {
          const y = altToY(alt);
          if (alt === 0 && horizonVisible) return null;
          if ((alt === 90 && zenithVisible) || (alt === -90 && nadirVisible)) return null;
          return (
            <g key={alt}>
              <line x1={padding.left} y1={y} x2={padding.left + graphWidth} y2={y} stroke="#393941" strokeWidth="1" />
              <text x={padding.left - 5} y={y + 3} fill="#a1a1a8" fontSize="10" textAnchor="end">{alt}°</text>
            </g>
          );
        })}
        
        {/* Grid - time (day view) */}
        {viewMode === 'day' && [0, 6, 12, 18, 24].map(hour => {
          const x = padding.left + (hour / 24) * graphWidth;
          return (
            <g key={hour}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#393941" strokeWidth="1" />
              <text x={x} y={padding.top + graphHeight + 14} fill="#a1a1a8" fontSize="10" textAnchor="middle">
                {hour === 0 || hour === 24 ? '00:00' : `${hour}:00`}
              </text>
            </g>
          );
        })}
        
        {/* Grid - months (year view) */}
        {viewMode === 'year' && [
          { day: 1, label: 'Jan' }, { day: 32, label: 'Feb' }, { day: 60, label: 'Mar' },
          { day: 91, label: 'Apr' }, { day: 121, label: 'May' }, { day: 152, label: 'Jun' },
          { day: 182, label: 'Jul' }, { day: 213, label: 'Aug' }, { day: 244, label: 'Sep' },
          { day: 274, label: 'Oct' }, { day: 305, label: 'Nov' }, { day: 335, label: 'Dec' },
        ].map((m, i) => {
          const x = padding.left + ((m.day - 1) * 24 * 60 / totalMinutesInYear) * graphWidth;
          // Show abbreviated labels on narrow screens
          const showLabel = containerWidth > 500 || i % 2 === 0;
          return (
            <g key={m.day}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#393941" strokeWidth="1" />
              {showLabel && (
                <text x={x + 2} y={padding.top + graphHeight + 14} fill="#a1a1a8" fontSize="9" textAnchor="start">
                  {containerWidth > 600 ? m.label : m.label.charAt(0)}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Equinox reference (day view) */}
        {viewMode === 'day' && axialTilt > 0 && Math.abs(declination) > 2 && equinoxCurve && (
          <path d={equinoxPathD} fill="none" stroke="#a1a1a8" strokeWidth="1" strokeDasharray="3,3" opacity="0.35" clipPath="url(#graphClip)" />
        )}
        
        {/* Sun path - FIX: At poles, add tiny vertical variation to force rendering */}
        {isAtPole ? (
          <g>
            {/* Draw line as a very thin rectangle to ensure it renders */}
            <rect
              x={padding.left}
              y={(curveData[0]?.y || 0) - 1.5}
              width={graphWidth}
              height="3"
              fill="url(#sunGradient)"
              clipPath="url(#graphClip)"
            />
          </g>
        ) : pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#sunGradient)"
            strokeWidth={viewMode === 'day' ? 2.5 : 1.2}
            strokeLinecap="round"
            clipPath="url(#graphClip)"
          />
        )}
        
        {/* Sunrise/sunset markers */}
        {viewMode === 'day' && sunrisePoint && (
          <circle cx={sunrisePoint.x} cy={sunrisePoint.y} r="4" fill="#e67e22" />
        )}
        {viewMode === 'day' && sunsetPoint && (
          <circle cx={sunsetPoint.x} cy={sunsetPoint.y} r="4" fill="#e25f73" />
        )}
        
        {/* Current position - sun emoji marker */}
        <text
          x={currentX}
          y={currentY}
          fontSize="28"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
          role="img"
          aria-label={`Current sun position: ${currentAltitude.toFixed(1)}° at ${getDateTimeLabel()}`}
        >
          ☀️
        </text>

        {/* Interactive tooltip */}
        {showTooltip && (
          <g>
            {/* Crosshair */}
            <line
              x1={tooltipData.x}
              y1={padding.top}
              x2={tooltipData.x}
              y2={padding.top + graphHeight}
              stroke="#a1a1a8"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
            <line
              x1={padding.left}
              y1={altToY(tooltipData.altitude)}
              x2={padding.left + graphWidth}
              y2={altToY(tooltipData.altitude)}
              stroke="#a1a1a8"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
            {/* Tooltip box */}
            <g transform={`translate(${Math.min(tooltipData.x + 10, width - 120)}, ${Math.max(20, Math.min(tooltipData.y - 30, height - 60))})`}>
              <rect
                x="0"
                y="0"
                width="110"
                height="45"
                fill="#27272a"
                stroke="#6ab0f3"
                strokeWidth="1.5"
                rx="4"
                opacity="0.95"
              />
              <text x="6" y="15" fill="#f4d03f" fontSize="11" fontWeight="500">
                {tooltipData.altitude.toFixed(1)}°
              </text>
              <text x="6" y="28" fill="#e9e9ea" fontSize="9">
                {viewMode === 'day'
                  ? `${Math.floor(tooltipData.hour)}:${Math.round((tooltipData.hour % 1) * 60).toString().padStart(2, '0')}`
                  : (() => {
                      const date = new Date(2024, 0, tooltipData.day);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    })()}
              </text>
              <text x="6" y="40" fill="#a1a1a8" fontSize="8">
                {tooltipData.altitude >= 0 ? 'Above horizon' : 'Below horizon'}
              </text>
            </g>
          </g>
        )}
        
        {/* Y-axis label */}
        <text x={10} y={padding.top + graphHeight / 2} fill="#a1a1a8" fontSize="10" textAnchor="middle" 
          transform={`rotate(-90, 10, ${padding.top + graphHeight / 2})`}>
          Altitude (°)
        </text>
        
        {/* X-axis label */}
        <text x={padding.left + graphWidth / 2} y={height - 4} fill="#a1a1a8" fontSize="10" textAnchor="middle">
          {viewMode === 'day' ? 'Local Solar Time' : 'Month'}
        </text>
      </svg>
      
      {/* Time controls - directly under graph */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid #393941',
        marginBottom: '12px'
      }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          style={{
            width: '28px', height: '28px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isPlaying ? '#e25f73' : '#8c7ae6',
            color: '#1a1a1c',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 0.2s ease',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="range"
            min={0}
            max={totalMinutesInYear - 1}
            step={15}
            value={minuteOfYear}
            onChange={(e) => setMinuteOfYear(parseInt(e.target.value, 10))}
            aria-label="Time navigation slider"
            aria-valuetext={getDateTimeLabel()}
            aria-valuemin={0}
            aria-valuemax={totalMinutesInYear - 1}
            aria-valuenow={minuteOfYear}
            title="Use Left/Right arrows to navigate. Hold Shift for larger steps."
            style={{ width: '100%', accentColor: '#f4d03f', margin: 0, cursor: 'pointer' }}
          />
        </div>
        
        <span style={{ fontSize: '12px', color: '#f4d03f', fontWeight: 500, flexShrink: 0, minWidth: '95px' }}>
          {getDateTimeLabel()}
        </span>
      </div>
      
      {/* Compass indicator (day view only) - FIX #1: Always visible, shows sun azimuth even below horizon */}
      {viewMode === 'day' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          backgroundColor: '#27272a',
          borderRadius: '5px',
          marginBottom: '8px',
          fontSize: '11px'
        }}>
          <span style={{ color: '#a1a1a8' }}>Sun Direction:</span>
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid #393941',
            backgroundColor: '#1a1a1c'
          }}>
            {/* Compass cardinal points */}
            <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: '#a1a1a8', fontWeight: 600 }}>N</div>
            <div style={{ position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)', fontSize: '8px', color: '#a1a1a8' }}>E</div>
            <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: '#a1a1a8' }}>S</div>
            <div style={{ position: 'absolute', left: '-2px', top: '50%', transform: 'translateY(-50%)', fontSize: '8px', color: '#a1a1a8' }}>W</div>
            {/* Sun indicator - FIX ISSUE #2: Use smoothed rotation to prevent "swinging back" */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '2px',
              height: '16px',
              backgroundColor: '#f4d03f',
              transformOrigin: 'bottom center',
              transform: `translate(-50%, -100%) rotate(${compassRotation}deg)`,
              transition: 'transform 0.3s ease'
            }}>
              <div style={{
                position: 'absolute',
                top: '-3px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f4d03f',
                boxShadow: '0 0 4px #f4d03f'
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#4ade80', fontWeight: 500 }}>
              {currentAzimuth.toFixed(0)}° {getCardinalDirection(currentAzimuth)}
            </span>
            <span style={{ color: '#a1a1a8', fontSize: '9px' }}>
              {currentAltitude.toFixed(1)}° elevation
            </span>
          </div>
        </div>
      )}

      {/* Time presets row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '12px'
      }}>
        {/* Date presets */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {datePresets.map(p => (
            <button
              key={p.label}
              onClick={() => setMinuteOfYear(p.minute)}
              aria-label={`Jump to ${p.label}`}
              title={`Jump to ${p.label}`}
              onMouseOver={(e) => {
                if (Math.abs(dayOfYear - p.day) >= 5) {
                  e.target.style.backgroundColor = 'rgba(244, 208, 63, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (Math.abs(dayOfYear - p.day) >= 5) {
                  e.target.style.backgroundColor = '#27272a';
                }
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                backgroundColor: Math.abs(dayOfYear - p.day) < 5 ? 'rgba(244, 208, 63, 0.25)' : '#27272a',
                color: Math.abs(dayOfYear - p.day) < 5 ? '#f4d03f' : '#a1a1a8',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        
        {/* Time of day presets */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {timePresets.map(p => (
            <button
              key={p.label}
              onClick={() => setTimeOfDay(p.hour)}
              aria-label={`Jump to ${p.label}`}
              title={`Set time to ${p.label} (${p.hour}:00)`}
              onMouseOver={(e) => {
                if (Math.abs(hourOfDay - p.hour) >= 1) {
                  e.target.style.backgroundColor = 'rgba(140, 122, 230, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (Math.abs(hourOfDay - p.hour) >= 1) {
                  e.target.style.backgroundColor = '#27272a';
                }
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                backgroundColor: Math.abs(hourOfDay - p.hour) < 1 ? 'rgba(140, 122, 230, 0.25)' : '#27272a',
                color: Math.abs(hourOfDay - p.hour) < 1 ? '#8c7ae6' : '#a1a1a8',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '8px 10px',
          backgroundColor: '#232334',
          borderRadius: '5px',
          fontSize: '11px',
          marginBottom: '12px'
        }}
        role="status"
        aria-live="polite"
        aria-label="Current solar statistics"
      >
        <div>
          <span style={{ color: '#a1a1a8' }}>Altitude: </span>
          <span
            style={{ color: currentAltitude >= 0 ? '#f4d03f' : '#6ab0f3', fontWeight: 500 }}
            title={currentAltitude >= 0 ? 'Sun is above the horizon' : 'Sun is below the horizon'}
          >
            {currentAltitude.toFixed(1)}°
          </span>
        </div>
        <div>
          <span style={{ color: '#a1a1a8' }}>Declination: </span>
          <span title={`Solar declination: ${declination >= 0 ? 'Northern' : 'Southern'} hemisphere`}>
            {declination >= 0 ? '+' : ''}{declination.toFixed(1)}°
          </span>
        </div>
        {viewMode === 'day' && (
          <div>
            <span style={{ color: '#a1a1a8' }}>Azimuth: </span>
            <span
              style={{ color: '#4ade80', fontWeight: 500 }}
              title={`Sun direction: ${currentAzimuth.toFixed(1)}° from North`}
            >
              {currentAzimuth.toFixed(0)}° {getCardinalDirection(currentAzimuth)}
            </span>
          </div>
        )}
        {viewMode === 'day' && (
          <>
            <div>
              <span style={{ color: '#a1a1a8' }}>Daylight: </span>
              <span style={{ color: '#8c7ae6' }} title={`${daylightHours.toFixed(1)} hours of daylight`}>
                {daylightHours.toFixed(1)}h
              </span>
            </div>
            {dayType === 'normal' && sunrisePoint && (
              <div>
                <span style={{ color: '#e67e22' }}>↑</span>
                <span style={{ color: '#a1a1a8' }}> {Math.floor(sunrisePoint.hour)}:{((sunrisePoint.hour % 1) * 60).toFixed(0).padStart(2, '0')}</span>
              </div>
            )}
            {dayType === 'normal' && sunsetPoint && (
              <div>
                <span style={{ color: '#e25f73' }}>↓</span>
                <span style={{ color: '#a1a1a8' }}> {Math.floor(sunsetPoint.hour)}:{((sunsetPoint.hour % 1) * 60).toFixed(0).padStart(2, '0')}</span>
              </div>
            )}
            {dayType !== 'normal' && (
              <span style={{ 
                color: dayType === 'midnight-sun' ? '#f4d03f' : '#8c7ae6',
                fontWeight: 500 
              }}>
                {dayType === 'midnight-sun' ? '☀ Midnight Sun' : '● Polar Night'}
              </span>
            )}
          </>
        )}
      </div>
      
      {/* Parameter sliders */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Latitude */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px' }}>
              Latitude: <span style={{ color: '#8c7ae6', fontWeight: 500 }}>{latitude}°</span>
            </label>
            {Math.abs(latitude) > arcticLat && axialTilt > 0 && (
              <span style={{ fontSize: '10px', color: '#e67e22' }}>Inside Arctic Circle</span>
            )}
          </div>
          
          {/* Visual latitude bar with markers */}
          <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
            <input
              type="range"
              min={-90}
              max={90}
              value={latitude}
              onChange={(e) => setLatitude(parseInt(e.target.value, 10))}
              aria-label="Latitude slider"
              aria-valuetext={`${latitude}° ${latitude >= 0 ? 'North' : 'South'}`}
              aria-valuemin={-90}
              aria-valuemax={90}
              aria-valuenow={latitude}
              title="Use Up/Down arrows to adjust. Hold Shift for steps of 10°."
              style={{ width: '100%', accentColor: '#8c7ae6', position: 'absolute', top: 0, cursor: 'pointer' }}
            />
            {/* Tropic markers */}
            {axialTilt > 0 && (
              <>
                <div style={{
                  position: 'absolute',
                  left: `${((tropicLat + 90) / 180) * 100}%`,
                  top: '14px',
                  width: '1px',
                  height: '6px',
                  backgroundColor: '#f4d03f',
                  opacity: 0.7
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${((-tropicLat + 90) / 180) * 100}%`,
                  top: '14px',
                  width: '1px',
                  height: '6px',
                  backgroundColor: '#f4d03f',
                  opacity: 0.7
                }} />
                {/* Arctic markers */}
                <div style={{
                  position: 'absolute',
                  left: `${((arcticLat + 90) / 180) * 100}%`,
                  top: '14px',
                  width: '1px',
                  height: '6px',
                  backgroundColor: '#60a5fa',
                  opacity: 0.7
                }} />
                <div style={{
                  position: 'absolute',
                  left: `${((-arcticLat + 90) / 180) * 100}%`,
                  top: '14px',
                  width: '1px',
                  height: '6px',
                  backgroundColor: '#60a5fa',
                  opacity: 0.7
                }} />
              </>
            )}
          </div>
          
          {/* FIX #4: Latitude bookmarks anchored to left in a column layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9px', marginTop: '4px' }}>
            {latPresets.map(p => (
              <button
                key={p.label}
                onClick={() => setLatitude(p.value)}
                style={{
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  textAlign: 'left',
                  backgroundColor: Math.abs(latitude - p.value) < 2 ? 'rgba(140, 122, 230, 0.25)' : '#27272a',
                  color: Math.abs(latitude - p.value) < 2 ? '#8c7ae6' : '#a1a1a8',
                  fontSize: '9px',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  if (Math.abs(latitude - p.value) >= 2) e.target.style.backgroundColor = 'rgba(140, 122, 230, 0.1)';
                }}
                onMouseOut={(e) => {
                  if (Math.abs(latitude - p.value) >= 2) e.target.style.backgroundColor = '#27272a';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Axial Tilt */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label style={{ fontSize: '12px' }}>
              Axial Tilt: <span style={{ color: '#6ab0f3', fontWeight: 500 }}>{axialTilt.toFixed(1)}°</span>
            </label>
            <span style={{ fontSize: '10px', color: '#a1a1a8' }}>
              Tropics ±{tropicLat.toFixed(0)}° · Arctic ±{arcticLat.toFixed(0)}°
            </span>
          </div>
          
          <input
            type="range"
            min={0}
            max={90}
            step={0.1}
            value={axialTilt}
            onChange={(e) => setAxialTilt(parseFloat(e.target.value))}
            aria-label="Axial tilt slider"
            aria-valuetext={`${axialTilt.toFixed(1)} degrees`}
            aria-valuemin={0}
            aria-valuemax={90}
            aria-valuenow={axialTilt}
            title="Adjust planetary axial tilt (obliquity)"
            style={{ width: '100%', accentColor: '#6ab0f3', marginBottom: '4px', cursor: 'pointer' }}
          />
          
          {/* FIX #6: Axial tilt bookmarks anchored to left in a column layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9px', marginTop: '4px' }}>
            {tiltPresets.map(p => (
              <button
                key={p.label}
                onClick={() => setAxialTilt(p.value)}
                style={{
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  textAlign: 'left',
                  backgroundColor: Math.abs(axialTilt - p.value) < 0.5 ? 'rgba(106, 176, 243, 0.25)' : '#27272a',
                  color: Math.abs(axialTilt - p.value) < 0.5 ? '#6ab0f3' : '#a1a1a8',
                  fontSize: '9px',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  if (Math.abs(axialTilt - p.value) >= 0.5) e.target.style.backgroundColor = 'rgba(106, 176, 243, 0.1)';
                }}
                onMouseOut={(e) => {
                  if (Math.abs(axialTilt - p.value) >= 0.5) e.target.style.backgroundColor = '#27272a';
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Educational notes */}
      {axialTilt === 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#27272a',
            borderRadius: '5px',
            borderLeft: '3px solid #6ab0f3',
            fontSize: '11px',
            color: '#a1a1a8'
          }}
          role="note"
          aria-label="Educational information about zero axial tilt"
        >
          <strong style={{ color: '#6ab0f3' }}>No axial tilt:</strong> Every location has exactly 12 hours of daylight year-round. No seasons exist. The sun's daily path remains identical throughout the year.
        </div>
      )}

      {axialTilt > 50 && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#27272a',
            borderRadius: '5px',
            borderLeft: '3px solid #e67e22',
            fontSize: '11px',
            color: '#a1a1a8'
          }}
          role="note"
          aria-label="Educational information about extreme axial tilt"
        >
          <strong style={{ color: '#e67e22' }}>Extreme tilt:</strong> The Arctic Circle is now at {arcticLat.toFixed(0)}° latitude.
          Most of the planet experiences midnight sun or polar night seasonally. Extreme seasonal variation would make this planet challenging for life.
        </div>
      )}

      {viewMode === 'day' && dayType === 'midnight-sun' && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#27272a',
            borderRadius: '5px',
            borderLeft: '3px solid #f4d03f',
            fontSize: '11px',
            color: '#a1a1a8'
          }}
          role="note"
          aria-label="Midnight sun information"
        >
          <strong style={{ color: '#f4d03f' }}>Midnight Sun:</strong> At this latitude and date, the sun never sets. This phenomenon occurs inside the Arctic/Antarctic circles during summer months. The sun circles the horizon instead of dipping below it.
        </div>
      )}

      {viewMode === 'day' && dayType === 'polar-night' && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#27272a',
            borderRadius: '5px',
            borderLeft: '3px solid #60a5fa',
            fontSize: '11px',
            color: '#a1a1a8'
          }}
          role="note"
          aria-label="Polar night information"
        >
          <strong style={{ color: '#60a5fa' }}>Polar Night:</strong> At this latitude and date, the sun never rises above the horizon. This occurs inside the Arctic/Antarctic circles during winter months. Twilight may still be visible, but the sun remains below the horizon all day.
        </div>
      )}

      {latitude === 0 && Math.abs(declination) < 2 && viewMode === 'day' && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 10px',
            backgroundColor: '#27272a',
            borderRadius: '5px',
            borderLeft: '3px solid #4ade80',
            fontSize: '11px',
            color: '#a1a1a8'
          }}
          role="note"
          aria-label="Equator at equinox information"
        >
          <strong style={{ color: '#4ade80' }}>Equator at Equinox:</strong> The sun passes directly overhead (90° altitude) at noon. This is one of only two days per year when the sun's path crosses the zenith at the equator. Day and night are exactly 12 hours each.
        </div>
      )}

      {/* 3D Earth Visualization */}
      <div style={{
        marginTop: '24px',
        height: containerWidth < 600 ? '300px' : '500px',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #393941'
      }}>
        <EarthVisualization
          latitude={latitude}
          longitude={0}
          axialTilt={axialTilt}
          dayOfYear={dayOfYear}
          hourOfDay={hourOfDay}
          currentAzimuth={currentAzimuth}
          currentAltitude={currentAltitude}
        />
      </div>

      {/* 3D View Legend */}
      <div style={{ fontSize: '11px', color: '#a1a1a8', marginTop: '8px', textAlign: 'center' }}>
        3D View: Purple marker shows your location. Sun illumination corresponds to altitude graph above. Drag to rotate, scroll to zoom.
      </div>
    </div>
  );
};

export default SunPositionViz;