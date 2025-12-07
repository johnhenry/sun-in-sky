import { useState, useMemo, useRef, useEffect } from 'react';
import EarthVisualization from './EarthVisualization.jsx';
import LearnPanel from './components/panels/LearnPanel/LearnPanel.jsx';
import ChallengePanel from './components/panels/ChallengePanel/ChallengePanel.jsx';
import { initializeStorage } from './utils/localStorage.js';
import { lttb } from './utils/lttb.js';

const SunPositionViz = () => {
  const [latitude, setLatitude] = useState(45);
  const [minuteOfYear, setMinuteOfYear] = useState(171 * 24 * 60 + 12 * 60);
  const [axialTilt, setAxialTilt] = useState(23.45);
  const [dayLength, setDayLength] = useState(24); // hours per day
  const [yearLength, setYearLength] = useState(365); // days per year
  const [viewMode, setViewMode] = useState('day');
  const [yAxisMode, setYAxisMode] = useState('dynamic');
  const [containerWidth, setContainerWidth] = useState(800);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({ x: 0, y: 0, altitude: 0, hour: 0, day: 0 });
  const [referenceFrame, setReferenceFrame] = useState('sun-fixed'); // 'sun-fixed' or 'earth-fixed'

  // Panel states
  const [learnPanelOpen, setLearnPanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);

  const containerRef = useRef(null);
  const playRef = useRef(null);
  const svgRef = useRef(null);
  const compassRotationRef = useRef(0); // Track cumulative rotation for smooth compass animation

  // Initialize localStorage on mount
  useEffect(() => {
    initializeStorage();
  }, []);

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

  const width = containerWidth;
  const height = 280;
  const padding = { top: 25, right: 50, bottom: 45, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const minutesPerDay = dayLength * 60;
  const totalMinutesInYear = yearLength * minutesPerDay;

  // Clamp minuteOfYear to valid range when parameters change
  useEffect(() => {
    if (minuteOfYear >= totalMinutesInYear) {
      setMinuteOfYear(totalMinutesInYear - 1);
    }
  }, [totalMinutesInYear]);

  // Animation effect - placed after totalMinutesInYear declaration
  useEffect(() => {
    if (isPlaying) {
      const step = viewMode === 'day' ? 15 : 120;
      playRef.current = setInterval(() => {
        setMinuteOfYear(m => {
          const next = m + step;
          // Wrap around using current totalMinutesInYear
          return next >= totalMinutesInYear ? 0 : next;
        });
      }, 50);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, viewMode, totalMinutesInYear]);

  const dayOfYear = Math.floor(minuteOfYear / minutesPerDay) + 1;
  const hourOfDay = (minuteOfYear % minutesPerDay) / 60;
  
  // Key astronomical values derived from tilt
  const tropicLat = axialTilt;
  const arcticLat = 90 - axialTilt;
  
  const getDeclination = (day) => {
    // Clamp day to valid range and handle edge cases
    const clampedDay = Math.max(1, Math.min(day, yearLength));
    return axialTilt * Math.sin((2 * Math.PI / yearLength) * (clampedDay - yearLength * 0.22)); // 0.22 ≈ 81/365 (vernal equinox)
  };
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
    const solarNoon = dayLength / 2;
    const hourAngle = ((hour - solarNoon) * 360 / dayLength * Math.PI) / 180;
    const sinAltitude =
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle);
    return (Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180) / Math.PI;
  };

  // Calculate azimuth (compass direction of sun)
  const getAzimuth = (hour, decl) => {
    const decRad = (decl * Math.PI) / 180;
    const latRad = (latitude * Math.PI) / 180;
    const solarNoon = dayLength / 2;
    const hourAngle = ((hour - solarNoon) * 360 / dayLength * Math.PI) / 180;

    const altitude = getAltitude(hour, decl);
    const altRad = (altitude * Math.PI) / 180;

    const cosAzimuth = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
                       (Math.cos(altRad) * Math.cos(latRad));

    let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;

    // Adjust for afternoon (west side)
    if (hour > solarNoon) {
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
    // Clamp minute to valid range
    const clampedMinute = Math.max(0, Math.min(minute, totalMinutesInYear - 1));
    const day = Math.floor(clampedMinute / minutesPerDay) + 1;
    const hour = (clampedMinute % minutesPerDay) / 60;
    const decl = getDeclination(day);
    return getAltitude(hour, decl);
  };
  
  // FIX #2: Ensure path generation works at poles
  const computeDayAltitudes = (decl) => {
    const points = [];
    // At the poles (latitude ±90), sun altitude is constant throughout the day
    // It equals the declination. We still need to generate points for rendering.
    const numPoints = 240;
    for (let i = 0; i <= numPoints; i++) {
      const hour = (i / numPoints) * dayLength;
      points.push({ hour, altitude: getAltitude(hour, decl) });
    }
    return points;
  };
  
  const yearAltitudes = useMemo(() => {
    // LTTB (Largest Triangle Three Buckets) Downsampling:
    // This algorithm intelligently reduces data points while preserving visual shape.
    // It works by selecting points that form the largest triangles, which preserves
    // peaks, valleys, and inflection points in the curve.
    //
    // Performance comparison:
    // - Old approach: Uniform sampling, 10,000 points for all planets
    // - LTTB approach: Smart sampling, 5,000 points with BETTER visual fidelity
    //
    // Benefits:
    // - 2x fewer points = 2x faster rendering
    // - Superior detail preservation (peaks, valleys, inflection points)
    // - Works perfectly from Earth (365d) to Neptune (60,190d)
    //
    // References:
    // - Original paper: https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf
    // - Used by Grafana, InfluxDB, and other professional tools

    // Step 1: Generate initial high-resolution data
    // We generate enough points to capture the curve accurately, then downsample
    const INITIAL_SAMPLING_POINTS = 20000; // Generate detailed curve first
    const step = Math.max(90, Math.floor(totalMinutesInYear / INITIAL_SAMPLING_POINTS));

    const allPoints = [];
    for (let minute = 0; minute < totalMinutesInYear; minute += step) {
      allPoints.push({
        x: minute,
        y: getAltitudeAtMinute(minute)
      });
    }

    // Step 2: Downsample using LTTB to target point count
    const TARGET_POINTS = 5000; // Sweet spot for performance vs visual quality

    // If we already have fewer points than target, skip downsampling
    if (allPoints.length <= TARGET_POINTS) {
      return allPoints.map(p => ({ minute: p.x, altitude: p.y }));
    }

    // Apply LTTB algorithm
    const downsampled = lttb(allPoints, TARGET_POINTS);

    // Step 3: Convert back to our data format
    return downsampled.map(p => ({ minute: p.x, altitude: p.y }));
  }, [latitude, axialTilt, dayLength, yearLength, totalMinutesInYear, minutesPerDay]);

  const dayAltitudes = useMemo(() => computeDayAltitudes(declination), [latitude, declination, dayLength]);
  const equinoxAltitudes = useMemo(() => computeDayAltitudes(0), [latitude, dayLength]);
  
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
      x: padding.left + ((viewMode === 'day' ? p.hour / dayLength : p.minute / totalMinutesInYear)) * graphWidth,
      y: altToY(p.altitude)
    }));
  }, [rawData, graphWidth, yMax, yRange, viewMode, dayLength, totalMinutesInYear]);
  
  const equinoxCurve = useMemo(() => {
    if (viewMode !== 'day') return null;
    return equinoxAltitudes.map((p) => ({
      ...p,
      x: padding.left + (p.hour / dayLength) * graphWidth,
      y: altToY(p.altitude)
    }));
  }, [equinoxAltitudes, graphWidth, yMax, yRange, viewMode, dayLength]);
  
  // FIX #2: Ensure path is always generated even at poles where altitude is constant
  // At poles, the path becomes a horizontal line. We need to ensure it renders visibly.
  const pathD = curveData.length > 0 ? curveData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';
  const equinoxPathD = equinoxCurve ? equinoxCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : '';

  // FIX: Detect poles directly from latitude (most reliable)
  // At poles (lat ≈ ±90°), sun altitude is constant all day
  // Previous buggy check: first altitude === last altitude (false positives at ALL latitudes!)
  const isAtPole = viewMode === 'day' && Math.abs(latitude) > 89.9;

  const horizonY = altToY(0);
  const horizonVisible = yMin <= 0 && yMax >= 0;
  const zenithY = altToY(90);
  const nadirY = altToY(-90);
  const zenithVisible = yMax >= 90;
  const nadirVisible = yMin <= -90;
  
  const currentAltitude = getAltitudeAtMinute(minuteOfYear);
  const currentX = viewMode === 'day'
    ? padding.left + (hourOfDay / dayLength) * graphWidth
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
    dayType === 'midnight-sun' ? dayLength
    : dayType === 'polar-night' ? 0
    : (curveData.filter(p => p.altitude >= 0).length / curveData.length) * dayLength
  ) : null;
  
  // Planet presets with axial tilt, day length, and year length
  const planetPresets = [
    { name: 'Mercury', tilt: 0.034, dayLength: 1407.6, yearLength: 88 },
    { name: 'Venus', tilt: 2.6, dayLength: 5832.5, yearLength: 225 },
    { name: 'Earth', tilt: 23.4, dayLength: 24, yearLength: 365 },
    { name: 'Mars', tilt: 25.2, dayLength: 24.6, yearLength: 687 },
    { name: 'Jupiter', tilt: 3.1, dayLength: 9.9, yearLength: 4333 },
    { name: 'Saturn', tilt: 26.7, dayLength: 10.7, yearLength: 10759 },
    { name: 'Uranus', tilt: 82.2, dayLength: 17.2, yearLength: 30687 },
    { name: 'Neptune', tilt: 28.3, dayLength: 16.1, yearLength: 60190 },
  ];
  
  // Dynamic latitude bookmarks based on current axial tilt
  const latPresets = useMemo(() => [
    { value: -90, label: '-90° South Pole' },
    { value: -arcticLat, label: `${-arcticLat.toFixed(1)}° Antarctic Circle` },
    { value: -tropicLat, label: `${-tropicLat.toFixed(1)}° Tropic of Capricorn` },
    { value: 0, label: '0° Equator' },
    { value: tropicLat, label: `${tropicLat.toFixed(1)}° Tropic of Cancer` },
    { value: 45, label: '45° Mid-Latitudes' },
    { value: arcticLat, label: `${arcticLat.toFixed(1)}° Arctic Circle` },
    { value: 90, label: '90° North Pole' },
  ], [tropicLat, arcticLat]);
  
  // Key dates scaled to current year length
  const datePresets = useMemo(() => [
    { minute: 0, label: 'Start', day: 1 },
    { minute: Math.floor(yearLength * 0.219) * minutesPerDay, label: 'Spring Eq', day: Math.floor(yearLength * 0.219) + 1 },
    { minute: Math.floor(yearLength * 0.470) * minutesPerDay + (minutesPerDay / 2), label: 'Summer Sol', day: Math.floor(yearLength * 0.470) + 1 },
    { minute: Math.floor(yearLength * 0.726) * minutesPerDay, label: 'Fall Eq', day: Math.floor(yearLength * 0.726) + 1 },
    { minute: Math.floor(yearLength * 0.971) * minutesPerDay, label: 'Winter Sol', day: Math.floor(yearLength * 0.971) + 1 },
  ], [yearLength, minutesPerDay]);
  
  // Time of day presets scaled to current day length
  const timePresets = useMemo(() => [
    { hour: 0, label: 'Start' },
    { hour: dayLength * 0.25, label: 'Quarter' },
    { hour: dayLength * 0.5, label: 'Noon' },
    { hour: dayLength * 0.75, label: 'Three-Quarter' },
  ], [dayLength]);
  
  const yGridLines = useMemo(() => {
    const lines = [];
    const step = yRange <= 50 ? 10 : yRange <= 100 ? 15 : yRange <= 150 ? 20 : 30;
    for (let alt = Math.ceil(yMin / step) * step; alt <= yMax; alt += step) {
      lines.push(alt);
    }
    return lines;
  }, [yMin, yMax, yRange]);
  
  // Season markers for year view (scaled to yearLength)
  const seasonMarkers = useMemo(() => {
    if (viewMode !== 'year') return [];
    return [
      { day: Math.floor(yearLength * 0.219) + 1, label: 'Spring', color: '#4ade80' },
      { day: Math.floor(yearLength * 0.470) + 1, label: 'Summer', color: '#f4d03f' },
      { day: Math.floor(yearLength * 0.726) + 1, label: 'Fall', color: '#fb923c' },
      { day: Math.floor(yearLength * 0.971) + 1, label: 'Winter', color: '#60a5fa' },
    ].map(s => ({
      ...s,
      x: padding.left + ((s.day - 1) * minutesPerDay / totalMinutesInYear) * graphWidth
    }));
  }, [viewMode, graphWidth, yearLength, minutesPerDay, totalMinutesInYear]);

  // Helper to set time while preserving date
  const setTimeOfDay = (hour) => {
    const currentDay = Math.floor(minuteOfYear / minutesPerDay);
    setMinuteOfYear(currentDay * minutesPerDay + hour * 60);
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

    // Find the nearest point on the actual curve (matches visual exactly)
    // This ensures tooltip shows data from the rendered curve, not recalculated values
    let nearestPoint = curveData[0];
    let minDistance = Math.abs(curveData[0].x - mouseX);

    for (let i = 1; i < curveData.length; i++) {
      const distance = Math.abs(curveData[i].x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = curveData[i];
      }
    }

    // Extract time/date from the nearest actual data point
    let tooltipHour, tooltipDay;
    if (viewMode === 'day') {
      tooltipHour = nearestPoint.hour;
      tooltipDay = dayOfYear;
    } else {
      tooltipDay = Math.floor(nearestPoint.minute / minutesPerDay) + 1;
      tooltipHour = (nearestPoint.minute % minutesPerDay) / 60;
    }

    setTooltipData({
      x: mouseX,
      y: mouseY,
      altitude: nearestPoint.altitude,
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
      {/* Main Header with Learn and Challenge buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #393941',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{
            fontSize: '24px',
            margin: 0,
            fontWeight: 700,
            color: '#e9e9ea',
            letterSpacing: '-0.5px'
          }}>
            Sun in Sky
          </h1>
          <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#a1a1a8', fontWeight: 400 }}>
            Interactive solar position visualization
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setLearnPanelOpen(!learnPanelOpen)}
            aria-label={`${learnPanelOpen ? 'Close' : 'Open'} Learn Panel`}
            aria-expanded={learnPanelOpen}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: learnPanelOpen ? '1px solid #8c7ae6' : '1px solid #393941',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: learnPanelOpen ? '#8c7ae6' : 'transparent',
              color: learnPanelOpen ? '#1a1a1c' : '#e9e9ea',
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px'
            }}
            onMouseOver={(e) => {
              if (!learnPanelOpen) {
                e.currentTarget.style.borderColor = '#8c7ae6';
                e.currentTarget.style.color = '#8c7ae6';
              }
            }}
            onMouseOut={(e) => {
              if (!learnPanelOpen) {
                e.currentTarget.style.borderColor = '#393941';
                e.currentTarget.style.color = '#e9e9ea';
              }
            }}
          >
            Learn
          </button>

          <button
            onClick={() => setChallengePanelOpen(!challengePanelOpen)}
            aria-label={`${challengePanelOpen ? 'Close' : 'Open'} Challenge Panel`}
            aria-expanded={challengePanelOpen}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: challengePanelOpen ? '1px solid #6ab0f3' : '1px solid #393941',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: challengePanelOpen ? '#6ab0f3' : 'transparent',
              color: challengePanelOpen ? '#1a1a1c' : '#e9e9ea',
              transition: 'all 0.2s ease',
              letterSpacing: '0.3px'
            }}
            onMouseOver={(e) => {
              if (!challengePanelOpen) {
                e.currentTarget.style.borderColor = '#6ab0f3';
                e.currentTarget.style.color = '#6ab0f3';
              }
            }}
            onMouseOut={(e) => {
              if (!challengePanelOpen) {
                e.currentTarget.style.borderColor = '#393941';
                e.currentTarget.style.color = '#e9e9ea';
              }
            }}
          >
            Challenge
          </button>
        </div>
      </div>

      {/* Graph Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>
            Solar Altitude Throughout {viewMode === 'day' ? 'Day' : 'Year'}
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
                aria-label={`${mode === 'day' ? 'Day' : 'Year'} view`}
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
                {mode === 'day' ? 'Day' : 'Year'}
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
        {viewMode === 'day' && Array.from({ length: 5 }, (_, i) => i * (dayLength / 4)).map(hour => {
          const x = padding.left + (hour / dayLength) * graphWidth;
          return (
            <g key={hour}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + graphHeight} stroke="#393941" strokeWidth="1" />
              <text x={x} y={padding.top + graphHeight + 14} fill="#a1a1a8" fontSize="10" textAnchor="middle">
                {hour.toFixed(0)}h
              </text>
            </g>
          );
        })}
        
        {/* Grid - months (year view) - scaled to yearLength */}
        {viewMode === 'year' && Array.from({ length: 12 }, (_, i) => ({
          day: Math.floor((i / 12) * yearLength) + 1,
          label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
        })).map((m, i) => {
          const x = padding.left + ((m.day - 1) * minutesPerDay / totalMinutesInYear) * graphWidth;
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
      
      {/* Compass indicator - Shows sun azimuth in both day and year views */}
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
          {/* Sun indicator - Uses smoothed rotation to prevent "swinging back" */}
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

          {/* Latitude bookmarks */}
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

        {/* Planetary Parameters (Tilt, Day, Year) */}
        <div style={{
          flex: 2,
          minWidth: containerWidth < 600 ? '100%' : '400px',
          backgroundColor: '#232334',
          padding: '12px',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#e9e9ea' }}>
            Planetary Parameters
          </div>

          {/* Planet presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px', overflow: 'visible' }}>
            {planetPresets.map(p => (
              <button
                key={p.name}
                onClick={() => {
                  setAxialTilt(p.tilt);
                  setDayLength(p.dayLength);
                  setYearLength(p.yearLength);
                }}
                style={{
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: Math.abs(axialTilt - p.tilt) < 0.5 && Math.abs(dayLength - p.dayLength) < 1 && Math.abs(yearLength - p.yearLength) < 10 ? '#6ab0f3' : '#27272a',
                  color: Math.abs(axialTilt - p.tilt) < 0.5 && Math.abs(dayLength - p.dayLength) < 1 && Math.abs(yearLength - p.yearLength) < 10 ? '#1a1a1c' : '#a1a1a8',
                  fontSize: '10px',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (!(Math.abs(axialTilt - p.tilt) < 0.5 && Math.abs(dayLength - p.dayLength) < 1 && Math.abs(yearLength - p.yearLength) < 10)) {
                    e.target.style.backgroundColor = 'rgba(106, 176, 243, 0.2)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(Math.abs(axialTilt - p.tilt) < 0.5 && Math.abs(dayLength - p.dayLength) < 1 && Math.abs(yearLength - p.yearLength) < 10)) {
                    e.target.style.backgroundColor = '#27272a';
                  }
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: containerWidth < 600 ? 'column' : 'row',
            gap: '12px'
          }}>
            {/* Axial Tilt */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '11px', color: '#a1a1a8', display: 'block', marginBottom: '4px' }}>
                Axial Tilt: <span style={{ color: '#6ab0f3', fontWeight: 500 }}>{axialTilt.toFixed(1)}°</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={0.1}
                value={axialTilt}
                onChange={(e) => setAxialTilt(parseFloat(e.target.value))}
                aria-label="Axial tilt slider"
                style={{ width: '100%', accentColor: '#6ab0f3', cursor: 'pointer', marginRight: containerWidth < 600 ? '0' : '0' }}
              />
            </div>

            {/* Day Length */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '11px', color: '#a1a1a8', display: 'block', marginBottom: '4px' }}>
                Day Length: <span style={{ color: '#4ade80', fontWeight: 500 }}>{dayLength.toFixed(1)}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={200}
                step={0.1}
                value={dayLength}
                onChange={(e) => setDayLength(parseFloat(e.target.value))}
                aria-label="Day length slider"
                style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer', marginRight: containerWidth < 600 ? '0' : '0' }}
              />
            </div>

            {/* Year Length */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '11px', color: '#a1a1a8', display: 'block', marginBottom: '4px' }}>
                Year Length: <span style={{ color: '#fb923c', fontWeight: 500 }}>{yearLength.toFixed(0)} days</span>
              </label>
              <input
                type="range"
                min={10}
                max={1000}
                step={1}
                value={yearLength}
                onChange={(e) => setYearLength(parseInt(e.target.value))}
                aria-label="Year length slider"
                style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer', marginRight: containerWidth < 600 ? '0' : '0' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '9px', color: '#a1a1a8', marginTop: '8px' }}>
            Tropics: ±{tropicLat.toFixed(0)}° · Arctic: ±{arcticLat.toFixed(0)}°
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
          referenceFrame={referenceFrame}
        />
      </div>

      {/* 3D View Controls and Legend */}
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: '#a1a1a8' }}>
          3D View: Purple marker shows your location. Drag to rotate, scroll to zoom.
        </div>

        <div style={{ display: 'flex', gap: '2px', backgroundColor: '#27272a', padding: '2px', borderRadius: '5px' }} role="group" aria-label="Reference frame">
          {['sun-fixed', 'earth-fixed'].map(mode => (
            <button
              key={mode}
              onClick={() => setReferenceFrame(mode)}
              aria-pressed={referenceFrame === mode}
              aria-label={mode === 'sun-fixed' ? 'Sun fixed, Earth rotates (heliocentric)' : 'Earth fixed, Sun moves (geocentric)'}
              title={mode === 'sun-fixed' ? 'Sun stays still, Earth rotates (what actually happens)' : 'Earth stays still, Sun moves (what we observe)'}
              onMouseOver={(e) => {
                if (referenceFrame !== mode) e.target.style.backgroundColor = 'rgba(244, 208, 63, 0.2)';
              }}
              onMouseOut={(e) => {
                if (referenceFrame !== mode) e.target.style.backgroundColor = 'transparent';
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                backgroundColor: referenceFrame === mode ? '#f4d03f' : 'transparent',
                color: referenceFrame === mode ? '#1a1a1c' : '#a1a1a8',
                transition: 'all 0.15s ease',
              }}
            >
              {mode === 'sun-fixed' ? '☀️ Fixed' : '🌍 Fixed'}
            </button>
          ))}
        </div>
      </div>

      {/* Learn Panel (Left Side) */}
      <LearnPanel
        isOpen={learnPanelOpen}
        onToggle={() => setLearnPanelOpen(!learnPanelOpen)}
        showToggleButton={false}
        onAppControl={(settings) => {
          // Handle app control from lessons
          if (settings.latitude !== undefined) setLatitude(settings.latitude);
          if (settings.viewMode) setViewMode(settings.viewMode);
          if (settings.axialTilt !== undefined) setAxialTilt(settings.axialTilt);
          // Add more controls as needed
        }}
      />

      {/* Challenge Panel (Right Side) */}
      <ChallengePanel
        isOpen={challengePanelOpen}
        onToggle={() => setChallengePanelOpen(!challengePanelOpen)}
        showToggleButton={false}
      />
    </div>
  );
};

export default SunPositionViz;