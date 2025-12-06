# Sun in Sky - Solar Altitude Visualization

An interactive visualization of solar altitude throughout the day and year, built with React and Vite.

## Features

- **Dual View Modes**: Switch between 24-hour daily view and 365-day yearly view
- **Interactive Controls**: Adjust latitude, axial tilt, date, and time of day
- **Astronomical Accuracy**: Calculates sun position based on real astronomical formulas
- **Educational**: Visualize concepts like midnight sun, polar night, equinoxes, and solstices
- **Planetary Presets**: Compare Earth, Mars, and Uranus axial tilts
- **Responsive Design**: Adapts to different screen sizes

## Tech Stack

- **React** 19.2.1
- **Vite** 7.2.6
- **@vitejs/plugin-react** 5.1.1

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Opens development server at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Creates optimized production build in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## How to Use

1. **View Mode**: Toggle between "24 Hours" (daily) and "365 Days" (yearly) views
2. **Time Controls**: Use the play button or drag the timeline to animate sun movement
3. **Latitude**: Adjust to see how sun altitude changes at different latitudes
4. **Axial Tilt**: Experiment with different planetary tilts (0° to 90°)
5. **Quick Presets**: Click preset buttons for equinoxes, solstices, and key times of day

## Educational Notes

- **Horizon Line**: Orange dashed line at 0° - separates day from night
- **Equinox Reference**: Gray dashed line shows sun path during equinoxes
- **Seasonal Markers**: Year view shows spring, summer, fall, and winter markers
- **Arctic Circle**: Marked on latitude slider - regions that experience midnight sun/polar night

## Requirements

- Node.js 20.19+ or 22.12+

## License

Created from a Claude artifact conversation.
