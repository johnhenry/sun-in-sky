import { useState, useMemo, useRef, useEffect } from 'react';
import MassVisualization from './MassVisualization.jsx';
import ParticleSimulation from './components/ParticleSimulation.jsx';
import InternalStructure from './components/InternalStructure.jsx';
import SpacetimeCurvature from './components/SpacetimeCurvature.jsx';
import TidalForce from './components/TidalForce.jsx';
import DensityProfile from './components/DensityProfile.jsx';
import LearnPanel from '../../shared/components/LearnPanel/LearnPanel.jsx';
import ChallengePanel from '../../shared/components/ChallengePanel/ChallengePanel.jsx';
import { initializeStorage } from '../../shared/utils/localStorage.js';

// Import lesson data
import elementaryData from './data/lessons/elementary.json';
import middleSchoolData from './data/lessons/middle-school.json';
import highSchoolData from './data/lessons/high-school.json';

// Import quiz data
import elementaryQuiz from './data/lessons/elementary-quiz.json';
import middleSchoolQuiz from './data/lessons/middle-school-quiz.json';
import highSchoolQuiz from './data/lessons/high-school-quiz.json';

// Merge all lessons into a single array
const ALL_LESSONS = [
  ...elementaryData.lessons.map((lesson, index) => ({
    ...lesson,
    number: index + 1,
    difficulty: 'Beginner'
  })),
  ...middleSchoolData.lessons.map((lesson, index) => ({
    ...lesson,
    number: elementaryData.lessons.length + index + 1,
    difficulty: 'Intermediate'
  })),
  ...highSchoolData.lessons.map((lesson, index) => ({
    ...lesson,
    number: elementaryData.lessons.length + middleSchoolData.lessons.length + index + 1,
    difficulty: 'Advanced'
  }))
];

// Merge all quiz questions
const ALL_QUESTIONS = [
  ...(elementaryQuiz?.questions || []),
  ...(middleSchoolQuiz?.questions || []),
  ...(highSchoolQuiz?.questions || [])
];

/**
 * Physical constants and conversion factors
 */
const CONSTANTS = {
  SOLAR_MASS_KG: 1.989e30,
  EARTH_MASS_KG: 5.972e24,
  SOLAR_RADIUS_KM: 696000,
  EARTH_RADIUS_KM: 6371,
  G: 6.674e-11, // Gravitational constant (m^3 kg^-1 s^-2)
  C: 299792458, // Speed of light (m/s)
  STEFAN_BOLTZMANN: 5.670374419e-8 // Stefan-Boltzmann constant (W m^-2 K^-4)
};

/**
 * Mass thresholds (in solar masses)
 */
const MASS_THRESHOLDS = [
  { name: 'Hydrostatic Equilibrium', value: 0.001, color: '#4ade80', description: 'Minimum mass for spherical shape' },
  { name: 'Deuterium Fusion', value: 0.013, color: '#fb923c', description: 'Brown dwarf boundary' },
  { name: 'Hydrogen Fusion', value: 0.08, color: '#f4d03f', description: 'Main sequence stars begin' },
  { name: 'Carbon Fusion', value: 8, color: '#ef4444', description: 'Massive star threshold' },
  { name: 'Chandrasekhar Limit', value: 1.4, color: '#60a5fa', description: 'White dwarf maximum mass' },
  { name: 'Tolman-Oppenheimer-Volkoff Limit', value: 2.16, color: '#a78bfa', description: 'Neutron star maximum' },
  { name: 'Black Hole Formation', value: 2.5, color: '#000000', description: 'Inevitable collapse' }
];

/**
 * Preset masses (in solar masses)
 */
