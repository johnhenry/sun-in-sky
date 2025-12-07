import { useState, useMemo, useRef, useEffect } from 'react';
import MassVisualization from './MassVisualization.jsx';
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

// Mass categories and their ranges (in solar masses)
const MASS_CATEGORIES = [
  { name: 'Planets', min: 1e-10, max: 0.013, color: '#60a5fa' },
  { name: 'Brown Dwarfs', min: 0.013, max: 0.08, color: '#fb923c' },
  { name: 'Red Dwarfs', min: 0.08, max: 0.45, color: '#ef4444' },
  { name: 'Sun-like Stars', min: 0.45, max: 8, color: '#f4d03f' },
  { name: 'Massive Stars', min: 8, max: 100, color: '#60a5fa' },
  { name: 'Stellar Remnants', min: 1.4, max: 3, color: '#a78bfa' }
];

// Preset masses (in solar masses)
const MASS_PRESETS = [
  { name: 'Earth', value: 3e-6, description: 'Rocky planet' },
  { name: 'Jupiter', value: 0.001, description: 'Gas giant' },
  { name: 'Brown Dwarf', value: 0.05, description: 'Failed star' },
  { name: 'Red Dwarf', value: 0.2, description: 'Most common star' },
  { name: 'Sun', value: 1.0, description: 'Our star' },
  { name: 'Sirius', value: 2.1, description: 'Brightest star' },
  { name: 'Betelgeuse', value: 20, description: 'Red supergiant' },
  { name: 'Neutron Star', value: 1.5, description: 'Compact remnant' },
  { name: 'Black Hole', value: 10, description: 'Collapsed star' }
];

export default function StellarMassApp() {
  // State for mass (logarithmic scale from 10^-10 to 10^2 solar masses)
  const [logMass, setLogMass] = useState(0); // log10(1.0) = 0 (Sun)
  const [containerWidth, setContainerWidth] = useState(800);

  // Panel states
  const [learnPanelOpen, setLearnPanelOpen] = useState(false);
  const [challengePanelOpen, setChallengePanelOpen] = useState(false);

  // 3D visualization loading state
  const [vizLoading, setVizLoading] = useState(true);

  const containerRef = useRef(null);

  // Calculate actual mass from log scale
  const mass = useMemo(() => Math.pow(10, logMass), [logMass]);

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

  // Determine object type based on mass
  const getObjectType = (massValue) => {
    if (massValue < 0.013) return 'Planet';
    if (massValue < 0.08) return 'Brown Dwarf';
    if (massValue < 0.45) return 'Red Dwarf';
    if (massValue < 8) return 'Sun-like Star';
    if (massValue < 100) return 'Massive Star';
    return 'Stellar Remnant';
  };

  const objectType = useMemo(() => getObjectType(mass), [mass]);

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

  // Handle preset button clicks
  const handlePresetClick = (presetValue) => {
    setLogMass(Math.log10(presetValue));
  };

  // Chart dimensions
  const chartHeight = 400;
  const chartPadding = { top: 40, right: 40, bottom: 60, left: 80 };
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

        {/* 3D Visualization */}
        <div style={{
          height: '500px',
          marginBottom: '30px',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
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
            objectType={objectType}
            onLoad={() => setVizLoading(false)}
          />
        </div>

        {/* Current Mass Display */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: '#252528',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '1.2rem', color: '#a1a1a8', marginBottom: '10px' }}>
            Current Mass
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f4d03f' }}>
            {formatMass(mass)}
          </div>
          <div style={{ fontSize: '1.5rem', color: '#8c7ae6', marginTop: '10px' }}>
            {objectType}
          </div>
        </div>

        {/* Mass Slider */}
        <div style={{ marginBottom: '30px' }}>
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
            step={0.1}
            value={logMass}
            onChange={(e) => setLogMass(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              cursor: 'pointer',
              accentColor: '#8c7ae6'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: '#a1a1a8',
            marginTop: '5px'
          }}>
            <span>10⁻¹⁰ M☉</span>
            <span>10² M☉</span>
          </div>
        </div>

        {/* Mass Category Chart */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
            Mass Categories
          </h2>
          <svg
            width={containerWidth}
            height={chartHeight}
            style={{ backgroundColor: '#252528', borderRadius: '8px' }}
          >
            <g transform={`translate(${chartPadding.left}, ${chartPadding.top})`}>
              {/* Y-axis line */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={chartHeight - chartPadding.top - chartPadding.bottom}
                stroke="#393941"
                strokeWidth={2}
              />

              {/* X-axis line */}
              <line
                x1={0}
                y1={chartHeight - chartPadding.top - chartPadding.bottom}
                x2={chartWidth}
                y2={chartHeight - chartPadding.top - chartPadding.bottom}
                stroke="#393941"
                strokeWidth={2}
              />

              {/* Category regions */}
              {MASS_CATEGORIES.map((category, index) => {
                const x1 = massToX(Math.log10(category.min));
                const x2 = massToX(Math.log10(category.max));
                const barHeight = 50;
                const y = (chartHeight - chartPadding.top - chartPadding.bottom) / 2 - barHeight / 2;

                return (
                  <g key={index}>
                    <rect
                      x={x1}
                      y={y}
                      width={x2 - x1}
                      height={barHeight}
                      fill={category.color}
                      opacity={0.3}
                      stroke={category.color}
                      strokeWidth={2}
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={y - 10}
                      textAnchor="middle"
                      fill={category.color}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {category.name}
                    </text>
                  </g>
                );
              })}

              {/* Current mass indicator */}
              <line
                x1={massToX(logMass)}
                y1={0}
                x2={massToX(logMass)}
                y2={chartHeight - chartPadding.top - chartPadding.bottom}
                stroke="#8c7ae6"
                strokeWidth={3}
                strokeDasharray="5,5"
              />
              <circle
                cx={massToX(logMass)}
                cy={(chartHeight - chartPadding.top - chartPadding.bottom) / 2}
                r={8}
                fill="#8c7ae6"
                stroke="#fff"
                strokeWidth={2}
              />

              {/* X-axis ticks and labels */}
              {xTicks.map((tick, index) => (
                <g key={index}>
                  <line
                    x1={tick.x}
                    y1={chartHeight - chartPadding.top - chartPadding.bottom}
                    x2={tick.x}
                    y2={chartHeight - chartPadding.top - chartPadding.bottom + 8}
                    stroke="#393941"
                    strokeWidth={2}
                  />
                  <text
                    x={tick.x}
                    y={chartHeight - chartPadding.top - chartPadding.bottom + 25}
                    textAnchor="middle"
                    fill="#a1a1a8"
                    fontSize="12"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* Axis labels */}
              <text
                x={chartWidth / 2}
                y={chartHeight - chartPadding.top - chartPadding.bottom + 50}
                textAnchor="middle"
                fill="#e9e9ea"
                fontSize="14"
                fontWeight="bold"
              >
                Mass (Solar Masses)
              </text>
            </g>
          </svg>
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
            {learnPanelOpen ? '✕' : '📚'} Learn
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
            {challengePanelOpen ? '✕' : '🏆'} Challenge
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
