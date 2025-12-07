import { useState, useMemo, useRef, useEffect } from 'react';
import ParticleSimulation from './components/ParticleSimulation.jsx';
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
  STEFAN_BOLTZMANN: 5.670374419e-8, // Stefan-Boltzmann constant (W m^-2 K^-4)
  BOLTZMANN: 1.380649e-23, // Boltzmann constant (J/K)
  PROTON_MASS: 1.67262192e-27 // Proton mass (kg)
};

/**
 * Fusion temperature thresholds (in Kelvin)
 */
const FUSION_TEMP_THRESHOLDS = {
  DEUTERIUM: 1e6,      // 1 million K - deuterium fusion begins
  HYDROGEN_PP: 4e6,    // 4 million K - proton-proton chain
  HYDROGEN_CNO: 15e6,  // 15 million K - CNO cycle dominant
  CARBON: 5e8          // 500 million K - carbon fusion
};

/**
 * Mass thresholds (in solar masses)
 */
const MASS_THRESHOLDS = [
  { name: 'Hydrostatic Equilibrium', value: 2.5e-10, color: '#4ade80', description: 'Minimum mass for spherical shape (~Ceres)' },
  { name: 'Deuterium Fusion', value: 0.013, color: '#fb923c', description: 'Brown dwarf boundary' },
  { name: 'Hydrogen Fusion', value: 0.08, color: '#f4d03f', description: 'Main sequence stars begin' },
  { name: 'Carbon Fusion', value: 8, color: '#ef4444', description: 'Massive star threshold' },
  { name: 'Chandrasekhar Limit', value: 1.4, color: '#60a5fa', description: 'White dwarf maximum mass' },
  { name: 'Tolman-Oppenheimer-Volkoff Limit', value: 2.16, color: '#a78bfa', description: 'Neutron star maximum' },
  { name: 'Black Hole Formation', value: 2.5, color: '#000000', description: 'Inevitable collapse' }
];

