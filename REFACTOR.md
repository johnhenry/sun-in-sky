# Multi-App Architecture Refactoring Plan

## Overview

Transform the current "Sun in Sky" application into a parent application that hosts multiple educational visualization apps, each with:
1. A unique main visualization component
2. Shared Learn panel (reusable educational content system)
3. Shared Challenge panel (reusable quiz and badge system)

## Goals

- **Modularity**: Extract reusable components that can be shared across multiple apps
- **Scalability**: Create a structure that makes it easy to add new educational apps
- **Code Reuse**: Minimize duplication of Learn/Challenge functionality
- **Maintainability**: Clear separation of concerns between parent app, child apps, and shared components

---

## Current Structure

```
sun-in-sky/
├── src/
│   ├── App.jsx                          # Main sun visualization + controls
│   ├── EarthVisualization.jsx           # 3D Earth component
│   ├── components/
│   │   ├── ARSunFinder.jsx
│   │   └── panels/
│   │       ├── shared/Panel.jsx
│   │       ├── LearnPanel/LearnPanel.jsx
│   │       └── ChallengePanel/ChallengePanel.jsx
│   ├── data/
│   │   ├── lessons/                     # JSON lesson data
│   │   └── badges.js
│   ├── utils/
│   │   ├── localStorage.js
│   │   ├── lttb.js
│   │   ├── badgeLogic.js
│   │   └── lessonParser.js
│   └── hooks/
│       └── useLocalStorage.js
├── main.jsx
└── package.json
```

---

## Target Structure

```
educational-apps/                         # New parent app
├── src/
│   ├── main.jsx                         # Root entry point with routing
│   ├── App.jsx                          # Parent app shell (directory, navigation)
│   ├── apps/                            # Individual child applications
│   │   ├── sun-in-sky/                  # Original app (refactored)
│   │   │   ├── SunInSkyApp.jsx         # Main visualization component
│   │   │   ├── EarthVisualization.jsx
│   │   │   ├── ARSunFinder.jsx
│   │   │   ├── utils/
│   │   │   │   └── lttb.js             # App-specific utility
│   │   │   └── data/
│   │   │       └── lessons/             # Sun-specific lessons
│   │   │           ├── elementary.json
│   │   │           ├── middle-school.json
│   │   │           └── high-school.json
│   │   │
│   │   └── stellar-mass/                # New gravity/mass app
│   │       ├── StellarMassApp.jsx      # Main visualization component
│   │       ├── MassVisualization.jsx   # 3D mass/gravity viz
│   │       └── data/
│   │           └── lessons/             # Mass-specific lessons
│   │               ├── elementary.json
│   │               ├── middle-school.json
│   │               └── high-school.json
│   │
│   ├── shared/                          # Shared across all apps
│   │   ├── components/
│   │   │   ├── LearnPanel/
│   │   │   │   ├── LearnPanel.jsx      # Generic learn component
│   │   │   │   └── LearnPanel.css
│   │   │   ├── ChallengePanel/
│   │   │   │   ├── ChallengePanel.jsx  # Generic challenge component
│   │   │   │   └── ChallengePanel.css
│   │   │   └── Panel/
│   │   │       ├── Panel.jsx
│   │   │       └── Panel.css
│   │   │
│   │   ├── data/
│   │   │   └── badges.js               # Shared badge definitions
│   │   │
│   │   ├── utils/
│   │   │   ├── localStorage.js         # Shared storage utilities
│   │   │   └── badgeLogic.js           # Shared badge logic
│   │   │
│   │   └── hooks/
│   │       └── useLocalStorage.js      # Shared hook
│   │
│   └── config/
│       └── apps.js                      # App registry configuration
│
├── package.json                         # Updated with react-router
└── vite.config.js
```

---

## Implementation Steps

### Phase 1: Create Parent Application Structure

**1.1 Update package.json**
- Add `react-router-dom` dependency
- Update name to "educational-apps"
- Update scripts as needed

**1.2 Create shared component directory**
- Create `src/shared/` directory structure
- Create `src/shared/components/`, `src/shared/data/`, `src/shared/utils/`, `src/shared/hooks/`

**1.3 Create apps directory**
- Create `src/apps/` directory
- Create `src/apps/sun-in-sky/` subdirectory
- Create `src/apps/stellar-mass/` subdirectory

