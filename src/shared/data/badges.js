/**
 * Badge Definitions for Sun in Sky
 * Students earn badges by completing lessons and answering quiz questions
 */

export const BADGE_CATEGORIES = {
  LEARNING: 'learning',
  QUIZ: 'quiz',
  EXPLORATION: 'exploration',
  EXPERT: 'expert'
};

export const BADGES = [
  // Learning Milestones
  {
    id: 'first-lesson',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'Getting Started',
    description: 'Complete your first lesson',
    icon: '🌟',
    requirement: { type: 'lessons_completed', count: 1 },
    points: 10
  },
  {
    id: 'elem-complete',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'Elementary Graduate',
    description: 'Complete all elementary lessons',
    icon: '🎓',
    requirement: { type: 'grade_complete', grade: 'elementary' },
    points: 50
  },
  {
    id: 'middle-complete',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'Middle School Master',
    description: 'Complete all middle school lessons',
    icon: '🏫',
    requirement: { type: 'grade_complete', grade: 'middle-school' },
    points: 75
  },
  {
    id: 'high-complete',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'High School Scholar',
    description: 'Complete all high school lessons',
    icon: '🎯',
    requirement: { type: 'grade_complete', grade: 'high-school' },
    points: 100
  },
  {
    id: 'speed-learner',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'Speed Learner',
    description: 'Complete a lesson in under 10 minutes',
    icon: '⚡',
    requirement: { type: 'lesson_time', maxSeconds: 600 },
    points: 15
  },
  {
    id: 'all-lessons',
    category: BADGE_CATEGORIES.LEARNING,
    name: 'Master Student',
    description: 'Complete all lessons across all grade levels',
    icon: '👑',
    requirement: { type: 'all_lessons' },
    points: 250
  },

  // Quiz Achievements
  {
    id: 'first-correct',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'First Success',
    description: 'Answer your first question correctly',
    icon: '✅',
    requirement: { type: 'correct_answers', count: 1 },
    points: 5
  },
  {
    id: 'streak-3',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'On a Roll',
    description: '3 correct answers in a row',
    icon: '🎲',
    requirement: { type: 'streak', count: 3 },
    points: 10
  },
  {
    id: 'streak-5',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'Hot Streak',
    description: '5 correct answers in a row',
    icon: '🔥',
    requirement: { type: 'streak', count: 5 },
    points: 20
  },
  {
    id: 'streak-10',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'Perfect Ten',
    description: '10 correct answers in a row',
    icon: '💯',
    requirement: { type: 'streak', count: 10 },
    points: 50
  },
  {
    id: 'quiz-master',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'Quiz Master',
    description: 'Answer 50 questions correctly',
    icon: '🏆',
    requirement: { type: 'correct_answers', count: 50 },
    points: 75
  },
  {
    id: 'quiz-legend',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'Quiz Legend',
    description: 'Answer 100 questions correctly',
    icon: '🌟',
    requirement: { type: 'correct_answers', count: 100 },
    points: 150
  },
  {
    id: 'no-mistakes',
    category: BADGE_CATEGORIES.QUIZ,
    name: 'Perfectionist',
    description: 'Answer 20 questions with zero wrong answers',
    icon: '💎',
    requirement: { type: 'perfect_run', count: 20 },
    points: 100
  },

  // Exploration
  {
    id: 'polar-explorer',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Polar Explorer',
    description: 'Explore both North and South poles',
    icon: '🧊',
    requirement: { type: 'explore_poles' },
    points: 15
  },
  {
    id: 'equator-expert',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Equator Expert',
    description: 'Study the equator (0° latitude)',
    icon: '🌍',
    requirement: { type: 'explore_latitude', lat: 0 },
    points: 10
  },
  {
    id: 'midnight-sun',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Midnight Sun Seeker',
    description: 'Witness the midnight sun phenomenon',
    icon: '☀️',
    requirement: { type: 'midnight_sun' },
    points: 20
  },
  {
    id: 'polar-night',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Polar Night Explorer',
    description: 'Experience polar night',
    icon: '🌙',
    requirement: { type: 'polar_night' },
    points: 20
  },
  {
    id: 'four-seasons',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Season Traveler',
    description: 'Explore all four seasonal dates',
    icon: '🍂',
    requirement: { type: 'four_seasons' },
    points: 15
  },
  {
    id: 'world-traveler',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'World Traveler',
    description: 'Visit all latitude presets',
    icon: '✈️',
    requirement: { type: 'all_latitudes' },
    points: 25
  },
  {
    id: 'planet-comparison',
    category: BADGE_CATEGORIES.EXPLORATION,
    name: 'Planetary Scientist',
    description: 'Compare Earth to other planets using axial tilt',
    icon: '🪐',
    requirement: { type: 'planet_tilts', count: 3 },
    points: 30
  },

  // Expert Status
  {
    id: 'solar-expert',
    category: BADGE_CATEGORIES.EXPERT,
    name: 'Solar Expert',
    description: 'Complete all lessons and answer 100 questions correctly',
    icon: '☀️',
    requirement: { type: 'expert_combo', lessons: 'all', correctAnswers: 100 },
    points: 200
  },
  {
    id: 'astronomy-ace',
    category: BADGE_CATEGORIES.EXPERT,
    name: 'Astronomy Ace',
    description: 'Achieve 90% or higher accuracy on 50 questions',
    icon: '🔭',
    requirement: { type: 'high_accuracy', accuracy: 0.9, minQuestions: 50 },
    points: 150
  },
  {
    id: 'dedication',
    category: BADGE_CATEGORIES.EXPERT,
    name: 'Dedicated Learner',
    description: 'Return to the app for 7 consecutive days',
    icon: '📚',
    requirement: { type: 'daily_streak', days: 7 },
    points: 100
  }
];

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId) {
  return BADGES.find(badge => badge.id === badgeId);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category) {
  return BADGES.filter(badge => badge.category === category);
}

/**
 * Calculate total possible points
 */
export function getTotalPossiblePoints() {
  return BADGES.reduce((total, badge) => total + badge.points, 0);
}

/**
 * Get badge tier based on points
 */
export function getBadgeTier(points) {
  if (points >= 1000) return { name: 'Grand Master', icon: '👑', color: '#FFD700' };
  if (points >= 500) return { name: 'Master', icon: '🏆', color: '#C0C0C0' };
  if (points >= 250) return { name: 'Expert', icon: '⭐', color: '#CD7F32' };
  if (points >= 100) return { name: 'Advanced', icon: '🌟', color: '#4ade80' };
  if (points >= 50) return { name: 'Intermediate', icon: '💫', color: '#60a5fa' };
  if (points >= 10) return { name: 'Beginner', icon: '🌱', color: '#a78bfa' };
  return { name: 'Newcomer', icon: '🐣', color: '#9ca3af' };
}