const MASS_PRESETS = [
  { name: 'Earth', value: 3e-6, description: 'Rocky planet' },
  { name: 'Jupiter', value: 0.001, description: 'Gas giant' },
  { name: 'Brown Dwarf', value: 0.05, description: 'Failed star' },
  { name: 'Red Dwarf', value: 0.2, description: 'Most common star' },
  { name: 'Sun', value: 1.0, description: 'Our star' },
  { name: 'Sirius', value: 2.1, description: 'Brightest star' },
  { name: 'Betelgeuse', value: 20, description: 'Red supergiant' },
  { name: 'White Dwarf', value: 0.6, description: 'Stellar remnant' },
  { name: 'Neutron Star', value: 1.5, description: 'Compact remnant' },
  { name: 'Black Hole', value: 10, description: 'Collapsed star' }
];

/**
 * Calculate realistic radius ranges based on object type
 * @param {number} mass - Mass in solar masses
 * @param {string} objectType - Type of object
 * @returns {Object} Min, max, and realistic radius in km
 */
function getRadiusRange(mass, objectType) {
  const massKg = mass * CONSTANTS.SOLAR_MASS_KG;

  if (mass < 0.001) {
    // Below hydrostatic equilibrium - irregular shape
    return { min: 1000, max: 100000, realistic: 10000 };
  } else if (mass < 0.013) {
    // Gas giant / sub-brown dwarf: roughly Jupiter-sized
    return { min: 60000, max: 90000, realistic: 71000 };
  } else if (mass < 0.08) {
    // Brown dwarf: slightly larger than Jupiter
    return { min: 70000, max: 100000, realistic: 80000 };
  } else if (mass < 0.45) {
    // Red dwarf: 0.1-0.6 solar radii
    const r = CONSTANTS.SOLAR_RADIUS_KM * (0.1 + mass * 0.5);
    return { min: r * 0.8, max: r * 1.2, realistic: r };
  } else if (mass < 8) {
    // Main sequence: rough M-R relationship
    const r = CONSTANTS.SOLAR_RADIUS_KM * Math.pow(mass, 0.57);
    return { min: r * 0.8, max: r * 1.5, realistic: r };
  } else if (mass < 100) {
    // Massive stars and supergiants
    const r = CONSTANTS.SOLAR_RADIUS_KM * Math.pow(mass, 0.5) * 5;
    return { min: r * 0.5, max: r * 2, realistic: r };
  } else {
    // Stellar remnants
    if (objectType.includes('White Dwarf')) {
      return { min: 3000, max: 15000, realistic: CONSTANTS.EARTH_RADIUS_KM };
    } else if (objectType.includes('Neutron Star')) {
      return { min: 10, max: 15, realistic: 12 };
    } else {
      // Black hole: Schwarzschild radius
      const rs = (2 * CONSTANTS.G * massKg) / (CONSTANTS.C * CONSTANTS.C) / 1000;
      return { min: rs, max: rs, realistic: rs };
    }
  }
}

/**
 * Calculate luminosity using mass-luminosity relationship
 * @param {number} mass - Mass in solar masses
 * @param {number} radius - Radius in km
 * @param {string} objectType - Type of object
 * @returns {number} Luminosity in solar luminosities
 */
function calculateLuminosity(mass, radius, objectType) {
  if (mass < 0.08) return 0; // No fusion
  if (mass < 0.45) {
    return Math.pow(mass, 2.3); // Low mass stars
  } else if (mass < 2) {
    return Math.pow(mass, 4); // Sun-like stars
  } else if (mass < 55) {
    return Math.pow(mass, 3.5); // Massive stars
  } else {
    return Math.pow(mass, 2.5); // Very massive stars
  }
}

/**
 * Calculate surface temperature from luminosity and radius
 * @param {number} luminosity - Luminosity in solar luminosities
 * @param {number} radius - Radius in km
 * @returns {number} Surface temperature in Kelvin
 */
function calculateSurfaceTemperature(luminosity, radius) {
  if (luminosity === 0) return 300; // Cold object
  const luminosityWatts = luminosity * 3.828e26;
  const radiusM = radius * 1000;
  const surfaceArea = 4 * Math.PI * radiusM * radiusM;
  return Math.pow(luminosityWatts / (surfaceArea * CONSTANTS.STEFAN_BOLTZMANN), 0.25);
}