**1.4 Create app registry**
- Create `src/config/apps.js` with metadata for each app:
  ```javascript
  export const APPS = [
    {
      id: 'sun-in-sky',
      name: 'Sun in Sky',
      description: 'Explore solar position and seasons',
      icon: '☀️',
      path: '/sun-in-sky',
      component: lazy(() => import('../apps/sun-in-sky/SunInSkyApp.jsx'))
    },
    {
      id: 'stellar-mass',
      name: 'Stellar Mass Explorer',
      description: 'Discover gravity and celestial phenomena',
      icon: '🌌',
      path: '/stellar-mass',
      component: lazy(() => import('../apps/stellar-mass/StellarMassApp.jsx'))
    }
  ];
  ```

**1.5 Create parent App.jsx**
- Simple directory/homepage showing available apps
- Cards for each app with title, description, icon
- Navigation to individual apps
- Clean, minimal design

**1.6 Update main.jsx**
- Set up React Router
- Define routes for home and each app
- Lazy load app components

---

### Phase 2: Extract Shared Components

**2.1 Move Panel component**
- Move `src/components/panels/shared/Panel.jsx` → `src/shared/components/Panel/Panel.jsx`
- Update imports

**2.2 Extract and generalize LearnPanel**
- Move to `src/shared/components/LearnPanel/LearnPanel.jsx`
- Make it accept lessons via props instead of importing directly:
  ```javascript
  export function LearnPanel({
    isOpen,
    onToggle,
    lessons,              // Array of lesson objects
    onAppControl,         // Optional callback for app-specific controls
    showToggleButton = true
  })
  ```
- Remove hard-coded lesson imports
- Keep localStorage integration (app-scoped by key)

**2.3 Extract and generalize ChallengePanel**
- Move to `src/shared/components/ChallengePanel/ChallengePanel.jsx`
- Make it accept quiz questions via props:
  ```javascript
  export function ChallengePanel({
    isOpen,
    onToggle,
    questions,            // Array of question objects
    appId,                // For scoped localStorage
    showToggleButton = true
  })
  ```
- Update localStorage keys to be app-scoped: `${appId}:quiz-state`
- Keep badge system (shared across all apps)

**2.4 Move shared utilities**
- Move `src/utils/localStorage.js` → `src/shared/utils/localStorage.js`
- Move `src/utils/badgeLogic.js` → `src/shared/utils/badgeLogic.js`
- Move `src/hooks/useLocalStorage.js` → `src/shared/hooks/useLocalStorage.js`
- Update `STORAGE_KEYS` to support app-scoped keys:
  ```javascript
  export const getStorageKeys = (appId) => ({
    VERSION: `${appId}:version`,
    LESSON_PROGRESS: `${appId}:lesson-progress`,
    QUIZ_STATE: `${appId}:quiz-state`,
    BADGES: 'shared:badges',  // Shared across all apps
    PREFERENCES: `${appId}:preferences`
  });
  ```

**2.5 Move shared data**
- Move `src/data/badges.js` → `src/shared/data/badges.js`
- Update badge definitions to work across multiple apps

---

### Phase 3: Refactor Sun in Sky to Child App

**3.1 Move app-specific files**
- Move `src/App.jsx` → `src/apps/sun-in-sky/SunInSkyApp.jsx`
- Move `src/EarthVisualization.jsx` → `src/apps/sun-in-sky/EarthVisualization.jsx`
- Move `src/components/ARSunFinder.jsx` → `src/apps/sun-in-sky/ARSunFinder.jsx`
- Move `src/utils/lttb.js` → `src/apps/sun-in-sky/utils/lttb.js` (app-specific)
- Move `src/data/lessons/` → `src/apps/sun-in-sky/data/lessons/`

**3.2 Update SunInSkyApp.jsx**
- Import shared LearnPanel and ChallengePanel
- Pass lessons and questions as props:
  ```javascript
  import { LearnPanel } from '../../shared/components/LearnPanel/LearnPanel.jsx';
  import { ChallengePanel } from '../../shared/components/ChallengePanel/ChallengePanel.jsx';
  import elementaryData from './data/lessons/elementary.json';
  // ... other imports

  const ALL_LESSONS = [...]; // Combine lessons
  const ALL_QUESTIONS = [...]; // Combine quiz questions

  // In component:
  <LearnPanel
    isOpen={learnPanelOpen}
    onToggle={() => setLearnPanelOpen(!learnPanelOpen)}
    lessons={ALL_LESSONS}
    onAppControl={handleAppControl}  // For lesson interactions
  />

  <ChallengePanel
    isOpen={challengePanelOpen}
    onToggle={() => setChallengePanelOpen(!challengePanelOpen)}
    questions={ALL_QUESTIONS}
    appId="sun-in-sky"
  />
  ```

