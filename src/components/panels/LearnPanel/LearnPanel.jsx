import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Panel from '../shared/Panel';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../utils/localStorage';
import './LearnPanel.css';

// Import lesson data (generated from markdown)
import elementaryData from '../../../data/lessons/elementary.json';
import middleSchoolData from '../../../data/lessons/middle-school.json';
import highSchoolData from '../../../data/lessons/high-school.json';

const GRADE_LEVELS = {
  elementary: { name: 'Elementary (Grades 3-5)', data: elementaryData, icon: '🎓' },
  'middle-school': { name: 'Middle School (Grades 6-8)', data: middleSchoolData, icon: '🏫' },
  'high-school': { name: 'High School (Grades 9-12)', data: highSchoolData, icon: '🎯' }
};

export default function LearnPanel({ isOpen, onToggle, onAppControl, showToggleButton = true }) {
  const [gradeLevel, setGradeLevel] = useState('elementary');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonProgress, setLessonProgress] = useLocalStorage(STORAGE_KEYS.LESSON_PROGRESS, {
    elementary: {},
    'middle-school': {},
    'high-school': {}
  });

  const currentGradeData = GRADE_LEVELS[gradeLevel]?.data;
  const lessons = currentGradeData?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];

  // Mark lesson as visited
  useEffect(() => {
    if (currentLesson && isOpen) {
      const lessonId = currentLesson.id;
      setLessonProgress(prev => ({
        ...prev,
        [gradeLevel]: {
          ...prev[gradeLevel],
          [lessonId]: {
            ...prev[gradeLevel][lessonId],
            lastVisited: new Date().toISOString(),
            viewed: true
          }
        }
      }));
    }
  }, [currentLesson, gradeLevel, isOpen, setLessonProgress]);

  const handleLessonSelect = (index) => {
    setCurrentLessonIndex(index);
  };

  const handleMarkComplete = () => {
    if (!currentLesson) return;

    const lessonId = currentLesson.id;
    setLessonProgress(prev => ({
      ...prev,
      [gradeLevel]: {
        ...prev[gradeLevel],
        [lessonId]: {
          ...prev[gradeLevel][lessonId],
          completed: true,
          completedAt: new Date().toISOString()
        }
      }
    }));
  };

  const isLessonCompleted = (lessonId) => {
    return lessonProgress[gradeLevel]?.[lessonId]?.completed || false;
  };

  const getCompletionCount = () => {
    const gradeLessons = lessonProgress[gradeLevel] || {};
    return Object.values(gradeLessons).filter(l => l.completed).length;
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
      {/* Grade Level Selector */}
      <div className="grade-selector">
        <h3 className="panel-section-title">Grade Level</h3>
        <div className="grade-buttons">
          {Object.entries(GRADE_LEVELS).map(([key, { name, icon }]) => (
            <button
              key={key}
              className={`grade-button ${gradeLevel === key ? 'active' : ''}`}
              onClick={() => {
                setGradeLevel(key);
                setCurrentLessonIndex(0);
              }}
            >
              <span className="grade-icon">{icon}</span>
              <span className="grade-name">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-divider" />

      {/* Lesson Navigator */}
      {lessons.length > 0 ? (
        <>
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
                >
                  <div className="lesson-number">
                    {isLessonCompleted(lesson.id) ? '✓' : lesson.number}
                  </div>
                  <div className="lesson-info">
                    <div className="lesson-title">{lesson.title}</div>
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
                <h3>Lesson {currentLesson.number}: {currentLesson.title}</h3>
                {!isLessonCompleted(currentLesson.id) && (
                  <button
                    className="mark-complete-btn"
                    onClick={handleMarkComplete}
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
                >
                  ← Previous Lesson
                </button>
                <button
                  className="nav-button"
                  disabled={currentLessonIndex === lessons.length - 1}
                  onClick={() => setCurrentLessonIndex(prev => prev + 1)}
                >
                  Next Lesson →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="panel-empty">
          <div className="panel-empty-icon">📖</div>
          <p>No lessons available for this grade level yet.</p>
        </div>
      )}
    </Panel>
  );
}