/**
 * Estimate core temperature
 * @param {number} mass - Mass in solar masses
 * @param {string} objectType - Type of object
 * @returns {number} Core temperature in Kelvin
 */
function estimateCoreTemperature(mass, objectType) {
  if (mass < 0.013) return 1e6; // No fusion, but gravitational heating
  if (mass < 0.08) return 3e6; // Deuterium burning
  if (mass < 1.5) return 1.5e7 * mass; // Hydrogen burning
  if (mass < 8) return 2e7 * Math.sqrt(mass); // CNO cycle dominant
  return 5e7 * Math.sqrt(mass); // Massive stars
}

/**
 * Calculate escape velocity
 * @param {number} mass - Mass in solar masses
 * @param {number} radius - Radius in km
 * @returns {number} Escape velocity in km/s
 */
function calculateEscapeVelocity(mass, radius) {
  const massKg = mass * CONSTANTS.SOLAR_MASS_KG;
  const radiusM = radius * 1000;
  return Math.sqrt(2 * CONSTANTS.G * massKg / radiusM) / 1000;
}

/**
 * Calculate surface gravity
 * @param {number} mass - Mass in solar masses
 * @param {number} radius - Radius in km
 * @returns {number} Surface gravity in m/s^2
 */
function calculateSurfaceGravity(mass, radius) {
  const massKg = mass * CONSTANTS.SOLAR_MASS_KG;
  const radiusM = radius * 1000;
  return (CONSTANTS.G * massKg) / (radiusM * radiusM);
}

/**
 * Estimate stellar lifetime
 * @param {number} mass - Mass in solar masses
 * @param {number} luminosity - Luminosity in solar luminosities
 * @returns {string} Lifetime estimate
 */
function estimateLifetime(mass, luminosity) {
  if (luminosity === 0) return 'Indefinite (no fusion)';
  const lifetimeYears = (mass / luminosity) * 1e10; // Rough estimate
  if (lifetimeYears > 1e12) return `${(lifetimeYears / 1e12).toFixed(1)} trillion years`;
  if (lifetimeYears > 1e9) return `${(lifetimeYears / 1e9).toFixed(1)} billion years`;
  if (lifetimeYears > 1e6) return `${(lifetimeYears / 1e6).toFixed(1)} million years`;
  return `${(lifetimeYears / 1e3).toFixed(0)} thousand years`;
}