**3.3 Update imports**
- Fix all import paths to reference shared components
- Update utility imports
- Ensure localStorage uses app-scoped keys

**3.4 Test sun-in-sky app**
- Verify all functionality works
- Check localStorage persistence
- Confirm Learn and Challenge panels function correctly

---

### Phase 4: Create Stellar Mass Explorer App

**4.1 Create app structure**
- Create `src/apps/stellar-mass/StellarMassApp.jsx`
- Create `src/apps/stellar-mass/MassVisualization.jsx`
- Create `src/apps/stellar-mass/data/lessons/` directory

**4.2 Design visualization component**

Main visualization features:
- **X-axis**: Mass (in solar masses, logarithmic scale: 10^-10 to 10^2)
- **Y-axis**: Different stages/phenomena based on mass
- **Interactive mass slider**: Adjust current mass
- **Visual indicators** for key thresholds:
  - **Planets** (< 0.013 M☉): Insufficient mass for fusion
    - Gas giants, rocky planets, dwarf planets
  - **Brown Dwarfs** (0.013 - 0.08 M☉): Failed stars, deuterium fusion only
  - **Red Dwarfs** (0.08 - 0.5 M☉): Smallest true stars
  - **Sun-like Stars** (0.5 - 8 M☉): Main sequence hydrogen fusion
  - **Massive Stars** (8 - 40 M☉): Carbon/oxygen core formation
  - **Supermassive Stars** (40 - 150 M☉): Risk of pair-instability supernova
  - **Neutron Star** (remnant 1.4 - 2.16 M☉): Neutron degeneracy pressure
  - **Black Hole** (remnant > 2.16 M☉): Gravitational collapse

**Related phenomena visualization** (side panel or overlays):
- **Tidal forces**: Strength vs distance (Roche limit)
- **Spaghettification**: Tidal force gradient visualization
- **Gravitational lensing**: Light bending simulation
- **Time dilation**: Clock speed comparison at different gravitational potentials
- **Orbital mechanics**: Stable orbit zones

**4.3 Implement StellarMassApp.jsx**

Key features:
```javascript
const [mass, setMass] = useState(1.0); // Solar masses
const [viewMode, setViewMode] = useState('lifecycle'); // 'lifecycle' or 'phenomena'
const [selectedPhenomenon, setSelectedPhenomenon] = useState(null);
const [showVisualization, setShowVisualization] = useState(true);

// State for panels
const [learnPanelOpen, setLearnPanelOpen] = useState(false);
const [challengePanelOpen, setChallengePanelOpen] = useState(false);
```

Main sections:
1. **2D Mass Scale Chart**: Horizontal logarithmic scale showing mass categories
2. **3D Visualization**: Three.js scene showing:
   - Celestial body (scaled by mass)
   - Gravitational field visualization
   - Phenomenon demonstrations (lensing, tidal forces, etc.)
3. **Controls**: Mass slider, view mode toggle, phenomenon selector
4. **Info Display**: Current mass, category, key properties
5. **Learn Panel**: Educational content about mass and gravity
6. **Challenge Panel**: Quiz questions

**4.4 Create lesson content**

Create three difficulty levels of lessons:

**Elementary lessons** (`elementary.json`):
1. "What is Mass?" - Basic concept of mass vs weight
2. "Gravity Basics" - Why things fall, gravity as attraction
3. "Planets and Stars" - Different types of objects in space
4. "The Sun and Earth" - Our star and planet
5. "Why Objects Orbit" - Basic orbital mechanics

**Middle School lessons** (`middle-school.json`):
1. "Mass and Fusion" - How stars create energy
2. "Stellar Lifecycles" - Birth, life, and death of stars
3. "Black Holes Basics" - What happens when gravity wins
4. "Tidal Forces" - Why the Moon causes tides
5. "Escape Velocity" - Breaking free from gravity
6. "Neutron Stars" - Ultra-dense stellar remnants

**High School lessons** (`high-school.json`):
1. "Degeneracy Pressure" - Quantum mechanics saving the day
2. "Chandrasekhar Limit" - Maximum mass for white dwarfs
3. "TOV Limit" - Maximum mass for neutron stars
4. "Schwarzschild Radius" - Event horizon calculations
5. "Gravitational Time Dilation" - General relativity effects
6. "Gravitational Lensing" - Light bending around mass
7. "Tidal Disruption" - Spaghettification physics
8. "Pair-Instability Supernovae" - Largest stellar explosions

