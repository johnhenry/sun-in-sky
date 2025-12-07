# Sun in Sky - Application Documentation

## Overview

**Sun in Sky** is an interactive educational tool that visualizes solar position based on astronomical principles. It shows how the sun's altitude (angle above horizon) changes with time, latitude, and planetary axial tilt.

### Core Concept

The application answers: **"Where is the sun in the sky?"** by accounting for:
- Observer's latitude (-90° to +90°)
- Time of day (0-24 hours)
- Day of year (1-365)
- Planetary axial tilt (0° to 90°)

---

## Technical Stack

- **React** 19.2.1
- **Vite** 7.2.6
- **Three.js** 0.181.2 with React Three Fiber
- **SVG** for 2D charts
- **react-markdown** for educational content

---

## Features

### 1. 2D Solar Altitude Visualization

**Two View Modes:**
- **Day View**: 24-hour sun path for a single day (241 data points)
- **Year View**: Seasonal variation over 365 days (~5,840 data points)

**Y-Axis Modes:**
- **Dynamic**: Auto-scales to fit data with padding
- **Fixed**: Always shows ±90° (zenith to nadir)
- **Wide**: Shows ±135° with impossible zones highlighted

**Visual Elements:**
- Sun path curve (yellow-orange gradient)
- Horizon line (0° altitude)
- Sunrise/sunset markers
- Night region (below horizon)
- Current position indicator
- Equinox reference curve (day view)
- Season markers (year view)

### 2. 3D Earth Visualization

**Interactive 3D globe** showing:
- Earth sphere with oceans/landmasses
- Observer location (purple cone marker)
- Sun position in 3D space
- Day/night illumination
- Latitude circles (Equator, Tropics, Arctic)
- Longitude meridians
- Star field background
- Orbital ring

**Controls:**
- Drag to rotate
- Scroll to zoom (3-25 units)
- Right-drag to pan

**Synchronization:** All state changes (latitude, time, tilt) update both 2D and 3D views in real-time.

### 3. AR Sun Finder (Experimental)

**Mobile-only feature** using device sensors to point at the sun:
- Uses DeviceOrientationEvent API (compass, gyroscope, accelerometer)
- 3D arrow acts as HUD-style compass
- Arrow anchored to screen, rotates to point at sun
- Shows alignment indicator when pointing at sun
- Debug display for sensor values

**Status:** Experimental - sensor behavior varies by device.

### 4. Educational Content System

**Three difficulty levels:**
- **Elementary**: Basic concepts (day/night, seasons)
- **Middle School**: Intermediate astronomy (latitude effects, solstices)
- **High School**: Advanced topics (declination, celestial coordinates)

**Features:**
- Interactive lessons with markdown content
- Progress tracking with localStorage
- Completion percentage per lesson
- Responsive panel interface

### 5. Quiz & Badge System

**Challenge Panel:**
- Auto-generated quiz questions from lessons
- Questions remain until answered correctly
- Streak tracking (current/longest)
- Accuracy percentage
- Point-based badge system

**Badges:**
- 16 total badges with various criteria
- Tier system (Beginner → Explorer → Scholar → Expert → Master)
- Points accumulation
- Visual badge gallery

### 6. Performance Optimizations

**LTTB Downsampling:**
- Largest Triangle Three Buckets algorithm
- Reduces data points while preserving shape
- Used for year view optimization

**Memoization:**
- Expensive calculations cached with `useMemo`
- Updates only when dependencies change
- Prevents recalculating thousands of data points per render

**Local Storage:**
- Lesson progress persistence
- Quiz state and streaks
- Badge collection
- User preferences
- Data import/export

---

## Astronomical Calculations

### Solar Declination

**Formula:** `δ = ε × sin(2π/365 × (D - 81))`

