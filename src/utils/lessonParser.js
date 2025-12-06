/**
 * Lesson Parser - Extracts lessons and quiz questions from markdown files
 */

/**
 * Parse markdown lesson content into structured data
 * Extracts both lesson content AND quiz questions for the challenge panel
 */
export function parseLessonMarkdown(markdown, gradeLevel) {
  const lines = markdown.split('\n');
  const lessons = [];
  const quizQuestions = [];

  let currentLesson = null;
  let currentSection = null;
  let questionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect lesson start (## Lesson N: Title)
    const lessonMatch = line.match(/^## Lesson (\d+): (.+)$/);
    if (lessonMatch) {
      if (currentLesson) {
        lessons.push(currentLesson);
      }

      currentLesson = {
        id: `${gradeLevel}-lesson-${lessonMatch[1]}`,
        gradeLevel,
        number: parseInt(lessonMatch[1]),
        title: lessonMatch[2],
        objectives: [],
        vocabulary: [],
        steps: [],
        questions: []
      };
      currentSection = null;
      continue;
    }

    if (!currentLesson) continue;

    // Extract learning objectives
    if (line.startsWith('By the end of this lesson, students will be able to:')) {
      currentSection = 'objectives';
      continue;
    }

    if (currentSection === 'objectives' && line.match(/^\d+\./)) {
      const objective = line.replace(/^\d+\.\s*/, '');
      currentLesson.objectives.push(objective);
    }

    // Extract vocabulary
    if (line.startsWith('### Vocabulary')) {
      currentSection = 'vocabulary';
      continue;
    }

    if (currentSection === 'vocabulary' && line.startsWith('- **')) {
      const vocabMatch = line.match(/- \*\*(.+?)\*\*: (.+)$/);
      if (vocabMatch) {
        currentLesson.vocabulary.push({
          term: vocabMatch[1],
          definition: vocabMatch[2]
        });
      }
    }

    // Extract activity steps
    const stepMatch = line.match(/^\*\*(.+?):\*\*$/);
    if (stepMatch) {
      const step = {
        title: stepMatch[1],
        content: [],
        appSettings: extractAppSettings(stepMatch[1]),
        interactivePrompts: []
      };
      currentLesson.steps.push(step);
      currentSection = 'step';
      continue;
    }

    if (currentSection === 'step' && currentLesson.steps.length > 0) {
      const currentStep = currentLesson.steps[currentLesson.steps.length - 1];

      // Extract app interaction prompts
      const settingMatch = line.match(/- (?:Click|Set|Switch to) ["']?(.+?)["']?\s*(?:button|view|to|=)/i);
      if (settingMatch) {
        currentStep.interactivePrompts.push(line.replace(/^- /, ''));
      }

      if (line.trim() && !line.startsWith('#')) {
        currentStep.content.push(line);
      }
    }

    // Extract quiz questions - Multiple Choice
    const mcMatch = line.match(/^\d+\.\s+\*\*Multiple Choice\*\*:\s*(.+)$/);
    if (mcMatch) {
      const question = {
        id: `${currentLesson.id}-q${++questionCounter}`,
        lessonId: currentLesson.id,
        gradeLevel,
        type: 'multiple-choice',
        question: mcMatch[1],
        options: [],
        correctAnswer: null,
        explanation: '',
        points: 10
      };

      // Look ahead for options
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const optionLine = lines[j];
        const optionMatch = optionLine.match(/^\s+- ([A-D])\)\s*(.+?)\s*(✓)?$/);
        if (optionMatch) {
          const optionId = optionMatch[1];
          const optionText = optionMatch[2];
          const isCorrect = !!optionMatch[3];

          question.options.push({
            id: optionId,
            text: optionText,
            correct: isCorrect
          });

          if (isCorrect) {
            question.correctAnswer = optionId;
          }
        } else if (optionLine.trim() && !optionLine.startsWith('-')) {
          break;
        }
      }

      if (question.options.length > 0) {
        quizQuestions.push(question);
        currentLesson.questions.push(question);
      }
    }

    // Extract True/False questions
    const tfMatch = line.match(/^\d+\.\s+\*\*True or False\*\*:\s*(.+)$/);
    if (tfMatch) {
      const question = {
        id: `${currentLesson.id}-q${++questionCounter}`,
        lessonId: currentLesson.id,
        gradeLevel,
        type: 'true-false',
        question: tfMatch[1],
        options: [
          { id: 'A', text: 'True', correct: false },
          { id: 'B', text: 'False', correct: false }
        ],
        correctAnswer: null,
        explanation: '',
        points: 5
      };

      // Look for answer in next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].includes('Answer: True') || lines[j].includes('✓ True')) {
          question.options[0].correct = true;
          question.correctAnswer = 'A';
          break;
        } else if (lines[j].includes('Answer: False') || lines[j].includes('✓ False')) {
          question.options[1].correct = true;
          question.correctAnswer = 'B';
          break;
        }
      }

      if (question.correctAnswer) {
        quizQuestions.push(question);
        currentLesson.questions.push(question);
      }
    }

    // Extract short answer questions (for display, not auto-graded)
    const saMatch = line.match(/^\d+\.\s+\*\*Short Answer\*\*:\s*["'](.+?)["']$/);
    if (saMatch) {
      const question = {
        id: `${currentLesson.id}-q${++questionCounter}`,
        lessonId: currentLesson.id,
        gradeLevel,
        type: 'short-answer',
        question: saMatch[1],
        sampleAnswer: '',
        points: 15
      };

      quizQuestions.push(question);
      currentLesson.questions.push(question);
    }
  }

  // Add last lesson
  if (currentLesson) {
    lessons.push(currentLesson);
  }

  return { lessons, quizQuestions };
}

/**
 * Extract app settings from step titles or content
 */
function extractAppSettings(stepTitle) {
  const settings = {};

  // Detect view mode
  if (stepTitle.includes('Day view') || stepTitle.includes('"Day"')) {
    settings.viewMode = 'day';
  } else if (stepTitle.includes('Year view') || stepTitle.includes('"Year"')) {
    settings.viewMode = 'year';
  }

  // Detect latitude
  const latMatch = stepTitle.match(/(\d+)°\s*\(?(Mid|North|South|Equator|Pole)?/i);
  if (latMatch) {
    settings.latitude = parseInt(latMatch[1]);
  }

  // Detect date presets
  if (stepTitle.includes('Mar Equinox')) settings.datePreset = 'Mar Equinox';
  if (stepTitle.includes('Jun Solstice')) settings.datePreset = 'Jun Solstice';
  if (stepTitle.includes('Sep Equinox')) settings.datePreset = 'Sep Equinox';
  if (stepTitle.includes('Dec Solstice')) settings.datePreset = 'Dec Solstice';

  // Detect time presets
  if (stepTitle.includes('Noon') || stepTitle.includes('12:00')) settings.timePreset = 'Noon';
  if (stepTitle.includes('Dawn') || stepTitle.includes('6:00 AM')) settings.timePreset = 'Dawn';
  if (stepTitle.includes('Dusk') || stepTitle.includes('6:00 PM')) settings.timePreset = 'Dusk';
  if (stepTitle.includes('Midnight') || stepTitle.includes('0:00')) settings.timePreset = 'Midnight';

  return Object.keys(settings).length > 0 ? settings : null;
}

/**
 * Generate quiz questions from lesson activities
 * Creates interactive challenges based on lesson content
 */
export function generateInteractiveQuestions(lessons) {
  const questions = [];

  lessons.forEach(lesson => {
    // Create questions based on vocabulary
    lesson.vocabulary.forEach((vocab, index) => {
      if (index < 3) { // Limit to first 3 vocab terms per lesson
        questions.push({
          id: `${lesson.id}-vocab-${index}`,
          lessonId: lesson.id,
          gradeLevel: lesson.gradeLevel,
          type: 'multiple-choice',
          question: `What is ${vocab.term}?`,
          options: [
            { id: 'A', text: vocab.definition, correct: true },
            { id: 'B', text: generateDistractor(vocab.definition), correct: false },
            { id: 'C', text: generateDistractor(vocab.definition), correct: false },
            { id: 'D', text: generateDistractor(vocab.definition), correct: false }
          ],
          correctAnswer: 'A',
          explanation: `${vocab.term}: ${vocab.definition}`,
          points: 5
        });
      }
    });
  });

  return questions;
}

/**
 * Generate distractor answers (placeholder - would need more sophisticated logic)
 */
function generateDistractor(correctAnswer) {
  const distractors = [
    'The opposite of the correct definition',
    'A related but incorrect concept',
    'A common misconception'
  ];
  return distractors[Math.floor(Math.random() * distractors.length)];
}

/**
 * Validate parsed lesson structure
 */
export function validateLesson(lesson) {
  const errors = [];

  if (!lesson.id) errors.push('Missing lesson ID');
  if (!lesson.title) errors.push('Missing lesson title');
  if (!lesson.objectives || lesson.objectives.length === 0) {
    errors.push('Lesson must have at least one learning objective');
  }
  if (!lesson.steps || lesson.steps.length === 0) {
    errors.push('Lesson must have at least one step');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