**4.5 Create quiz questions**
- Generate quiz questions from lesson content
- Use `npm run process-lessons` script
- Ensure questions test understanding of mass, gravity, fusion, etc.

**4.6 Implement 3D visualization**
- Use Three.js and React Three Fiber
- Show celestial body appropriate to current mass
- Visualize selected phenomenon (lensing, tidal forces, etc.)
- Interactive controls (rotate, zoom)

**4.7 Add controls and interactions**
- Mass slider (logarithmic scale)
- View mode toggle (lifecycle vs phenomena)
- Phenomenon selector buttons
- Preset buttons (Earth, Jupiter, Sun, Neutron Star, Black Hole)
- Visual indicators for thresholds

**4.8 Integrate Learn and Challenge panels**
```javascript
import { LearnPanel } from '../../shared/components/LearnPanel/LearnPanel.jsx';
import { ChallengePanel } from '../../shared/components/ChallengePanel/ChallengePanel.jsx';
import elementaryData from './data/lessons/elementary.json';
import middleSchoolData from './data/lessons/middle-school.json';
import highSchoolData from './data/lessons/high-school.json';

const ALL_LESSONS = [
  ...elementaryData.lessons.map((lesson, index) => ({
    ...lesson,
    number: index + 1,
    difficulty: 'Beginner'
  })),
  // ... similar for middle school and high school
];

const ALL_QUESTIONS = [
  ...(elementaryData.quiz?.questions || []),
  ...(middleSchoolData.quiz?.questions || []),
  ...(highSchoolData.quiz?.questions || [])
];

// In component:
<LearnPanel
  isOpen={learnPanelOpen}
  onToggle={() => setLearnPanelOpen(!learnPanelOpen)}
  lessons={ALL_LESSONS}
/>

<ChallengePanel
  isOpen={challengePanelOpen}
  onToggle={() => setChallengePanelOpen(!challengePanelOpen)}
  questions={ALL_QUESTIONS}
  appId="stellar-mass"
/>
```

---

### Phase 5: Parent App UI

**5.1 Create home page component**
- Create `src/components/HomePage.jsx`
- Grid/card layout showing available apps
- Each card includes:
  - App icon (emoji or SVG)
  - App name
  - Short description
  - "Launch" button → navigates to app

**5.2 Add navigation**
- Header with "Educational Apps" title
- "Home" button (visible when in an app)
- Breadcrumb navigation
- Clean, minimal styling

**5.3 Create app routing**
```javascript
// main.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { APPS } from './config/apps';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          {APPS.map(app => (
            <Route
              key={app.id}
              path={app.path}
              element={<app.component />}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```

**5.4 Style parent app**
- Consistent color scheme across all apps
- Responsive design
- Smooth transitions between apps
- Loading states for lazy-loaded apps

---

### Phase 6: Testing and Refinement

**6.1 Test sun-in-sky app**
- All original functionality works
- Learn panel displays lessons correctly
- Challenge panel shows questions and tracks progress
- localStorage persistence works
- Badge system functions
- 3D Earth visualization renders
- AR mode works (mobile)
- All controls and interactions work

**6.2 Test stellar-mass app**
- Visualization renders correctly
- Mass slider updates visualization
- Thresholds are clearly marked
- Phenomena demonstrations work
- Learn panel shows mass-specific lessons
- Challenge panel shows mass-specific questions
- localStorage is scoped to app (separate from sun-in-sky)

**6.3 Test shared components**
- LearnPanel works identically in both apps
- ChallengePanel works identically in both apps
- Badge system tracks progress across both apps
- localStorage doesn't conflict between apps
- Shared utilities function correctly

**6.4 Test parent app**
- Home page displays both apps
- Navigation works smoothly
- Routing is correct
- Lazy loading works
- Back button works as expected
- Direct URL navigation works

**6.5 Cross-browser testing**
- Chrome, Firefox, Safari, Edge
- Mobile browsers
- Different screen sizes
- Performance is acceptable

**6.6 Accessibility**
- Keyboard navigation works
- Screen reader compatibility
- Color contrast is sufficient
- Focus indicators are visible

---

## Data Structure for Lessons

Each app should follow this structure for lesson data:

