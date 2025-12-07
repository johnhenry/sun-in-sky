#!/usr/bin/env node
/**
 * Process lesson markdown files into JSON
 * Extracts lessons and quiz questions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LESSONS_DIR = path.join(__dirname, '../lessons');
const OUTPUT_DIR = path.join(__dirname, '../src/data/lessons');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Process each lesson file
const files = {
  'elementary-lessons.md': 'elementary',
  'middle-school-lessons.md': 'middle-school',
  'high-school-lessons.md': 'high-school'
};

for (const [filename, gradeLevel] of Object.entries(files)) {
  const filePath = path.join(LESSONS_DIR, filename);
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const { lessons, quizQuestions} = parseLessonMarkdown(markdown, gradeLevel);

  // Write lessons
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${gradeLevel}.json`),
    JSON.stringify({ gradeLevel, lessons }, null, 2)
  );

  // Write quiz questions
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${gradeLevel}-quiz.json`),
    JSON.stringify({ gradeLevel, questions: quizQuestions }, null, 2)
  );

  console.log(`✓ Processed ${filename}`);
  console.log(`  - ${lessons.length} lessons`);
  console.log(`  - ${quizQuestions.length} quiz questions`);
}

console.log('\n✓ All lessons processed successfully!');

// Enhanced parser with multiple question formats
function parseLessonMarkdown(markdown, gradeLevel) {
  const lines = markdown.split('\n');
  const lessons = [];
  const quizQuestions = [];
  let currentLesson = null;
  let questionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect lesson start (handle both # Lesson and ## Lesson)
    const lessonMatch = line.match(/^#+ Lesson (\d+): (.+)$/);
    if (lessonMatch) {
      if (currentLesson) lessons.push(currentLesson);
      currentLesson = {
        id: `${gradeLevel}-lesson-${lessonMatch[1]}`,
        number: parseInt(lessonMatch[1]),
        title: lessonMatch[2],
        grade: gradeLevel,
        content: []
      };
      continue;
    }

    if (currentLesson) {
      currentLesson.content.push(line);
    }

    // Extract multiple choice questions (existing format)
    const mcMatch = line.match(/^\d+\.\s+\*\*Multiple Choice\*\*:\s*(.+)$/);
    if (mcMatch) {
      const question = {
        id: `q-${gradeLevel}-${++questionCounter}`,
        type: 'multiple-choice',
        question: mcMatch[1],
        options: [],
        correctAnswer: null
      };

      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const optionMatch = lines[j].match(/^\s+- ([A-D])\)\s*(.+?)\s*(✓)?$/);
        if (optionMatch) {
          question.options.push({
            id: optionMatch[1],
            text: optionMatch[2],
            correct: !!optionMatch[3]
          });
          if (optionMatch[3]) question.correctAnswer = optionMatch[1];
        }
      }

      if (question.options.length > 0) {
        quizQuestions.push(question);
      }
    }

    // Extract True/False questions
    const tfMatch = line.match(/^\s*-\s+(.+?)\s+\((True|False)\)$/i);
    if (tfMatch && (i > 0 && lines[i-1].includes('**True or False**'))) {
      const question = {
        id: `q-${gradeLevel}-${++questionCounter}`,
        type: 'multiple-choice',
        question: tfMatch[1],
        options: [
          { id: 'A', text: 'True', correct: tfMatch[2] === 'True' },
          { id: 'B', text: 'False', correct: tfMatch[2] === 'False' }
        ],
        correctAnswer: tfMatch[2] === 'True' ? 'A' : 'B'
      };
      quizQuestions.push(question);
    }

    // Extract Quick Check Quiz questions (numbered fill-in or simple questions)
    const quickCheckMatch = line.match(/^(\d+)\.\s+(.+?)\s+\((.+?)\)$/);
    if (quickCheckMatch && i > 0 && (lines[i-3] || '').includes('**Quick Check')) {
      const questionText = quickCheckMatch[2];
      const answer = quickCheckMatch[3];

      // Create multiple choice from fill-in-the-blank if possible
      if (questionText.includes('_____')) {
        const question = {
          id: `q-${gradeLevel}-${++questionCounter}`,
          type: 'multiple-choice',
          question: questionText,
          options: createOptionsFromAnswer(answer, questionText),
          correctAnswer: 'A'
        };
        if (question.options.length >= 2) {
          quizQuestions.push(question);
        }
      }
    }

    // Extract Quick Check numbered questions without parentheses
    const numberedQMatch = line.match(/^(\d+)\.\s+(.+\?)$/);
    if (numberedQMatch && i > 0) {
      const prevLines = lines.slice(Math.max(0, i-5), i).join(' ');
      if (prevLines.includes('**Quick Check') || prevLines.includes('**Understanding Check')) {
        const questionText = numberedQMatch[2];

        // Look ahead for possible answers or hints
        let answer = null;
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const answerMatch = lines[j].match(/^\s*-?\s*Answer:\s*(.+)$/i);
          if (answerMatch) {
            answer = answerMatch[1];
            break;
          }
        }

        if (answer) {
          const question = {
            id: `q-${gradeLevel}-${++questionCounter}`,
            type: 'multiple-choice',
            question: questionText,
            options: createOptionsFromAnswer(answer, questionText),
            correctAnswer: 'A'
          };
          if (question.options.length >= 2) {
            quizQuestions.push(question);
          }
        }
      }
    }
  }

  if (currentLesson) lessons.push(currentLesson);

  return { lessons, quizQuestions };
}

// Helper function to create multiple choice options from an answer
function createOptionsFromAnswer(correctAnswer, questionText) {
  const options = [{ id: 'A', text: correctAnswer, correct: true }];

  // Generate distractors based on context
  const distractors = generateDistractors(correctAnswer, questionText);

  distractors.slice(0, 3).forEach((distractor, index) => {
    options.push({
      id: String.fromCharCode(66 + index), // B, C, D
      text: distractor,
      correct: false
    });
  });

  return options;
}

// Generate plausible wrong answers (distractors)
function generateDistractors(correctAnswer, questionText) {
  const distractors = [];

  // Common solar geometry distractors
  const commonDistractors = {
    'above': ['below', 'at', 'near'],
    'below': ['above', 'at', 'beyond'],
    'degrees north': ['degrees south', 'degrees east', 'degrees west'],
    'December': ['June', 'March', 'September'],
    'June': ['December', 'March', 'September'],
    'winter': ['summer', 'spring', 'fall'],
    'summer': ['winter', 'spring', 'fall'],
    '24': ['12', '18', '6'],
    '12': ['24', '18', '6'],
    '0': ['90', '45', '23.45'],
    '90': ['0', '45', '180'],
    'equator': ['North Pole', 'Tropic of Cancer', 'Arctic Circle'],
    'altitude': ['azimuth', 'declination', 'latitude'],
    'horizon': ['zenith', 'meridian', 'equator'],
    'solstice': ['equinox', 'perihelion', 'aphelion']
  };

  // Try to find and replace key terms
  for (const [key, alternatives] of Object.entries(commonDistractors)) {
    if (correctAnswer.toLowerCase().includes(key.toLowerCase())) {
      alternatives.forEach(alt => {
        const distractor = correctAnswer.replace(new RegExp(key, 'i'), alt);
        if (distractor !== correctAnswer) {
          distractors.push(distractor);
        }
      });
    }
  }

  // Numerical distractors
  const numMatch = correctAnswer.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    [num * 0.5, num * 2, num + 10, num - 10, num * 1.5].forEach(variant => {
      if (variant > 0 && variant !== num) {
        const distractor = correctAnswer.replace(numMatch[1], variant.toFixed(num % 1 === 0 ? 0 : 2));
        distractors.push(distractor);
      }
    });
  }

  // If we don't have enough distractors, add generic ones
  while (distractors.length < 3) {
    const generic = [
      'None of the above',
      'It depends on the latitude',
      'The opposite of the correct answer',
      'Cannot be determined from the given information'
    ];
    distractors.push(generic[distractors.length % generic.length]);
  }

  return [...new Set(distractors)]; // Remove duplicates
}
