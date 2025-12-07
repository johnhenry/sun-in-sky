import { useState, useEffect } from 'react';
import Panel from '../shared/Panel';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../../utils/localStorage';
import { BADGES, getBadgeTier } from '../../../data/badges';
import { checkForNewBadges, awardBadge, calculateTotalPoints } from '../../../utils/badgeLogic';
import './ChallengePanel.css';

// Import quiz questions (generated from lessons)
import elementaryQuiz from '../../../data/lessons/elementary-quiz.json';
import middleSchoolQuiz from '../../../data/lessons/middle-school-quiz.json';
import highSchoolQuiz from '../../../data/lessons/high-school-quiz.json';

const ALL_QUESTIONS = [
  ...(elementaryQuiz?.questions || []),
  ...(middleSchoolQuiz?.questions || []),
  ...(highSchoolQuiz?.questions || [])
];

export default function ChallengePanel({ isOpen, onToggle }) {
  const [quizState, setQuizState] = useLocalStorage(STORAGE_KEYS.QUIZ_STATE, {
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    answeredQuestions: {},
    streaks: { current: 0, longest: 0 }
  });

  const [badges, setBadges] = useLocalStorage(STORAGE_KEYS.BADGES, {
    earned: [],
    progress: {}
  });

  const [lessonProgress] = useLocalStorage(STORAGE_KEYS.LESSON_PROGRESS, {
    elementary: {},
    'middle-school': {},
    'high-school': {}
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  // Get unanswered questions
  const unansweredQuestions = ALL_QUESTIONS.filter(
    q => !quizState.answeredQuestions[q.id]
  );

  const currentQuestion = unansweredQuestions[currentQuestionIndex];

  // Handle answer selection
  const handleAnswerSelect = (answerId) => {
    if (showFeedback) return; // Already answered
    setSelectedAnswer(answerId);
  };

  // Submit answer
  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Show feedback immediately
    setShowFeedback(true);

    if (isCorrect) {
      // For correct answers: delay ALL state updates until transition
      setTimeout(() => {
        // Calculate new state values FIRST
        const newStreak = quizState.streaks.current + 1;
        const newCorrectAnswers = quizState.correctAnswers + 1;
        const newTotalQuestions = quizState.totalQuestions + 1;
        const newLongestStreak = Math.max(quizState.streaks.longest, newStreak);

        // Update quiz state with answered question
        setQuizState(prev => ({
          ...prev,
          totalQuestions: newTotalQuestions,
          correctAnswers: newCorrectAnswers,
          answeredQuestions: {
            ...prev.answeredQuestions,
            [currentQuestion.id]: {
              selectedAnswer,
              correct: true,
              timestamp: new Date().toISOString()
            }
          },
          streaks: {
            current: newStreak,
            longest: newLongestStreak
          }
        }));

        // Clear UI state
        setSelectedAnswer(null);
        setShowFeedback(false);
        setCurrentQuestionIndex(prev => {
          const newLength = unansweredQuestions.length - 1;
          return prev >= newLength ? 0 : prev;
        });

        // Check for badges with the NEW state values
        checkBadgesWithState({
          correctAnswers: newCorrectAnswers,
          totalQuestions: newTotalQuestions,
          incorrectAnswers: quizState.incorrectAnswers,
          answeredQuestions: {
            ...quizState.answeredQuestions,
            [currentQuestion.id]: { selectedAnswer, correct: true, timestamp: new Date().toISOString() }
          },
          streaks: {
            current: newStreak,
            longest: newLongestStreak
          }
        });
      }, 1200);
    } else {
      // For incorrect answers: just update stats (don't mark as answered)
      setQuizState(prev => ({
        ...prev,
        totalQuestions: prev.totalQuestions + 1,
        incorrectAnswers: prev.incorrectAnswers + 1,
        streaks: {
          current: 0,
          longest: prev.streaks.longest
        }
      }));
    }
  };

  // Check if user earned any new badges (with updated state)
  const checkBadgesWithState = (updatedQuizState) => {
    const state = {
      quizState: updatedQuizState,
      lessonProgress,
      exploration: {} // Would be passed from main app
    };

    const newBadges = checkForNewBadges(state, badges.earned);

    if (newBadges.length > 0) {
      // Award all newly earned badges
      const earnedBadges = newBadges.map(b => awardBadge(b.id)).filter(Boolean);

      if (earnedBadges.length > 0) {
        setBadges(prev => ({
          ...prev,
          earned: [...prev.earned, ...earnedBadges]
        }));

        // Show the first badge notification (if multiple, show them one at a time)
        earnedBadges.forEach((badge, index) => {
          setTimeout(() => {
            setNewBadge(badge);
            setTimeout(() => setNewBadge(null), 3000);
          }, index * 3500); // Stagger notifications by 3.5 seconds
        });
      }
    }
  };

  // Try again (only shown for incorrect answers now)
  const handleTryAgain = () => {
    // Reset selection and feedback to retry the question
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  // Reset all progress
  const handleReset = () => {
    setQuizState({
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      answeredQuestions: {},
      streaks: { current: 0, longest: 0 }
    });
    setBadges({ earned: [], progress: {} });
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const totalPoints = calculateTotalPoints(badges.earned);
  const tier = getBadgeTier(totalPoints);
  const accuracy = quizState.totalQuestions > 0
    ? Math.round((quizState.correctAnswers / quizState.totalQuestions) * 100)
    : 0;

  return (
    <Panel
      side="right"
      isOpen={isOpen}
      onToggle={onToggle}
      title="Challenge"
      icon="🏆"
      accentColor="#e67e22"
      width={420}
    >
      {/* New Badge Notification */}
      {newBadge && (
        <div className="badge-notification">
          <div className="badge-earned">
            <span className="badge-icon-large">{newBadge.icon}</span>
            <div className="badge-earned-info">
              <div className="badge-earned-title">Badge Earned!</div>
              <div className="badge-earned-name">{newBadge.name}</div>
              <div className="badge-earned-points">+{newBadge.points} points</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="quiz-stats">
        <div className="stat-card">
          <div className="stat-value">{quizState.correctAnswers}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{quizState.streaks.longest}</div>
          <div className="stat-label">Best Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalPoints}</div>
          <div className="stat-label">Points</div>
        </div>
      </div>

      {/* Tier Badge */}
      <div className="tier-badge" style={{ borderColor: tier.color }}>
        <span className="tier-icon">{tier.icon}</span>
        <span className="tier-name">{tier.name}</span>
      </div>

      <div className="panel-divider" />

      {/* Toggle between Quiz and Badges */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${!showBadges ? 'active' : ''}`}
          onClick={() => setShowBadges(false)}
        >
          Quiz Questions
        </button>
        <button
          className={`toggle-btn ${showBadges ? 'active' : ''}`}
          onClick={() => setShowBadges(true)}
        >
          Badges ({badges.earned.length}/{BADGES.length})
        </button>
      </div>

      {/* Quiz View */}
      {!showBadges && (
        <>
          {currentQuestion ? (
            <div className="quiz-container">
              <div className="question-header">
                <span className="question-number">
                  Question {currentQuestionIndex + 1} of {unansweredQuestions.length}
                </span>
                {quizState.streaks.current > 0 && (
                  <span className="current-streak">
                    🔥 {quizState.streaks.current} streak
                  </span>
                )}
              </div>

              <div className="question-text">{currentQuestion.question}</div>

              <div className="answer-options">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrect = option.correct;
                  const showCorrect = showFeedback && isCorrect;
                  const showIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <button
                      key={option.id}
                      className={`answer-option ${isSelected ? 'selected' : ''} ${
                        showCorrect ? 'correct' : ''
                      } ${showIncorrect ? 'incorrect' : ''}`}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={showFeedback}
                    >
                      <span className="option-letter">{option.id}</span>
                      <span className="option-text">{option.text}</span>
                      {showCorrect && <span className="option-icon">✓</span>}
                      {showIncorrect && <span className="option-icon">✗</span>}
                    </button>
                  );
                })}
              </div>

              {!showFeedback ? (
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                >
                  Submit Answer
                </button>
              ) : (
                <>
                  <div className={`feedback ${selectedAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <>
                        <span className="feedback-icon">🎉</span>
                        <span className="feedback-text">Correct! Moving to next question...</span>
                      </>
                    ) : (
                      <>
                        <span className="feedback-icon">💭</span>
                        <span className="feedback-text">Not quite. Try again!</span>
                      </>
                    )}
                  </div>

                  {selectedAnswer !== currentQuestion.correctAnswer && (
                    <button className="next-btn" onClick={handleTryAgain}>
                      Try Again
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="panel-empty">
              <div className="panel-empty-icon">🎊</div>
              <p>You've answered all available questions!</p>
              <p style={{ fontSize: '11px', marginTop: '8px', color: '#a1a1a8' }}>
                Complete more lessons to unlock new questions.
              </p>
            </div>
          )}
        </>
      )}

      {/* Badges View */}
      {showBadges && (
        <div className="badges-container">
          <div className="badges-grid">
            {BADGES.map((badge) => {
              const isEarned = badges.earned.some(b => b.id === badge.id);

              return (
                <div
                  key={badge.id}
                  className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-description">{badge.description}</div>
                  {isEarned && (
                    <div className="badge-points">+{badge.points} points</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="panel-divider" />

      {/* Reset Button */}
      <button className="reset-btn" onClick={handleReset}>
        Reset All Progress
      </button>
    </Panel>
  );
}
