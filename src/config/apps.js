import { lazy } from 'react';

/**
 * Registry of all available educational apps
 * Each app must have: id, name, description, icon, path, component
 */
export const APPS = [
  {
    id: 'sun-in-sky',
    name: 'Sun in Sky',
    description: 'Explore solar position, seasons, and how the sun moves across the sky throughout the day and year',
    icon: '☀️',
    path: '/sun-in-sky',
    component: lazy(() => import('../apps/sun-in-sky/SunInSkyApp.jsx'))
  },
  {
    id: 'stellar-mass',
    name: 'Stellar Mass Explorer',
    description: 'Discover how mass determines stellar fate, from planets to black holes, with gravitational phenomena',
    icon: '🌌',
    path: '/stellar-mass',
    component: lazy(() => import('../apps/stellar-mass/StellarMassApp.jsx'))
  }
];
