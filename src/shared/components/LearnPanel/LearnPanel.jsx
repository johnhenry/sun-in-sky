import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Panel from '../Panel/Panel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getStorageKeys } from '../../utils/localStorage';
import './LearnPanel.css';

/**
 * LearnPanel - Shared educational content panel component
 * @param {boolean} isOpen - Whether the panel is open
 * @param {function} onToggle - Callback to toggle panel
 * @param {Array} lessons - Array of lesson objects with structure:
 *   { id, title, content, difficulty, number }
 * @param {string} appId - App identifier for scoped localStorage
 * @param {function} onAppControl - Optional callback for app-specific controls
 * @param {boolean} showToggleButton - Whether to show the toggle button
 */
export default function LearnPanel({
  isOpen,
  onToggle,
  lessons = [],
  appId = 'app',
  onAppControl,
  showToggleButton = true
}) {
  const STORAGE_KEYS = getStorageKeys(appId);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonProgress, setLessonProgress] = useLocalStorage(STORAGE_KEYS.LESSON_PROGRESS, {});

  const currentLesson = lessons[currentLessonIndex];

  // Mark lesson as visited
  useEffect(() => {
    if (currentLesson && isOpen) {
      const lessonId = currentLesson.id;
      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          lastVisited: new Date().toISOString(),
          viewed: true
        }
      }));
    }
  }, [currentLesson, isOpen, setLessonProgress]);

  const handleLessonSelect = (index) => {
    setCurrentLessonIndex(index);
  };

  const handleMarkComplete = () => {
    if (!currentLesson) return;

    const lessonId = currentLesson.id;
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        completed: true,
        completedAt: new Date().toISOString()
      }
    }));
  };

  const isLessonCompleted = (lessonId) => {
    return lessonProgress[lessonId]?.completed || false;
  };

  const getCompletionCount = () => {
    return Object.values(lessonProgress).filter(l => l.completed).length;
  };

  return (
    <Panel
      side="left"
      isOpen={isOpen}
      onToggle={onToggle}
      title="Learn"
      icon="📚"
      accentColor="#8c7ae6"
      width={420}
      showToggleButton={showToggleButton}
    >
      {/* Lesson Navigator */}
      <div className="lesson-navigator">
        <div className="panel-section-title">
          Lessons ({getCompletionCount()}/{lessons.length} completed)
        </div>
        <div className="lesson-list">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              className={`lesson-card ${currentLessonIndex === index ? 'active' : ''} ${
                isLessonCompleted(lesson.id) ? 'completed' : ''
              }`}
              onClick={() => handleLessonSelect(index)}
              aria-label={`Lesson ${lesson.number}: ${lesson.title}`}
            >
              <div className="lesson-number">
                {isLessonCompleted(lesson.id) ? '✓' : lesson.number}
              </div>
              <div className="lesson-info">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-difficulty">{lesson.difficulty}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-divider" />

      {/* Current Lesson Content */}
      {currentLesson && (
        <div className="lesson-content">
          <div className="lesson-header">
            <div>
              <h3>Lesson {currentLesson.number}: {currentLesson.title}</h3>
              <span className="lesson-difficulty-badge">{currentLesson.difficulty}</span>
            </div>
            {!isLessonCompleted(currentLesson.id) && (
              <button
                className="mark-complete-btn"
                onClick={handleMarkComplete}
                aria-label="Mark lesson as complete"
              >
                Mark Complete
              </button>
            )}
            {isLessonCompleted(currentLesson.id) && (
              <span className="completed-badge">✓ Completed</span>
            )}
          </div>

          <div className="lesson-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom rendering for interactive elements
                p: ({ children }) => {
                  const text = String(children);

                  // Detect app control prompts
                  if (text.includes('Click') || text.includes('Set')) {
                    return <p className="interactive-prompt">{children}</p>;
                  }
                  return <p>{children}</p>;
                },
                li: ({ children }) => {
                  const text = String(children);

                  // Make list items clickable if they contain app instructions
                  if (text.includes('latitude') || text.includes('view') ||
                      text.includes('Solstice') || text.includes('Equinox')) {
                    return (
                      <li className="interactive-item">
                        {children}
                      </li>
                    );
                  }
                  return <li>{children}</li>;
                }
              }}
            >
              {currentLesson.content.join('\n')}
            </ReactMarkdown>
          </div>

          {/* Navigation Buttons */}
          <div className="lesson-navigation">
            <button
              className="nav-button"
              disabled={currentLessonIndex === 0}
              onClick={() => setCurrentLessonIndex(prev => prev - 1)}
              aria-label="Go to previous lesson"
            >
              ← Previous Lesson
            </button>
            <button
              className="nav-button"
              disabled={currentLessonIndex === lessons.length - 1}
              onClick={() => setCurrentLessonIndex(prev => prev + 1)}
              aria-label="Go to next lesson"
            >
              Next Lesson →
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}