// Extract key threshold values for easy reference
const HYDROSTATIC_EQUILIBRIUM_MASS = MASS_THRESHOLDS[0].value; // 2.5e-10 M☉ (~Ceres)
const DEUTERIUM_FUSION_MASS = MASS_THRESHOLDS[1].value; // 0.013 M☉
const HYDROGEN_FUSION_MASS = MASS_THRESHOLDS[2].value; // 0.08 M☉
const CARBON_FUSION_MASS = MASS_THRESHOLDS[3].value; // 8 M☉

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

  if (mass < HYDROSTATIC_EQUILIBRIUM_MASS) {
    // Below hydrostatic equilibrium - irregular shape
    return { min: 1000, max: 100000, realistic: 10000 };
  } else if (mass < DEUTERIUM_FUSION_MASS) {
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
 * Calculate core temperature using virial theorem
 * T_core ≈ (G × M × m_p) / (k_B × R)
 * @param {number} mass - Mass in solar masses
 * @param {number} radius - Radius in km
 * @returns {number} Core temperature in Kelvin
 */
function calculateCoreTemperature(mass, radius) {
  const massKg = mass * CONSTANTS.SOLAR_MASS_KG;
  const radiusM = radius * 1000; // Convert km to m

  // Virial theorem approximation: T_core ≈ (G × M × m_p) / (k_B × R)
  // This is simplified but captures the mass/radius dependence
  const T_core = (CONSTANTS.G * massKg * CONSTANTS.PROTON_MASS) /
                 (CONSTANTS.BOLTZMANN * radiusM);

  return T_core;
}

/**
 * Determine fusion state based on core temperature
 * @param {number} coreTemp - Core temperature in Kelvin
 * @returns {string} Fusion state: 'none', 'deuterium', 'hydrogen', or 'carbon'
 */
function getFusionState(coreTemp) {
  if (coreTemp < FUSION_TEMP_THRESHOLDS.DEUTERIUM) return 'none';
  if (coreTemp < FUSION_TEMP_THRESHOLDS.HYDROGEN_PP) return 'deuterium';
  if (coreTemp < FUSION_TEMP_THRESHOLDS.CARBON) return 'hydrogen';
  return 'carbon';
}

/**
 * Calculate mass needed to reach a given temperature at specified radius
 * Inverse of calculateCoreTemperature: M = (T × k_B × R) / (G × m_p)
 * @param {number} temperature - Target temperature in Kelvin
 * @param {number} radius - Radius in km
 * @returns {number} Mass in solar masses
 */
function massForTemperature(temperature, radius) {
  const radiusM = radius * 1000; // Convert km to m
  const massKg = (temperature * CONSTANTS.BOLTZMANN * radiusM) /
                 (CONSTANTS.G * CONSTANTS.PROTON_MASS);
  return massKg / CONSTANTS.SOLAR_MASS_KG;
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

  // Panel states
  const [learnPanelOpen, setLearnPanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);

  const containerRef = useRef(null);

  // Calculate actual mass from log scale
  const mass = useMemo(() => Math.pow(10, logMass), [logMass]);

  // Determine object type based on mass
  const objectType = useMemo(() => {
    if (mass < HYDROSTATIC_EQUILIBRIUM_MASS) return 'Diffuse Cloud / Irregular Object';
    if (mass < DEUTERIUM_FUSION_MASS) return 'Planet (Rocky or Gas Giant)';
    if (mass < HYDROGEN_FUSION_MASS) return 'Brown Dwarf';
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

  const coreTemp = useMemo(() => calculateCoreTemperature(mass, radius || radiusRange.realistic),
    [mass, radius, radiusRange.realistic]);

  const fusionState = useMemo(() => getFusionState(coreTemp), [coreTemp]);

  // Calculate dynamic fusion thresholds based on current radius
  const dynamicThresholds = useMemo(() => {
    const currentRadius = radius || radiusRange.realistic;
    return [
      {
        name: 'Hydrostatic Equilibrium',
        value: HYDROSTATIC_EQUILIBRIUM_MASS,
        color: '#4ade80',
        description: 'Minimum mass for spherical shape (~Ceres)',
        isFixed: true // This threshold doesn't depend on radius
      },
      {
        name: 'Deuterium Fusion',
        value: massForTemperature(FUSION_TEMP_THRESHOLDS.DEUTERIUM, currentRadius),
        color: '#fb923c',
        description: `Brown dwarf boundary (at current radius)`,
        isFixed: false
      },
      {
        name: 'Hydrogen Fusion',
        value: massForTemperature(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP, currentRadius),
        color: '#f4d03f',
        description: `Main sequence stars begin (at current radius)`,
        isFixed: false
      },
      {
        name: 'Carbon Fusion',
        value: massForTemperature(FUSION_TEMP_THRESHOLDS.CARBON, currentRadius),
        color: '#ef4444',
        description: `Massive star threshold (at current radius)`,
        isFixed: false
      }
    ].filter(t => t.value >= 1e-10 && t.value <= 100); // Only show thresholds in visible range
  }, [radius, radiusRange.realistic]);

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
  const chartHeight = 300;
  const chartPadding = { top: 20, right: 20, bottom: 50, left: 80 };
  const chartWidth = containerWidth - chartPadding.left - chartPadding.right;
  const chartInnerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Log scale for X-axis (mass: 10^-10 to 10^2)
  const minLogMass = -10;
  const maxLogMass = 2;
  const logMassRange = maxLogMass - minLogMass;

  // Log scale for Y-axis (temperature: 10^4 to 10^9 K)
  const minLogTemp = 4;
  const maxLogTemp = 9;
  const logTempRange = maxLogTemp - minLogTemp;

  // Convert log mass to X position
  const massToX = (logMassValue) => {
    return ((logMassValue - minLogMass) / logMassRange) * chartWidth;
  };

  // Convert log temperature to Y position (inverted: high temp at top)
  const tempToY = (logTempValue) => {
    return chartInnerHeight - ((logTempValue - minLogTemp) / logTempRange) * chartInnerHeight;
  };

  // Generate X-axis tick marks (powers of 10)
  const xTicks = [];
  for (let i = minLogMass; i <= maxLogMass; i += 2) {
    xTicks.push({
      logValue: i,
      x: massToX(i),
      label: i === 0 ? '1 M☉' : `10${i >= 0 ? '⁺' : ''}${Math.abs(i)}`
    });
  }

  // Generate Y-axis tick marks (powers of 10)
  const yTicks = [];
  for (let i = minLogTemp; i <= maxLogTemp; i++) {
    yTicks.push({
      logValue: i,
      y: tempToY(i),
      label: `10${i >= 0 ? '' : '⁻'}${Math.abs(i)} K`
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

        {/* Mass-Temperature Diagram */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', textAlign: 'center' }}>
            Mass-Temperature Diagram
          </h2>
          <svg
            width={containerWidth}
            height={chartHeight}
            style={{ backgroundColor: '#252528', borderRadius: '8px' }}
          >
            <g transform={`translate(${chartPadding.left}, ${chartPadding.top})`}>
              {/* Horizontal temperature bands for fusion states */}
              {/* No fusion: below 10^6 K */}
              <rect
                x={0}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM))}
                width={chartWidth}
                height={tempToY(minLogTemp) - tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM))}
                fill="#8a8a9c"
                opacity={0.15}
              />
              {/* Deuterium fusion: 10^6 to 4×10^6 K */}
              <rect
                x={0}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP))}
                width={chartWidth}
                height={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM)) - tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP))}
                fill="#fb923c"
                opacity={0.15}
              />
              {/* Hydrogen fusion: 4×10^6 to 5×10^8 K */}
              <rect
                x={0}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON))}
                width={chartWidth}
                height={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP)) - tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON))}
                fill="#f4d03f"
                opacity={0.15}
              />
              {/* Carbon fusion: above 5×10^8 K */}
              <rect
                x={0}
                y={0}
                width={chartWidth}
                height={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON))}
                fill="#ef4444"
                opacity={0.15}
              />

              {/* Horizontal threshold lines */}
              <line
                x1={0}
                x2={chartWidth}
                y1={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM))}
                y2={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM))}
                stroke="#fb923c"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text
                x={5}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.DEUTERIUM)) - 5}
                fill="#fb923c"
                fontSize="10"
                fontWeight="bold"
              >
                Deuterium Fusion
              </text>

              <line
                x1={0}
                x2={chartWidth}
                y1={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP))}
                y2={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP))}
                stroke="#f4d03f"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text
                x={5}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.HYDROGEN_PP)) - 5}
                fill="#f4d03f"
                fontSize="10"
                fontWeight="bold"
              >
                Hydrogen Fusion
              </text>

              <line
                x1={0}
                x2={chartWidth}
                y1={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON))}
                y2={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON))}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text
                x={5}
                y={tempToY(Math.log10(FUSION_TEMP_THRESHOLDS.CARBON)) - 5}
                fill="#ef4444"
                fontSize="10"
                fontWeight="bold"
              >
                Carbon Fusion
              </text>

              {/* Dynamic vertical threshold lines */}
              {dynamicThresholds.map((threshold, index) => {
                const x = massToX(Math.log10(threshold.value));
                return (
                  <g key={`vthreshold-${index}`}>
                    <title>{threshold.name}: {threshold.description}</title>
                    <line
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={chartInnerHeight}
                      stroke={threshold.color}
                      strokeWidth={2}
                      strokeDasharray={threshold.isFixed ? "5,5" : "10,5"}
                      style={{
                        transition: 'all 0.5s ease-in-out'
                      }}
                    />
                    <text
                      x={x + (index % 2 === 0 ? 5 : -5)}
                      y={chartInnerHeight - 10}
                      fill={threshold.color}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor={index % 2 === 0 ? "start" : "end"}
                      style={{
                        transition: 'all 0.5s ease-in-out'
                      }}
                    >
                      {threshold.name.split(' ')[0]}{!threshold.isFixed && ' ⚡'}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis grid lines */}
              {yTicks.map((tick, index) => (
                <line
                  key={`ygrid-${index}`}
                  x1={0}
                  x2={chartWidth}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="#393941"
                  strokeWidth={1}
                  opacity={0.3}
                />
              ))}

              {/* X-axis grid lines */}
              {xTicks.map((tick, index) => (
                <line
                  key={`xgrid-${index}`}
                  x1={tick.x}
                  x2={tick.x}
                  y1={0}
                  y2={chartInnerHeight}
                  stroke="#393941"
                  strokeWidth={1}
                  opacity={0.3}
                />
              ))}

              {/* Current position marker */}
              <circle
                cx={massToX(logMass)}
                cy={tempToY(Math.log10(coreTemp))}
                r={12}
                fill="#8c7ae6"
                stroke="#fff"
                strokeWidth={3}
                style={{
                  transition: 'all 0.3s ease-in-out'
                }}
              />
              <circle
                cx={massToX(logMass)}
                cy={tempToY(Math.log10(coreTemp))}
                r={20}
                fill="none"
                stroke="#8c7ae6"
                strokeWidth={2}
                opacity={0.5}
                style={{
                  transition: 'all 0.3s ease-in-out'
                }}
              />

              {/* Axes */}
              <line
                x1={0}
                x2={chartWidth}
                y1={chartInnerHeight}
                y2={chartInnerHeight}
                stroke="#e9e9ea"
                strokeWidth={2}
              />
              <line
                x1={0}
                x2={0}
                y1={0}
                y2={chartInnerHeight}
                stroke="#e9e9ea"
                strokeWidth={2}
              />

              {/* X-axis ticks and labels */}
              {xTicks.map((tick, index) => (
                <g key={`xtick-${index}`}>
                  <line
                    x1={tick.x}
                    x2={tick.x}
                    y1={chartInnerHeight}
                    y2={chartInnerHeight + 5}
                    stroke="#e9e9ea"
                    strokeWidth={2}
                  />
                  <text
                    x={tick.x}
                    y={chartInnerHeight + 20}
                    textAnchor="middle"
                    fill="#a1a1a8"
                    fontSize="11"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Y-axis ticks and labels */}
              {yTicks.map((tick, index) => (
                <g key={`ytick-${index}`}>
                  <line
                    x1={-5}
                    x2={0}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#e9e9ea"
                    strokeWidth={2}
                  />
                  <text
                    x={-10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="#a1a1a8"
                    fontSize="11"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Axis labels */}
              <text
                x={chartWidth / 2}
                y={chartInnerHeight + 45}
                textAnchor="middle"
                fill="#e9e9ea"
                fontSize="13"
                fontWeight="bold"
              >
                Mass (M☉)
              </text>
              <text
                x={-chartInnerHeight / 2}
                y={-55}
                textAnchor="middle"
                fill="#e9e9ea"
                fontSize="13"
                fontWeight="bold"
                transform={`rotate(-90, -${chartInnerHeight / 2}, -55)`}
              >
                Core Temperature (K)
              </text>
            </g>
          </svg>
        </div>

        {/* Main Layout: Particle Simulation + Stats Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: containerWidth > 768 ? '1fr 300px' : '1fr',
          gap: '20px',
          marginBottom: '20px',
          minHeight: '600px'
        }}>
          {/* Particle Simulation */}
          <div style={{
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <ParticleSimulation
              mass={mass}
              radius={radius || radiusRange.realistic}
              objectType={objectType}
              fusionState={fusionState}
            />
          </div>

          {/* Stats Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Mass
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#f4d03f' }}>
                {formatMass(mass)}
              </div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#252528',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                Object Type
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#8c7ae6' }}>
                {objectType}
              </div>
            </div>

            {mass >= HYDROSTATIC_EQUILIBRIUM_MASS && radius && (
              <div style={{
                padding: '20px',
                backgroundColor: '#252528',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                  Radius
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>
                  {formatRadius(radius)}
                </div>
              </div>
            )}

            {luminosity > 0 && (
              <>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#252528',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                    Temperature
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {surfaceTemp.toExponential(2)} K
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: '#252528',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#a1a1a8', marginBottom: '5px' }}>
                    Luminosity
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f4d03f' }}>
                    {luminosity.toExponential(2)} L☉
                  </div>
                </div>
              </>
            )}
          </div>
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
            min={minLogMass}
            max={maxLogMass}
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
        {mass >= HYDROSTATIC_EQUILIBRIUM_MASS && radius !== null && (
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


        {/* Preset Buttons */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '15px', textAlign: 'center' }}>
            Quick Presets
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {[
              { name: 'Earth', value: 3e-6 },
              { name: 'Jupiter', value: 0.001 },
              { name: 'Sun', value: 1.0 },
              { name: 'Neutron Star', value: 1.5 }
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.value)}
                style={{
                  padding: '15px 25px',
                  backgroundColor: Math.abs(Math.log10(preset.value) - logMass) < 0.1
                    ? '#8c7ae6'
                    : '#393941',
                  color: '#e9e9ea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1rem',
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
                {preset.name}
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
