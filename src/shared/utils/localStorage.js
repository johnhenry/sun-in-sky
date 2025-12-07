/**
 * Local Storage Utilities for Educational Apps
 * Manages all localStorage operations with error handling and migrations
 * Supports app-scoped storage keys for multi-app architecture
 */

const STORAGE_VERSION = 1;

/**
 * Generate app-scoped storage keys
 * Badges are shared across all apps, other data is app-specific
 */
export function getStorageKeys(appId) {
  return {
    VERSION: `${appId}:version`,
    LESSON_PROGRESS: `${appId}:lesson-progress`,
    QUIZ_STATE: `${appId}:quiz-state`,
    BADGES: 'shared:badges',  // Shared across all apps
    PREFERENCES: `${appId}:preferences`,
    TIMESTAMP: `${appId}:last-updated`
  };
}

// Legacy support for sun-in-sky app
export const STORAGE_KEYS = getStorageKeys('sun-in-sky');

/**
 * Safely get item from localStorage with JSON parsing
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safely set item to localStorage with JSON stringification
 */
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider clearing old data.');
    }
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all app data from localStorage
 */
export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Initialize storage with default values
 * @param {string} appId - The app identifier for scoped storage
 */
export function initializeStorage(appId = 'sun-in-sky') {
  const KEYS = getStorageKeys(appId);
  const version = getStorageItem(KEYS.VERSION, 0);

  if (version < STORAGE_VERSION) {
    migrateStorage(version, STORAGE_VERSION, KEYS);
  }

  // Initialize lesson progress if not exists
  if (!getStorageItem(KEYS.LESSON_PROGRESS)) {
    setStorageItem(KEYS.LESSON_PROGRESS, {});
  }

  // Initialize quiz state if not exists
  if (!getStorageItem(KEYS.QUIZ_STATE)) {
    setStorageItem(KEYS.QUIZ_STATE, {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      answeredQuestions: {},
      streaks: {
        current: 0,
        longest: 0
      }
    });
  }

  // Initialize badges if not exists (shared across all apps)
  if (!getStorageItem(KEYS.BADGES)) {
    setStorageItem(KEYS.BADGES, {
      earned: [],
      progress: {}
    });
  }

  // Initialize preferences if not exists
  if (!getStorageItem(KEYS.PREFERENCES)) {
    setStorageItem(KEYS.PREFERENCES, {
      preferredGradeLevel: 'elementary',
      learnPanelDefaultOpen: false,
      challengePanelDefaultOpen: false,
      soundEffects: false,
      animations: true
    });
  }
}

/**
 * Migrate storage from old version to new version
 */
function migrateStorage(fromVersion, toVersion, storageKeys) {
  // Future migrations would go here
  // if (fromVersion < 1) migrateToV1();
  // if (fromVersion < 2) migrateToV2();

  setStorageItem(storageKeys.VERSION, toVersion);
}

/**
 * Export all data as JSON for backup
 */
export function exportData() {
  const data = {
    version: STORAGE_VERSION,
    exportDate: new Date().toISOString(),
    lessonProgress: getStorageItem(STORAGE_KEYS.LESSON_PROGRESS),
    quizState: getStorageItem(STORAGE_KEYS.QUIZ_STATE),
    badges: getStorageItem(STORAGE_KEYS.BADGES),
    preferences: getStorageItem(STORAGE_KEYS.PREFERENCES)
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON backup
 */
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (data.version > STORAGE_VERSION) {
      throw new Error('Data is from a newer version of the app');
    }

    if (data.lessonProgress) {
      setStorageItem(STORAGE_KEYS.LESSON_PROGRESS, data.lessonProgress);
    }
    if (data.quizState) {
      setStorageItem(STORAGE_KEYS.QUIZ_STATE, data.quizState);
    }
    if (data.badges) {
      setStorageItem(STORAGE_KEYS.BADGES, data.badges);
    }
    if (data.preferences) {
      setStorageItem(STORAGE_KEYS.PREFERENCES, data.preferences);
    }

    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
  let totalSize = 0;
  const stats = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const item = localStorage.getItem(key);
    const size = item ? new Blob([item]).size : 0;
    stats[name] = {
      key,
      size,
      sizeKB: (size / 1024).toFixed(2)
    };
    totalSize += size;
  });

  return {
    individual: stats,
    total: {
      size: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2),
      sizeMB: (totalSize / 1024 / 1024).toFixed(2)
    }
  };
}
