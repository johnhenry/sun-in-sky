/**
 * Badge Logic - Determines when badges are earned
 */

import { BADGES } from '../data/badges';

/**
 * Check all badges and return newly earned ones
 * @param {Object} state - Current app state (lessons, quiz, exploration)
 * @param {Array} earnedBadges - Badges already earned
 * @returns {Array} - Array of newly earned badge IDs
 */
export function checkForNewBadges(state, earnedBadges = []) {
  const newlyEarned = [];
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  for (const badge of BADGES) {
    // Skip already earned badges
    if (earnedIds.has(badge.id)) continue;

    // Check if badge requirements are met
    if (checkBadgeRequirement(badge, state)) {
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}

/**
 * Check if a specific badge's requirements are met
 */
function checkBadgeRequirement(badge, state) {
  const { requirement } = badge;

  switch (requirement.type) {
    // Learning-related badges
    case 'lessons_completed':
      return getTotalLessonsCompleted(state.lessonProgress) >= requirement.count;

    case 'grade_complete':
      return isGradeComplete(state.lessonProgress, requirement.grade);

    case 'all_lessons':
      return isGradeComplete(state.lessonProgress, 'elementary') &&
             isGradeComplete(state.lessonProgress, 'middle-school') &&
             isGradeComplete(state.lessonProgress, 'high-school');

    case 'lesson_time':
      return hasLessonCompletedInTime(state.lessonProgress, requirement.maxSeconds);

    // Quiz-related badges
    case 'correct_answers':
      return state.quizState.correctAnswers >= requirement.count;

    case 'streak':
      return state.quizState.streaks.longest >= requirement.count;

    case 'perfect_run':
      return hasPerfectRun(state.quizState, requirement.count);

    case 'high_accuracy':
      return hasHighAccuracy(state.quizState, requirement.accuracy, requirement.minQuestions);

    // Exploration-related badges
    case 'explore_poles':
      return hasExploredPoles(state.exploration);

    case 'explore_latitude':
      return hasExploredLatitude(state.exploration, requirement.lat);

    case 'midnight_sun':
      return hasSeenMidnightSun(state.exploration);

    case 'polar_night':
      return hasSeenPolarNight(state.exploration);

    case 'four_seasons':
      return hasExploredSeasons(state.exploration);

    case 'all_latitudes':
      return hasExploredAllLatitudes(state.exploration);

    case 'planet_tilts':
      return hasExploredPlanetTilts(state.exploration, requirement.count);

    // Expert-level badges
    case 'expert_combo':
      return getTotalLessonsCompleted(state.lessonProgress) >= requirement.lessons &&
             state.quizState.correctAnswers >= requirement.correctAnswers;

    case 'daily_streak':
      return hasDailyStreak(state.preferences, requirement.days);

    default:
      console.warn(`Unknown badge requirement type: ${requirement.type}`);
      return false;
  }
}

// Helper functions for checking specific requirements

function getTotalLessonsCompleted(lessonProgress) {
  let total = 0;
  for (const grade in lessonProgress) {
    for (const lessonId in lessonProgress[grade]) {
      if (lessonProgress[grade][lessonId].completed) {
        total++;
      }
    }
  }
  return total;
}

function isGradeComplete(lessonProgress, grade) {
  const gradeLessons = lessonProgress[grade] || {};
  const lessonIds = Object.keys(gradeLessons);

  // Need at least some lessons to be complete
  if (lessonIds.length === 0) return false;

  // Check if all lessons in grade are marked complete
  return lessonIds.every(id => gradeLessons[id].completed);
}

function hasLessonCompletedInTime(lessonProgress, maxSeconds) {
  for (const grade in lessonProgress) {
    for (const lessonId in lessonProgress[grade]) {
      const lesson = lessonProgress[grade][lessonId];
      if (lesson.completed && lesson.timeSpent && lesson.timeSpent <= maxSeconds) {
        return true;
      }
    }
  }
  return false;
}

function hasPerfectRun(quizState, count) {
  const { answeredQuestions } = quizState;
  const questionIds = Object.keys(answeredQuestions);

  // Check if there's a sequence of 'count' consecutive correct answers
  let consecutiveCorrect = 0;

  for (const qid of questionIds) {
    if (answeredQuestions[qid].correct) {
      consecutiveCorrect++;
      if (consecutiveCorrect >= count) return true;
    } else {
      consecutiveCorrect = 0;
    }
  }

  return false;
}

function hasHighAccuracy(quizState, requiredAccuracy, minQuestions) {
  const { correctAnswers, incorrectAnswers } = quizState;
  const totalAnswered = correctAnswers + incorrectAnswers;

  if (totalAnswered < minQuestions) return false;

  const accuracy = correctAnswers / totalAnswered;
  return accuracy >= requiredAccuracy;
}

function hasExploredPoles(exploration) {
  if (!exploration || !exploration.latitudesVisited) return false;
  const visited = exploration.latitudesVisited;
  return visited.includes(90) && visited.includes(-90);
}

function hasExploredLatitude(exploration, targetLat) {
  if (!exploration || !exploration.latitudesVisited) return false;
  return exploration.latitudesVisited.includes(targetLat);
}

function hasSeenMidnightSun(exploration) {
  if (!exploration || !exploration.phenomena) return false;
  return exploration.phenomena.includes('midnight-sun');
}

function hasSeenPolarNight(exploration) {
  if (!exploration || !exploration.phenomena) return false;
  return exploration.phenomena.includes('polar-night');
}

function hasExploredSeasons(exploration) {
  if (!exploration || !exploration.datesVisited) return false;
  const requiredDates = ['Mar Equinox', 'Jun Solstice', 'Sep Equinox', 'Dec Solstice'];
  return requiredDates.every(date => exploration.datesVisited.includes(date));
}

function hasExploredAllLatitudes(exploration) {
  if (!exploration || !exploration.latitudesVisited) return false;
  const presets = [-90, -66.5, -23.5, 0, 23.5, 45, 66.5, 90];
  return presets.every(lat => exploration.latitudesVisited.includes(lat));
}

function hasExploredPlanetTilts(exploration, minCount) {
  if (!exploration || !exploration.tiltsExplored) return false;
  return exploration.tiltsExplored.length >= minCount;
}

function hasDailyStreak(preferences, days) {
  if (!preferences || !preferences.visitHistory) return false;

  const today = new Date().toDateString();
  const visitDates = preferences.visitHistory.map(d => new Date(d).toDateString());

  // Check if there are 'days' consecutive visits
  let streak = 0;
  let checkDate = new Date();

  for (let i = 0; i < days; i++) {
    const dateStr = checkDate.toDateString();
    if (visitDates.includes(dateStr)) {
      streak++;
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak >= days;
}

/**
 * Calculate progress toward a badge
 * Returns a percentage (0-100) of how close user is to earning the badge
 */
export function getBadgeProgress(badge, state) {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'lessons_completed': {
      const completed = getTotalLessonsCompleted(state.lessonProgress);
      return Math.min(100, (completed / requirement.count) * 100);
    }

    case 'correct_answers': {
      const correct = state.quizState.correctAnswers;
      return Math.min(100, (correct / requirement.count) * 100);
    }

    case 'streak': {
      const current = state.quizState.streaks.current;
      return Math.min(100, (current / requirement.count) * 100);
    }

    // Add more cases as needed

    default:
      return 0;
  }
}

/**
 * Get user's total points from earned badges
 */
export function calculateTotalPoints(earnedBadges) {
  return earnedBadges.reduce((total, badge) => total + (badge.points || 0), 0);
}

/**
 * Award a badge to the user
 * Returns badge object with earned timestamp
 */
export function awardBadge(badgeId) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) {
    console.error(`Badge not found: ${badgeId}`);
    return null;
  }

  return {
    ...badge,
    earnedAt: new Date().toISOString()
  };
}