export default function StellarMassApp() {
  // Core state
  const [logMass, setLogMass] = useState(0); // log10(1.0) = 0 (Sun)
  const [radius, setRadius] = useState(null); // Will be set to realistic default
  const [containerWidth, setContainerWidth] = useState(800);

  // View state
  const [viewMode, setViewMode] = useState('mass-scale'); // 'mass-scale', 'internal-structure', 'spacetime', 'tidal-forces', 'density-profile', 'particle-sim'
  const [showComparison, setShowComparison] = useState(false);
  const [yAxisMode, setYAxisMode] = useState('dynamic');

  // Panel states
  const [learnPanelOpen, setLearnPanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);

  // 3D visualization loading state
  const [vizLoading, setVizLoading] = useState(true);

  const containerRef = useRef(null);

  // Calculate actual mass from log scale
  const mass = useMemo(() => Math.pow(10, logMass), [logMass]);

  // Determine object type based on mass
  const objectType = useMemo(() => {
    if (mass < 0.001) return 'Sub-planetary Object';
    if (mass < 0.013) return 'Gas Giant Planet';
    if (mass < 0.08) return 'Brown Dwarf';
    if (mass < 0.45) return 'Red Dwarf Star';
    if (mass < 2) return 'Sun-like Star';
    if (mass < 8) return 'Massive Star';
    if (mass < 1.4) return 'White Dwarf';
    if (mass < 2.16) return 'Neutron Star';
    return 'Black Hole';
  }, [mass]);

  // Get radius range for current mass
  const radiusRange = useMemo(() => getRadiusRange(mass, objectType), [mass, objectType]);

  // Set realistic radius if not set or out of range
  useEffect(() => {
    if (radius === null || radius < radiusRange.min || radius > radiusRange.max) {
      setRadius(radiusRange.realistic);
    }
  }, [radiusRange, radius]);

  // Calculate physical properties
  const luminosity = useMemo(() => calculateLuminosity(mass, radius || radiusRange.realistic, objectType),
    [mass, radius, radiusRange.realistic, objectType]);

  const surfaceTemp = useMemo(() => calculateSurfaceTemperature(luminosity, radius || radiusRange.realistic),
    [luminosity, radius, radiusRange.realistic]);

  const coreTemp = useMemo(() => estimateCoreTemperature(mass, objectType), [mass, objectType]);

  const escapeVelocity = useMemo(() => calculateEscapeVelocity(mass, radius || radiusRange.realistic),
    [mass, radius, radiusRange.realistic]);

  const surfaceGravity = useMemo(() => calculateSurfaceGravity(mass, radius || radiusRange.realistic),
    [mass, radius, radiusRange.realistic]);

  const lifetime = useMemo(() => estimateLifetime(mass, luminosity), [mass, luminosity]);

  // Initialize localStorage on mount
  useEffect(() => {
    initializeStorage('stellar-mass');
  }, []);

  // Update container width on resize
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

  // Format mass for display
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

  // Format radius for display
  const formatRadius = (radiusKm) => {
    if (radiusKm < 100) {
      return `${radiusKm.toFixed(2)} km`;
    } else if (radiusKm < 100000) {
      return `${radiusKm.toFixed(0)} km (${(radiusKm / CONSTANTS.EARTH_RADIUS_KM).toFixed(2)} R⊕)`;
    } else {
      return `${(radiusKm / CONSTANTS.SOLAR_RADIUS_KM).toFixed(2)} R☉`;
    }
  };

  // Handle preset button clicks
  const handlePresetClick = (presetValue) => {
    setLogMass(Math.log10(presetValue));
  };

  // Chart dimensions
  const chartHeight = 150;
  const chartPadding = { top: 30, right: 20, bottom: 40, left: 20 };
  const chartWidth = containerWidth - chartPadding.left - chartPadding.right;

  // Log scale for X-axis (10^-10 to 10^2)
  const minLog = -10;
  const maxLog = 2;
  const logRange = maxLog - minLog;

  // Convert log mass to X position
  const massToX = (logMassValue) => {
    return ((logMassValue - minLog) / logRange) * chartWidth;
  };

  // Generate X-axis tick marks (powers of 10)
  const xTicks = [];
  for (let i = minLog; i <= maxLog; i += 2) {
    xTicks.push({
      logValue: i,
      x: massToX(i),
      label: i === 0 ? '1 M☉' : `10${i >= 0 ? '⁺' : ''}${Math.abs(i)}`
    });
  }

  return (
    <div className="app-container" style={{
      backgroundColor: '#1a1a1c',
      color: '#e9e9ea',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="content-wrapper" ref={containerRef}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#f4d03f' }}>
            Stellar Mass Explorer
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#a1a1a8' }}>
            Explore the mass spectrum from planets to black holes
          </p>
        </header>

        {/* Enhanced Mass Scale */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>
            Logarithmic Mass Scale
          </h2>
          <svg
            width={containerWidth}
            height={chartHeight}
            style={{ backgroundColor: '#252528', borderRadius: '8px' }}
          >
            <g transform={`translate(${chartPadding.left}, ${chartPadding.top})`}>
              {/* Background regions between thresholds */}
              {MASS_THRESHOLDS.map((threshold, index) => {
                if (index === MASS_THRESHOLDS.length - 1) return null;
                const x1 = massToX(Math.log10(threshold.value));
                const x2 = index < MASS_THRESHOLDS.length - 1
                  ? massToX(Math.log10(MASS_THRESHOLDS[index + 1].value))
                  : chartWidth;
                return (
                  <rect
                    key={`region-${index}`}
                    x={x1}
                    y={0}
                    width={x2 - x1}
                    height={chartHeight - chartPadding.top - chartPadding.bottom}
                    fill={threshold.color}
                    opacity={0.1}
                  />
                );
              })}

              {/* Main axis line */}
              <line
                x1={0}
                y1={(chartHeight - chartPadding.top - chartPadding.bottom) / 2}
                x2={chartWidth}
                y2={(chartHeight - chartPadding.top - chartPadding.bottom) / 2}
                stroke="#393941"
                strokeWidth={4}
              />

              {/* Threshold markers */}
              {MASS_THRESHOLDS.map((threshold, index) => {
                const x = massToX(Math.log10(threshold.value));
                const y = (chartHeight - chartPadding.top - chartPadding.bottom) / 2;

                return (
                  <g key={index}>
                    <line
                      x1={x}
                      y1={y - 15}
                      x2={x}
                      y2={y + 15}
                      stroke={threshold.color}
                      strokeWidth={3}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={threshold.color}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                    <text
                      x={x}
                      y={y - 25}
                      textAnchor="middle"
                      fill={threshold.color}
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {threshold.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Current mass indicator */}
              <g>
                <line
                  x1={massToX(logMass)}
                  y1={0}
                  x2={massToX(logMass)}
                  y2={chartHeight - chartPadding.top - chartPadding.bottom}
                  stroke="#8c7ae6"
                  strokeWidth={4}
                />
                <circle
                  cx={massToX(logMass)}
                  cy={(chartHeight - chartPadding.top - chartPadding.bottom) / 2}
                  r={10}
                  fill="#8c7ae6"
                  stroke="#fff"
                  strokeWidth={3}
                />
              </g>

              {/* X-axis ticks and labels */}
              {xTicks.map((tick, index) => (
                <text
                  key={index}
                  x={tick.x}
                  y={chartHeight - chartPadding.top - chartPadding.bottom + 25}
                  textAnchor="middle"
                  fill="#a1a1a8"
                  fontSize="11"
                >
                  {tick.label}
                </text>
              ))}
            </g>
          </svg>
        </div>

        {/* Current Mass and Type Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#252528',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
              Mass
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f4d03f' }}>
              {formatMass(mass)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#252528',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
              Object Type
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8c7ae6' }}>
              {objectType}
            </div>
          </div>

          {mass >= 0.001 && radius && (
            <div style={{
              padding: '20px',
              backgroundColor: '#252528',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Radius
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ade80' }}>
                {formatRadius(radius)}
              </div>
            </div>
          )}
        </div>

        {/* Mass Slider */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            Mass (Logarithmic Scale)
          </label>
          <input
            type="range"
            min={minLog}
            max={maxLog}
            step={0.05}
            value={logMass}
            onChange={(e) => setLogMass(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              cursor: 'pointer',
              accentColor: '#8c7ae6'
            }}
          />
        </div>

        {/* Radius Slider (only for objects with hydrostatic equilibrium) */}
        {mass >= 0.001 && radius !== null && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              Radius: {formatRadius(radius)}
            </label>
            <input
              type="range"
              min={radiusRange.min}
              max={radiusRange.max}
              step={(radiusRange.max - radiusRange.min) / 100}
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                cursor: 'pointer',
                accentColor: '#4ade80'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '10px',
              gap: '10px'
            }}>
              <button
                onClick={() => setRadius(radiusRange.min)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#393941',
                  color: '#e9e9ea',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Min
              </button>
              <button
                onClick={() => setRadius(radiusRange.realistic)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#393941',
                  color: '#e9e9ea',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Realistic
              </button>
              <button
                onClick={() => setRadius(radiusRange.max)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#393941',
                  color: '#e9e9ea',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Max
              </button>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { id: 'mass-scale', label: '3D Visualization', icon: '🌍' },
            { id: 'particle-sim', label: 'Particle Simulation', icon: '✨' },
            { id: 'internal-structure', label: 'Internal Structure', icon: '🎯' },
            { id: 'spacetime', label: 'Spacetime', icon: '🌀' },
            { id: 'tidal-forces', label: 'Tidal Forces', icon: '🌊' },
            { id: 'density-profile', label: 'Density Profile', icon: '📊' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              style={{
                padding: '10px 15px',
                backgroundColor: viewMode === mode.id ? '#8c7ae6' : '#393941',
                color: '#e9e9ea',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>

        {/* Main Visualization Area */}
        <div style={{
          minHeight: '500px',
          marginBottom: '30px',
          backgroundColor: viewMode === 'mass-scale' || viewMode === 'particle-sim' ? '#000' : '#252528',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {viewMode === 'mass-scale' && (
            <>
              {vizLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <div className="loading-spinner" />
                  <p>Loading 3D Visualization...</p>
                </div>
              )}
              <MassVisualization
                mass={mass}
                radius={radius || radiusRange.realistic}
                objectType={objectType}
                onLoad={() => setVizLoading(false)}
                showComparison={showComparison}
              />
            </>
          )}

          {viewMode === 'particle-sim' && (
            <ParticleSimulation
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
            />
          )}

          {viewMode === 'internal-structure' && (
            <InternalStructure
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
            />
          )}

          {viewMode === 'spacetime' && (
            <SpacetimeCurvature
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
            />
          )}

          {viewMode === 'tidal-forces' && (
            <TidalForce
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
            />
          )}

          {viewMode === 'density-profile' && (
            <DensityProfile
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
            />
          )}
        </div>

        {/* Energy Dashboard */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>
            Physical Properties
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Luminosity
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f4d03f' }}>
                {luminosity === 0 ? 'No Fusion' : `${luminosity.toExponential(2)} L☉`}
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Surface Temp
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>
                {surfaceTemp.toExponential(2)} K
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Core Temp
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fb923c' }}>
                {coreTemp.toExponential(2)} K
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Escape Velocity
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#60a5fa' }}>
                {escapeVelocity.toExponential(2)} km/s
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Surface Gravity
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#a78bfa' }}>
                {surfaceGravity.toFixed(2)} m/s²
              </div>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Estimated Lifetime
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>
                {lifetime}
              </div>
            </div>
          </div>
        </div>

        {/* Preset Buttons */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '15px', textAlign: 'center' }}>
            Quick Presets
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {MASS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.value)}
                style={{
                  padding: '15px',
                  backgroundColor: Math.abs(Math.log10(preset.value) - logMass) < 0.1
                    ? '#8c7ae6'
                    : '#393941',
                  color: '#e9e9ea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  if (Math.abs(Math.log10(preset.value) - logMass) >= 0.1) {
                    e.target.style.backgroundColor = '#4a4a52';
                  }
                }}
                onMouseLeave={(e) => {
                  if (Math.abs(Math.log10(preset.value) - logMass) >= 0.1) {
                    e.target.style.backgroundColor = '#393941';
                  }
                }}
              >
                <div>{preset.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#a1a1a8', marginTop: '5px' }}>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel Toggle Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginTop: '30px'
        }}>
          <button
            onClick={() => setLearnPanelOpen(!learnPanelOpen)}
            style={{
              padding: '15px 30px',
              backgroundColor: learnPanelOpen ? '#8c7ae6' : '#393941',
              color: '#e9e9ea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Learn
          </button>
          <button
            onClick={() => setChallengePanelOpen(!challengePanelOpen)}
            style={{
              padding: '15px 30px',
              backgroundColor: challengePanelOpen ? '#8c7ae6' : '#393941',
              color: '#e9e9ea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Challenge
          </button>
        </div>
      </div>

      {/* Panels */}
      <LearnPanel
        isOpen={learnPanelOpen}
        onToggle={() => setLearnPanelOpen(!learnPanelOpen)}
        lessons={ALL_LESSONS}
        appId="stellar-mass"
        showToggleButton={false}
      />

      <ChallengePanel
        isOpen={challengePanelOpen}
        onToggle={() => setChallengePanelOpen(!challengePanelOpen)}
        questions={ALL_QUESTIONS}
        appId="stellar-mass"
        showToggleButton={false}
      />
    </div>
  );
}
