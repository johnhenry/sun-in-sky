# Sun in Sky - Complete Application Documentation

## Overview

**Sun in Sky** is an interactive educational visualization tool that accurately models solar altitude (the sun's angle above the horizon) based on astronomical principles. It allows users to explore how the sun's position changes throughout the day and year at different latitudes and with different planetary axial tilts.

## Core Concept

The application visualizes the answer to: "Where is the sun in the sky?" by plotting solar altitude over time, accounting for:
- Observer's latitude on the planet
- Time of day (diurnal cycle)
- Day of year (seasonal variation)
- Planetary axial tilt (affects seasons)

---

## Technical Stack

- **React** 19.2.1
- **Vite** 7.2.6
- **Native SVG** for rendering
- **No external visualization libraries** - pure React + SVG

---

## Application State

### State Variables

| Variable | Default | Range | Purpose |
|----------|---------|-------|---------|
| `latitude` | 45° | -90° to 90° | Observer's position (N/S) |
| `minuteOfYear` | 171d 12h | 0 to 525,600 | Current date/time position |
| `axialTilt` | 23.45° | 0° to 90° | Planet's obliquity |
| `viewMode` | 'day' | 'day' or 'year' | Time scale to display |
| `yAxisMode` | 'dynamic' | 'dynamic', 'fixed', 'wide' | Y-axis scaling strategy |
| `containerWidth` | 800 | dynamic | Responsive width tracking |
| `isPlaying` | false | boolean | Animation active state |

### Derived Values

```javascript
// Astronomical
dayOfYear = floor(minuteOfYear / 1440) + 1        // 1-365
hourOfDay = (minuteOfYear % 1440) / 60             // 0-24
tropicLat = axialTilt                               // ±23.45° for Earth
arcticLat = 90 - axialTilt                          // ±66.55° for Earth
declination = axialTilt × sin(2π/365 × (day - 81)) // Solar declination

// Display
currentAltitude = getAltitude(hour, declination)
dayType = 'normal' | 'midnight-sun' | 'polar-night'
daylightHours = calculated from altitude curve
```

---

## Astronomical Calculations

### Solar Declination

**Formula**: `δ = ε × sin(2π/365 × (D - 81))`

Where:
- `δ` = solar declination
- `ε` = axial tilt
- `D` = day of year
- `81` = day offset (≈ March 21, vernal equinox)

**Physical Meaning**: The sun's angular distance from the celestial equator. Varies from -ε to +ε throughout the year.

**Key Values for Earth**:
- March Equinox (day 80): δ ≈ 0°
- June Solstice (day 172): δ ≈ +23.45°
- September Equinox (day 266): δ ≈ 0°
- December Solstice (day 355): δ ≈ -23.45°

### Solar Altitude

**Formula**: `sin(h) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H)`

Where:
- `h` = altitude angle (angle above horizon)
- `φ` = observer's latitude
- `δ` = solar declination
- `H` = hour angle = 15° × (hour - 12)

**Implementation** (lines 65-73):
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

**Physical Meaning**: This is the fundamental equation of positional astronomy, giving the sun's angle above (+) or below (-) the horizon at any time.

### Geographic Boundaries

**Tropic Lines**:
- Location: latitude = ±axialTilt
- Significance: Sun reaches zenith (90°) at solstice
- Earth: ±23.45° (Tropic of Cancer/Capricorn)

**Arctic Circles**:
- Location: latitude = ±(90 - axialTilt)
- Significance: Experience midnight sun and polar night
- Earth: ±66.55° (Arctic/Antarctic Circle)

---

## View Modes

### Day View (24 Hours)

**Purpose**: Shows sun's path across the sky during a single day

**X-axis**: Local Solar Time (0:00 to 24:00)
**Y-axis**: Altitude in degrees
**Data Points**: 241 points (every 6 minutes)
**Update Interval**: 15 minutes per animation step

**Unique Features**:
- Equinox reference curve (gray dashed line)
- Sunrise/sunset markers (orange/red circles)
- Daylight duration calculation
- Special day detection (midnight sun, polar night)

**Use Cases**:
- Understand daily sun arc
- Find sunrise/sunset times
- Compare current day to equinox
- Explore polar phenomena

### Year View (365 Days)

**Purpose**: Shows seasonal variation throughout the year

**X-axis**: Months (Jan-Dec)
**Y-axis**: Altitude in degrees
**Data Points**: ~5,840 (every 90 minutes)
**Update Interval**: 120 minutes per animation step

**Unique Features**:
- Season markers (equinoxes/solstices)
- Seasonal color coding
- Long-term pattern visibility
- Responsive month labels

**Use Cases**:
- Understand seasonal changes
- Visualize equinoxes and solstices
- Compare winter/summer extremes
- See annual sun patterns

---

## Y-Axis Scaling Modes

### Dynamic (Auto)

**Behavior**: Automatically scales to fit data with padding

**Algorithm**:
1. Find min/max altitude in current data
2. Add 15% padding (minimum 8°)
3. Round to nearest 10°
4. If horizon is crossed, ensure ±15° around 0°
5. Clamp to physical limits (-90° to +90°)

**Best For**: Optimal view of current scenario, detailed analysis

### Fixed (±90°)

**Behavior**: Always shows full zenith-to-nadir range

**Range**: -90° (nadir) to +90° (zenith)

**Best For**: Comparing different scenarios, understanding absolute position

### Wide (±135°)

**Behavior**: Extended range showing physically impossible zones

**Range**: -135° to +135° (with impossible zones highlighted in pink)

**Best For**: Educational purposes, showing physical constraints

---

## Interactive Controls

### Time Navigation

**Play/Pause Button** (lines 470-487):
- Purple when paused (▶)
- Red when playing (⏸)
- Animation speed: 50ms intervals
- Auto-wraps at year end

**Timeline Slider** (lines 490-499):
- Range: 0 to 525,599 minutes (full year)
- Step size: 15 minutes
- Direct seeking to any date/time
- Real-time date/time display

### Quick Navigation Presets

**Date Presets** (5 buttons):
```javascript
Jan 1        → Day 1    (New Year)
Mar Equinox  → Day 80   (Spring equinox)
Jun Solstice → Day 172  (Summer solstice, noon)
Sep Equinox  → Day 266  (Fall equinox)
Dec Solstice → Day 355  (Winter solstice)
```

**Time Presets** (4 buttons):
```javascript
Midnight → 00:00
Dawn     → 06:00
Noon     → 12:00
Dusk     → 18:00
```

**Smart Behavior**: Time presets preserve current date, date presets preserve current time.

### Parameter Adjustment

**Latitude Slider** (lines 623-688):
- Range: -90° (South Pole) to +90° (North Pole)
- Step: 1°
- Visual markers for:
  - Tropics (yellow ticks at ±axialTilt)
  - Arctic Circles (blue ticks at ±(90-axialTilt))
- "Inside Arctic Circle" indicator when applicable

**Latitude Presets** (adaptive):
```javascript
0° Equator      → Equatorial position
±X° Tropic      → Tropic lines (X = current tilt)
45° Mid         → Mid-latitude
±Y° Arctic      → Arctic circles (Y = 90 - tilt)
90° Pole        → North/South Pole
```

**Axial Tilt Slider** (lines 702-724):
- Range: 0° to 90°
- Step: 0.1°
- Real-time updates to tropics/arctic circles

**Axial Tilt Presets** (planetary comparison):
```javascript
0°     → No tilt (no seasons)
23.4°  → Earth
25.2°  → Mars
82.2°  → Uranus (extreme tilt)
```

---

## Visualization Elements

### Primary Graph Components

**SVG Canvas** (280px height, responsive width):
- Dark background (#27272a)
- Padding: top 25, right 15, bottom 45, left 45
- Rounded corners (4px radius)
- Clip path for clean edges

### Visual Layers (z-order, bottom to top)

1. **Background & Zones**
   - Graph background
   - Impossible zones (pink, wide mode only)
   - Night region (blue-tinted below horizon)

2. **Grid System**
   - Altitude grid lines (adaptive spacing)
   - Time grid (hours in day view, months in year view)
   - Season markers (year view)

3. **Reference Lines**
   - Zenith (+90°, red dashed)
   - Nadir (-90°, red dashed)
   - Horizon (0°, orange thick dashed)
   - Equinox reference (day view, gray dashed)

4. **Data Visualization**
   - Sun path curve (gradient: yellow → orange)
   - Sunrise marker (orange circle, 4px)
   - Sunset marker (red circle, 4px)

5. **Current Position**
   - Purple circle (5px, black outline)

### Color Scheme

**Functional Colors**:
```javascript
Background:      #1a1a1c (dark gray)
Graph area:      #27272a (slightly lighter)
Text (primary):  #e9e9ea (near white)
Text (muted):    #a1a1a8 (gray)
Grid lines:      #393941 (subtle gray)

Sun path:        #f4d03f → #e67e22 (yellow-orange gradient)
Horizon:         #e67e22 (orange)
Sunrise:         #e67e22 (orange)
Sunset:          #e25f73 (red)
Night region:    rgba(35,35,52,0.5) (blue tint)

Current marker:  #8c7ae6 (purple)
Latitude mode:   #8c7ae6 (purple)
Tilt mode:       #6ab0f3 (blue)
Time mode:       #f4d03f (yellow)

Zenith/Nadir:    #e25f73 (red)
Impossible zone: rgba(226,95,115,0.12) (pink tint)

Seasons:
  Spring:        #4ade80 (green)
  Summer:        #f4d03f (yellow)
  Fall:          #fb923c (orange)
  Winter:        #60a5fa (blue)
```

### Stats Display (lines 558-606)

**Always Visible**:
- Current altitude (color-coded: yellow above horizon, blue below)
- Solar declination (±degrees)

**Day View Only**:
- Daylight hours (0-24h)
- Sunrise time (HH:MM)
- Sunset time (HH:MM)
- Special conditions:
  - "☀ Midnight Sun" (sun never sets)
  - "● Polar Night" (sun never rises)

---

## Day Type Detection

### Algorithm (lines 166-170)

```javascript
if (minAltitude > 0°)  → 'midnight-sun'
if (maxAltitude < 0°)  → 'polar-night'
else                   → 'normal'
```

### When Each Occurs

**Midnight Sun**:
- Inside Arctic Circle during summer solstice ±months
- At pole: entire summer half of year
- Sun never dips below horizon

**Polar Night**:
- Inside Arctic Circle during winter solstice ±months
- At pole: entire winter half of year
- Sun never rises above horizon

**Normal Day**:
- All other cases
- Sun crosses horizon twice (sunrise & sunset)
- Standard day/night cycle

### Daylight Calculation

```javascript
// Midnight sun
if (dayType === 'midnight-sun') → 24 hours

// Polar night
if (dayType === 'polar-night') → 0 hours

// Normal day
else → (points above horizon / total points) × 24
```

---

## Responsive Design

### Width Adaptation

**Container Tracking** (lines 15-24):
```javascript
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
```

### Adaptive Elements

**Month Labels** (year view):
```javascript
width > 600px  → Full names ("Jan", "Feb", ...)
width > 500px  → Abbreviated ("Jan", "Feb", ...)
width ≤ 500px  → Single letters ("J", "F", ...)
```

**Label Visibility**:
```javascript
width > 500px  → All 12 months
width ≤ 500px  → Every other month (6 total)
```

**Layout Flexibility**:
- Flexbox with wrap for all control rows
- Minimum widths prevent crushing
- Buttons adapt to available space

---

## Performance Optimizations

### Memoization Strategy

**useMemo hooks prevent unnecessary recalculations**:

```javascript
// Recalc only when latitude or axialTilt change
yearAltitudes = useMemo(..., [latitude, axialTilt])

// Recalc only when latitude or declination change
dayAltitudes = useMemo(..., [latitude, declination])

// Recalc only when latitude changes
equinoxAltitudes = useMemo(..., [latitude])

// Recalc when dependencies change
curveData = useMemo(..., [rawData, graphWidth, yMax, yRange, viewMode])
yAxisRange = useMemo(..., [rawData, yAxisMode])
yGridLines = useMemo(..., [yMin, yMax, yRange])
seasonMarkers = useMemo(..., [viewMode, graphWidth])
latPresets = useMemo(..., [tropicLat, arcticLat])
equinoxCurve = useMemo(..., [equinoxAltitudes, graphWidth, yMax, yRange, viewMode])
```

**Impact**: Prevents recalculating 5,840+ data points on every render.

### Animation Management

**Cleanup Pattern** (lines 26-36):
```javascript
useEffect(() => {
  if (isPlaying) {
    playRef.current = setInterval(() => {...}, 50);
  } else {
    clearInterval(playRef.current);
  }
  return () => clearInterval(playRef.current);
}, [isPlaying, viewMode]);
```

**Benefits**:
- Prevents memory leaks
- Adjusts speed based on view mode
- Clean state transitions

---

## Educational Features

### Contextual Hints

**Arctic Circle Indicator** (lines 616-618):
- Displays "Inside Arctic Circle" when |latitude| > arcticLat
- Only shown when axialTilt > 0
- Helps users understand polar regions

**Derived Geography Display** (lines 697-699):
- Shows current tropic latitudes
- Shows current arctic circle latitudes
- Updates in real-time as tilt changes

### Educational Notes

**Zero Tilt** (lines 729-741):
```
"No axial tilt: Every location has exactly 12 hours
of daylight year-round. No seasons exist."
```

**Extreme Tilt** (lines 743-756):
```
"Extreme tilt: The Arctic Circle is now at X° latitude.
Most of the planet experiences midnight sun or polar
night seasonally."
```

Triggers when tilt > 50°

### Visual Teaching Aids

**Latitude Slider Markers**:
- Yellow ticks at tropics (±axialTilt)
- Blue ticks at arctic circles (±(90-axialTilt))
- Helps visualize geographic boundaries

**Equinox Reference Curve** (day view):
- Shows sun path during equinoxes (declination = 0°)
- Appears when declination > 2°
- Helps compare current day to baseline

**Season Markers** (year view):
- Vertical dashed lines at equinoxes/solstices
- Color-coded by season
- Anchors visualization to key dates

---

## Key Insights Users Can Discover

### By Latitude

**Equator (0°)**:
- Sun passes directly overhead twice per year
- Always ~12 hours daylight
- Minimal seasonal variation
- Sun altitude at noon = 90° - |declination|

**Tropics (±23.45° for Earth)**:
- Sun reaches zenith exactly once per year (at solstice)
- Boundary between "sun overhead" and "sun always south/north"
- Moderate seasonal variation

**Mid-latitudes (30°-60°)**:
- Significant seasonal variation
- Sun never reaches zenith
- Normal day/night cycle year-round

**Arctic Circles (±66.55° for Earth)**:
- Boundary where midnight sun/polar night begins
- Exactly one day of each per year (at solstice)

**Poles (±90°)**:
- 6 months continuous daylight
- 6 months continuous darkness
- Sun circles horizon during summer
- Maximum seasonal extremes

### By Tilt

**No Tilt (0°)**:
- No seasons anywhere
- Declination always 0°
- Every location has 12h day year-round
- Sun's daily path identical every day

**Earth-like Tilt (23.45°)**:
- Moderate seasons
- Habitable zones with variation
- Arctic circles at ±66.55°

**High Tilt (>50°)**:
- Extreme seasons
- Large arctic zones (most of planet)
- Many locations experience polar phenomena
- Tropics closer to equator

**Extreme Tilt (Uranus, 82.23°)**:
- Arctic circles at ±7.77°
- Nearly entire planet has midnight sun/polar night
- Pole points almost directly at sun during solstice

### By Date

**Equinoxes (Mar 20, Sep 22)**:
- Declination = 0°
- 12h daylight everywhere on Earth
- Sun rises due east, sets due west
- Identical curves for all latitudes differ only in max altitude

**Solstices (Jun 21, Dec 21)**:
- Declination = ±axialTilt (maximum)
- Maximum seasonal extremes
- Longest/shortest days
- Midnight sun at arctic circles

---

## Scientific Accuracy

### Verified Against Physics

**Solar Declination**:
- ✓ Ranges from -ε to +ε
- ✓ Zero at equinoxes
- ✓ Maximum at solstices
- ✓ Sinusoidal variation

**Solar Altitude**:
- ✓ Uses standard astronomical formula
- ✓ Accounts for latitude, declination, hour angle
- ✓ Correctly predicts sunrise/sunset
- ✓ Handles edge cases (poles, tropics)

**Polar Phenomena**:
- ✓ Midnight sun occurs inside arctic circle in summer
- ✓ Polar night occurs inside arctic circle in winter
- ✓ Duration increases toward pole
- ✓ Exactly one day each at arctic circle

**Geographic Boundaries**:
- ✓ Tropics at latitude = ±axialTilt
- ✓ Arctic circles at latitude = ±(90 - axialTilt)
- ✓ Dynamically update with tilt changes

### Simplifications

**Intentional simplifications for educational clarity**:

1. **365-day year** (not 365.25)
   - Ignores leap years
   - Minor error accumulates over time
   - Acceptable for educational purposes

2. **Circular orbit**
   - Ignores orbital eccentricity
   - Earth's orbit is ~3% elliptical
   - Affects equation of time (not modeled)

3. **Instantaneous transitions**
   - Sunrise/sunset shown as points, not gradual
   - Doesn't model atmospheric refraction
   - Doesn't model solar disk size (0.5°)

4. **No atmospheric effects**
   - Civil/nautical/astronomical twilight not modeled
   - Refraction not included (lifts horizon ~0.5°)
   - No altitude correction for atmospheric effects

5. **Perfect observer**
   - No obstacles (mountains, buildings)
   - No weather effects
   - Flat horizon assumption

These are reasonable tradeoffs for an interactive educational tool focused on core astronomical principles.

---

## Code Architecture

### Component Structure

**Single Component**: `SunPositionViz`
- Self-contained
- No external dependencies
- Pure React + SVG

### Data Flow

```
User Input → State Update → Derived Calculations → SVG Render
                ↓
          useMemo Cache
                ↓
          Optimized Render
```

### State Management Philosophy

**Single Source of Truth**:
- `minuteOfYear` is the primary time state
- Everything else derives from it
- No redundant state

**Calculated Values**:
- Astronomy calculations in pure functions
- Memoized when expensive
- Re-calculated only when dependencies change

### Rendering Strategy

**SVG Composition**:
- Layers built bottom-to-top
- Clip paths for clean edges
- Gradients for visual appeal
- Responsive coordinate system

**Conditional Rendering**:
- View-specific elements (season markers, equinox curve)
- Visibility-based elements (horizon, zenith, nadir)
- Mode-based elements (impossible zones)

---

## Usage Patterns

### Recommended Workflows

**Understanding Your Location**:
1. Set latitude to your location
2. Toggle through seasons (solstices/equinoxes)
3. Compare day vs year view
4. Note daylight hours variation

**Comparing Latitudes**:
1. Set fixed y-axis mode
2. Set date (e.g., Jun Solstice)
3. Toggle through latitude presets
4. Observe how arctic/mid/equator differ

**Exploring Tilt Effects**:
1. Set latitude (e.g., 45°)
2. Set date (e.g., Jun Solstice)
3. Animate tilt from 0° to 90°
4. Watch tropics/arctic circles move

**Understanding Polar Regions**:
1. Set latitude to 70°+ (inside arctic)
2. Set date to Jun Solstice
3. Observe midnight sun
4. Switch to Dec Solstice
5. Observe polar night

**Planet Comparison**:
1. Use planet tilt presets (Earth, Mars, Uranus)
2. Keep latitude constant (e.g., 45°)
3. Cycle through seasons
4. Compare seasonal extremes

---

## Extension Ideas

### Potential Enhancements

**Additional Features**:
- Azimuth (compass direction) visualization
- 3D sun path dome
- Multiple locations simultaneously
- Real-time mode (use actual date/time)
- Export data (CSV)
- Save/load configurations
- Custom planet database

**Astronomical Additions**:
- Moon position
- Planets visibility
- Equation of time
- Analemma
- Twilight zones (civil, nautical, astronomical)
- Solar noon vs clock noon

**Educational Additions**:
- Quiz mode
- Guided tours
- Annotations/labels
- Video export
- Screenshot function
- Comparison mode (side-by-side)

**Technical Improvements**:
- Touch gestures (pinch/zoom)
- Keyboard shortcuts
- Accessibility (ARIA labels, screen reader support)
- Dark/light theme toggle
- Internationalization (i18n)
- Permalink sharing (URL state)

---

## Dependencies & Requirements

### Runtime Requirements

**Browser Support**:
- Modern browsers with ES6+ support
- SVG rendering capability
- CSS Flexbox support
- JavaScript enabled

**Minimum Requirements**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Recommended**:
- Desktop or tablet (better for interaction)
- Screen width 500px+
- Mouse or touch input

### Build Requirements

**Node.js**: 20.19+ or 22.12+
**Package Manager**: npm, yarn, or pnpm

**Build Tools**:
- Vite 7.2.6
- @vitejs/plugin-react 5.1.1

**No Runtime Dependencies**: Pure React application

---

## File Structure

```
sun-in-sky/
├── index.html              # Entry point, mounts #root
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── .gitignore             # Git ignore patterns
├── README.md              # User-facing documentation
├── Claude.md              # This file - technical deep dive
├── artifact.jsx           # Original artifact (preserved)
├── src/
│   ├── main.jsx           # React entry, renders App
│   └── App.jsx            # Main component (SunPositionViz)
└── dist/                  # Production build output
```

---

## Development Guide

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

### Modifying Calculations

**Astronomy Functions** (lines 53-88):
- `getDeclination(day)` - Solar declination
- `getAltitude(hour, decl)` - Solar altitude
- `getAltitudeAtMinute(minute)` - Helper for year view
- `computeDayAltitudes(decl)` - Generate day curve

**Testing Changes**:
1. Modify function
2. Check day view (immediate feedback)
3. Verify year view (long-term effects)
4. Test edge cases (poles, equator, solstices)

### Adding Presets

**Location Presets**:
```javascript
// Add to latPresets array (lines 189-195)
{ value: 51, label: '51° London' }
```

**Date Presets**:
```javascript
// Add to datePresets array (lines 198-204)
{ minute: 150 * 24 * 60, label: 'May 30', day: 151 }
```

**Tilt Presets**:
```javascript
// Add to tiltPresets array (lines 182-187)
{ value: 3.13, label: '3.1° Mercury' }
```

### Styling Changes

**Color Scheme**: Lines 246-254, 263-302, 313-320
**Layout**: Lines 257-303, 462-555, 609-726
**Typography**: Inline styles throughout

---

## Debugging Tips

### Common Issues

**Problem**: Sunrise/sunset not showing
**Cause**: Day type is midnight-sun or polar-night
**Solution**: Check latitude and date, ensure normal day

**Problem**: Graph looks squished
**Cause**: Dynamic y-axis mode with large range
**Solution**: Switch to fixed mode for comparison

**Problem**: Animation not smooth
**Cause**: Expensive calculations not memoized
**Solution**: Verify useMemo dependencies correct

**Problem**: Responsive width not updating
**Cause**: Container ref not attached
**Solution**: Check containerRef on parent div

### Console Debugging

```javascript
// Add to component for debugging
console.log({
  latitude,
  dayOfYear,
  declination,
  currentAltitude,
  dayType,
  sunrisePoint,
  sunsetPoint
});
```

---

## Educational Context

### Target Audience

**Primary**:
- Students (high school through college)
- Astronomy enthusiasts
- Geography students
- Physics learners

**Secondary**:
- Photographers (planning golden hour)
- Architects (sun path analysis)
- Solar panel installers (optimization)
- Curious individuals

### Learning Objectives

**After using this tool, students should understand**:
1. How latitude affects sun position
2. Why seasons occur (axial tilt)
3. What causes midnight sun and polar night
4. How equinoxes and solstices differ
5. Why tropics and arctic circles exist
6. How other planets differ from Earth

### Classroom Integration

**Activity Ideas**:
1. **Latitude Exploration**: Students set to their hometown, observe patterns
2. **Season Investigation**: Compare solstices, explain differences
3. **Polar Simulation**: Set latitude to 80°, cycle through year
4. **Planet Comparison**: Use tilt presets, document observations
5. **Critical Thinking**: Predict pattern before viewing, verify hypothesis

---

## Mathematical Foundations

### Coordinate Systems

**Horizon System**:
- Origin: Observer
- Altitude: Angle above horizon (0° = horizon, 90° = zenith)
- Azimuth: Compass direction (not implemented)

**Equatorial System**:
- Origin: Earth center
- Declination: Celestial latitude (-90° to +90°)
- Right ascension: Celestial longitude (not needed for this app)

### Transformations

**Hour Angle** → **Local Coordinate**:
```
H = (LST - RA) = 15° × (hour - 12)
```
Where LST = Local Solar Time, RA = Right Ascension

**Equatorial** → **Horizon**:
```
sin(h) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H)
```
This is the core transformation implemented in `getAltitude()`

### Time Systems

**Solar Time vs Clock Time**:
- Solar time: Based on sun's position
- Clock time: Standardized to time zones
- Difference: Equation of time (±16 minutes)
- This app uses solar time for simplicity

**Day Numbering**:
- Jan 1 = Day 1
- Dec 31 = Day 365
- Reference point: Day 81 ≈ March 21 (equinox)

---

## Conclusion

**Sun in Sky** is a comprehensive, scientifically accurate, and educational tool for understanding solar position. It successfully balances:

✓ **Accuracy**: Real astronomical formulas
✓ **Interactivity**: Responsive controls and animations
✓ **Education**: Contextual hints and visual aids
✓ **Performance**: Optimized rendering and calculations
✓ **Design**: Clean, intuitive interface

The application serves as both a learning tool and a reference implementation of astronomical calculations in JavaScript/React.

---

## License & Attribution

**Original Work**: Created from a Claude artifact conversation
**Framework**: React (MIT License)
**Build Tool**: Vite (MIT License)
**Astronomical Formulas**: Public domain (standard astronomical equations)

---

## Contact & Contribution

For questions, suggestions, or contributions, please refer to the project repository.

Last Updated: December 2025