Where:
- `δ` = solar declination (sun's angle from celestial equator)
- `ε` = axial tilt
- `D` = day of year (1-365)
- `81` = offset for March equinox (day ~80)

**Key Values (Earth):**
- March Equinox (day 80): δ ≈ 0°
- June Solstice (day 172): δ ≈ +23.45°
- September Equinox (day 266): δ ≈ 0°
- December Solstice (day 355): δ ≈ -23.45°

### Solar Altitude

**Formula:** `sin(h) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H)`

Where:
- `h` = altitude angle (above horizon)
- `φ` = observer's latitude
- `δ` = solar declination
- `H` = hour angle = 15° × (hour - 12)

**Implementation:**
```javascript
const getAltitude = (hour, decl) => {
  const decRad = (decl * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  const hourAngle = ((hour - 12) * 15 * Math.PI) / 180;
  const sinAltitude =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourAngle);
  return (Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180) / Math.PI;
};
```

### Solar Azimuth

**Formula:** `cos(A) = (sin(δ) - sin(h)sin(φ)) / (cos(h)cos(φ))`

Where:
- `A` = azimuth (compass direction, 0° = North)
- Adjusted for east/west using sun's hour angle

### Geographic Boundaries

**Tropic Lines:** latitude = ±axial tilt
- Where sun reaches zenith (90°) at solstice
- Earth: ±23.45° (Tropic of Cancer/Capricorn)

**Arctic Circles:** latitude = ±(90 - axial tilt)
- Where midnight sun and polar night begin
- Earth: ±66.55° (Arctic/Antarctic Circle)

### Special Day Types

```javascript
if (minAltitude > 0°)  → 'midnight-sun'  // Sun never sets
if (maxAltitude < 0°)  → 'polar-night'   // Sun never rises
else                   → 'normal'        // Standard day/night
```

**Daylight Calculation:**
- Midnight sun: 24 hours
- Polar night: 0 hours
- Normal: (points above horizon / total) × 24

---

## Application State

### Core State Variables

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| `latitude` | 45° | -90° to 90° | Observer position |
| `minuteOfYear` | 171d 12h | 0 to 525,600 | Date/time (minute resolution) |
| `axialTilt` | 23.45° | 0° to 90° | Planet obliquity |
| `viewMode` | 'day' | 'day', 'year' | Time scale |
| `yAxisMode` | 'dynamic' | dynamic/fixed/wide | Y-axis scaling |
| `showEarthViz` | true | boolean | 3D Earth visibility |
| `arModeActive` | false | boolean | AR mode active |

### Derived Values

```javascript
dayOfYear = floor(minuteOfYear / 1440) + 1
hourOfDay = (minuteOfYear % 1440) / 60
tropicLat = axialTilt
arcticLat = 90 - axialTilt
declination = axialTilt × sin(2π/365 × (dayOfYear - 81))
currentAltitude = getAltitude(hourOfDay, declination)
currentAzimuth = getAzimuth(hourOfDay, declination, currentAltitude)
```

---

## Component Architecture

### File Structure

```
src/
├── App.jsx                          # Main component (2D viz + controls)
├── EarthVisualization.jsx           # 3D Earth with Three.js
├── components/
│   ├── ARSunFinder.jsx              # AR compass (mobile)
│   └── panels/
│       ├── shared/Panel.jsx         # Reusable panel container
│       ├── LearnPanel/              # Educational lessons
│       └── ChallengePanel/          # Quiz & badges
├── data/
│   ├── lessons/                     # JSON lesson content
│   └── badges.js                    # Badge definitions
├── utils/
│   ├── localStorage.js              # Storage utilities
│   ├── lttb.js                      # Downsampling algorithm
│   └── badgeLogic.js                # Badge award logic
└── hooks/
    └── useLocalStorage.js           # React hook for persistence
```

### Key Components

**App.jsx** - Main visualization component:
- 2D SVG altitude graph
- Interactive controls (sliders, buttons)
- State management
- Integrates 3D Earth and AR finder

**EarthVisualization.jsx** - 3D globe:
- Three.js scene with camera controls
- Earth mesh with day/night shading
- Observer marker (purple cone)
- Sun directional light
- Synchronized with App state

**ARSunFinder.jsx** - AR compass:
- Three.js scene in fullscreen overlay
- Device orientation sensors
- 3D arrow pointing at sun
- HUD-style (camera child)
- Sensor debug display

**LearnPanel** - Educational content:
- Three difficulty levels
- Markdown rendering
- Progress tracking
- Collapsible sections

**ChallengePanel** - Quiz interface:
- Question display
- Answer validation
- Streak tracking
- Badge gallery
- Stats overview

---

## Interactive Controls

### Time Navigation

**Play/Pause:** Animates time forward (purple button)
- Day view: 15 minutes per step
- Year view: 120 minutes per step
- Auto-wraps at year end

**Timeline Slider:** Direct seeking (0-525,599 minutes)

**Date Presets:**
- Jan 1, Mar Equinox, Jun Solstice, Sep Equinox, Dec Solstice

**Time Presets:**
- Midnight (00:00), Dawn (06:00), Noon (12:00), Dusk (18:00)

**"Here" Button:** Sets to current real-world date/time

**"Now" Indicator:** Shows current time position on graph

### Parameter Adjustment

**Latitude Slider:**
- Range: -90° to +90°
- Visual markers for tropics (yellow) and arctic circles (blue)
- Presets: Equator, Tropics, Mid-latitude, Arctic Circles, Poles

**Axial Tilt Slider:**
- Range: 0° to 90°
- Presets: 0° (no tilt), 23.4° (Earth), 25.2° (Mars), 82.2° (Uranus)

### View Options

**View Mode Toggle:**
- Day: Single 24-hour period
- Year: Full annual cycle

**Y-Axis Mode:**
- Dynamic (auto-scale)
- Fixed (±90°)
- Wide (±135°)

**Show 3D Earth:** Toggle 3D visualization

**AR Sun Finder:** Mobile-only, experimental

---

## Data Persistence

### LocalStorage Keys

```javascript
STORAGE_KEYS = {
  VERSION: 'sun-in-sky:version',
  LESSON_PROGRESS: 'sun-in-sky:lesson-progress',
  QUIZ_STATE: 'sun-in-sky:quiz-state',
  BADGES: 'sun-in-sky:badges',
  PREFERENCES: 'sun-in-sky:preferences',
  TIMESTAMP: 'sun-in-sky:last-updated'
}
```

### Stored Data

**Lesson Progress:**
```javascript
{
  elementary: { lesson1: { completed: true, timestamp: "..." } },
  'middle-school': { ... },
  'high-school': { ... }
}
```

**Quiz State:**
```javascript
{
  totalQuestions: 42,
  correctAnswers: 35,
  incorrectAnswers: 7,
  answeredQuestions: { q1: { selectedAnswer: "A", correct: true } },
  streaks: { current: 5, longest: 12 }
}
```

**Badges:**
```javascript
{
  earned: [{ id: "first-lesson", earnedAt: "..." }],
  progress: { }
}
```

### Data Management

**Export:** Download all data as JSON
**Import:** Restore from JSON backup
**Reset:** Clear all progress
**Migration:** Version-based schema updates

---

## Responsive Design

### Breakpoints

**Desktop (>600px):**
- Full 3D Earth height (500px)
- All month labels visible
- Expanded controls

**Mobile (≤600px):**
- Reduced 3D Earth (300px)
- Abbreviated month labels
- Touch-optimized controls
- AR Sun Finder available

### Adaptive Elements

**Graph Width:** Tracks container width with ResizeObserver

**Month Labels:**
- >600px: Full names ("January")
- >500px: Abbreviated ("Jan")
- ≤500px: Single letters ("J")

**Control Layout:** Flexbox with wrapping for small screens

---

## Educational Use Cases

### Latitude Exploration

Compare how sun position changes with latitude:
1. Set fixed date (e.g., Jun Solstice)
2. Toggle through latitude presets
3. Observe: Equator vs Tropics vs Poles

### Seasonal Understanding

See why seasons occur:
1. Set latitude to 45°
2. Cycle through solstices/equinoxes
3. Compare day length and sun altitude
4. Note Earth's tilt in 3D view

### Polar Phenomena

Experience midnight sun and polar night:
1. Set latitude to 70°+ (inside arctic)
2. Jun Solstice: Midnight sun (24h day)
3. Dec Solstice: Polar night (0h day)

### Axial Tilt Effects

Understand tilt's role in seasons:
1. Set tilt to 0°: No seasons, 12h days everywhere
2. Set tilt to 23.45° (Earth): Moderate seasons
3. Set tilt to 82° (Uranus): Extreme seasons

### Planet Comparison

Compare Earth to other planets:
- Use tilt presets (Earth, Mars, Uranus)
- Observe seasonal extremes
- Note tropic/arctic latitude changes

---

## Known Limitations

### Simplifications

**365-day year:** Ignores leap years (minor error over time)

**Circular orbit:** Earth's elliptical orbit not modeled

**No atmospheric effects:**
- Refraction not included (~0.5° lift)
- Twilight zones not modeled
- Atmospheric scattering ignored

**Instantaneous sunrise/sunset:** No gradual transition

**Flat horizon:** No terrain/obstacles

**AR Sun Finder:** Experimental, sensor accuracy varies by device

These are reasonable tradeoffs for an educational tool focused on core astronomical principles.

---

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Processing Lessons

Lessons are stored as JSON in `src/data/lessons/`. To regenerate quiz questions:

```bash
npm run process-lessons
```

This creates `*-quiz.json` files from lesson content.

### Deployment

```bash
# GitHub Pages
npm run deploy:github

# Netlify (manual upload)
npm run deploy:netlify

# Vercel
npm run deploy:vercel
```

---

## Performance Notes

**Optimization Strategies:**
1. **useMemo** for expensive calculations
2. **LTTB downsampling** for year view
3. **Geometry reuse** in Three.js
4. **Conditional rendering** of view-specific elements
5. **Animation cleanup** (useEffect return)
6. **LocalStorage caching** with timestamps

**Bundle Size:**
- Gzipped: ~315 KB (Three.js is largest dependency)
- Acceptable for 3D rendering capabilities

**Frame Rate:**
- Desktop: 60 FPS (3D view)
- Mobile: 40-50 FPS (acceptable)

---

## Browser Support

**Tested:**
- Chrome 120+ ✅
- Firefox 121+ ✅
- Safari 17+ ✅
- Edge 120+ ✅
- iOS Safari 17+ ✅
- Chrome Android 120+ ✅

**Requirements:**
- WebGL support
- JavaScript enabled
- DeviceOrientation API (for AR mode)

---

## Color Scheme

**Functional Colors:**
- Background: `#1a1a1c` (dark gray)
- Text: `#e9e9ea` (near white)
- Muted: `#a1a1a8` (gray)
- Grid: `#393941` (subtle)

**Feature Colors:**
- Sun path: `#f4d03f → #e67e22` (yellow-orange gradient)
- Horizon: `#e67e22` (orange)
- Night: `rgba(35,35,52,0.5)` (blue tint)
- Current marker: `#8c7ae6` (purple)
- Zenith/Nadir: `#e25f73` (red)

**Seasons:**
- Spring: `#4ade80` (green)
- Summer: `#f4d03f` (yellow)
- Fall: `#fb923c` (orange)
- Winter: `#60a5fa` (blue)

---

## License

MIT License - See LICENSE file for details.

---

## Credits

**Astronomical Formulas:** Standard celestial mechanics equations (public domain)

**LTTB Algorithm:** [Sveinn Steinarsson, 2013](https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf)

**Frameworks:**
- React (Meta, MIT)
- Three.js (MIT)
- Vite (MIT)

---

Last Updated: December 2025