**Lesson JSON format** (`elementary.json`, `middle-school.json`, `high-school.json`):
```json
{
  "difficulty": "Elementary",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Lesson Title",
      "content": "Markdown content here...",
      "interactivity": {
        "type": "app-control",
        "description": "Optional interactive elements",
        "controls": []
      }
    }
  ]
}
```

**Quiz JSON format** (generated from lessons):
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "answers": {
        "A": "Answer A",
        "B": "Answer B",
        "C": "Answer C",
        "D": "Answer D"
      },
      "correct": "A",
      "explanation": "Why A is correct..."
    }
  ]
}
```

---

## localStorage Scoping Strategy

**App-specific data**:
- `sun-in-sky:lesson-progress`
- `sun-in-sky:quiz-state`
- `sun-in-sky:preferences`
- `stellar-mass:lesson-progress`
- `stellar-mass:quiz-state`
- `stellar-mass:preferences`

**Shared data** (across all apps):
- `shared:badges` - Badge collection shared across all apps
- `shared:user-profile` - Optional user info
- `shared:settings` - Global app settings

This allows:
1. Independent progress tracking per app
2. Shared badge collection (encourages exploration of all apps)
3. No data conflicts between apps

---

## New Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "react-router-dom": "^7.1.1"
  }
}
```

---

## Future Expansion

This architecture makes it easy to add more educational apps:

**Potential future apps**:
1. **Orbital Mechanics** - Kepler's laws, transfer orbits, launch windows
2. **Electromagnetic Spectrum** - Wavelengths, energy, applications
3. **Planetary Atmospheres** - Composition, pressure, greenhouse effect
4. **Lunar Phases** - Moon position, illumination, eclipses
5. **Stellar Evolution** - H-R diagram, stellar classes, lifecycles
6. **Exoplanet Detection** - Transit method, radial velocity, direct imaging

Each new app only requires:
1. Create `src/apps/[app-name]/` directory
2. Implement main visualization component
3. Create lesson content (3 difficulty levels)
4. Add entry to `src/config/apps.js`
5. Update routing in `main.jsx`

---

## Migration Checklist

- [ ] Phase 1: Create parent application structure
  - [ ] Update package.json
  - [ ] Create directory structure
  - [ ] Create app registry
  - [ ] Create parent App.jsx
  - [ ] Update main.jsx with routing

- [ ] Phase 2: Extract shared components
  - [ ] Move Panel component
  - [ ] Generalize LearnPanel
  - [ ] Generalize ChallengePanel
  - [ ] Move shared utilities
  - [ ] Move shared data

- [ ] Phase 3: Refactor sun-in-sky
  - [ ] Move app files
  - [ ] Update imports
  - [ ] Integrate shared panels
  - [ ] Test functionality

- [ ] Phase 4: Create stellar-mass app
  - [ ] Create app structure
  - [ ] Implement visualization
  - [ ] Create lesson content
  - [ ] Integrate shared panels
  - [ ] Test functionality

- [ ] Phase 5: Parent app UI
  - [ ] Create home page
  - [ ] Add navigation
  - [ ] Set up routing
  - [ ] Style parent app

- [ ] Phase 6: Testing
  - [ ] Test sun-in-sky app
  - [ ] Test stellar-mass app
  - [ ] Test shared components
  - [ ] Test parent app
  - [ ] Cross-browser testing
  - [ ] Accessibility testing

---

## Success Criteria

The refactoring is complete when:

1. **Parent app works**: Homepage displays both apps, navigation is smooth
2. **Sun-in-sky app works**: All original functionality preserved
3. **Stellar-mass app works**: New app fully functional with Learn and Challenge
4. **Shared components work**: LearnPanel and ChallengePanel function identically in both apps
5. **No code duplication**: Learn and Challenge logic exists in one place only
6. **localStorage works**: App-scoped data doesn't conflict, badges are shared
7. **Easy to extend**: Adding a new app requires minimal boilerplate
8. **Tests pass**: All functionality tested and verified

---

## Timeline Estimate

- **Phase 1**: 1-2 hours (structure and configuration)
- **Phase 2**: 2-3 hours (extracting and generalizing shared components)
- **Phase 3**: 1-2 hours (refactoring sun-in-sky)
- **Phase 4**: 4-6 hours (creating stellar-mass app and content)
- **Phase 5**: 1-2 hours (parent app UI)
- **Phase 6**: 2-3 hours (testing and refinement)

**Total**: ~11-18 hours of development

---

Last updated: December 2025
