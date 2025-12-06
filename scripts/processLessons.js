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

// Simplified parser
function parseLessonMarkdown(markdown, gradeLevel) {
  const lines = markdown.split('\n');
  const lessons = [];
  const quizQuestions = [];
  let currentLesson = null;
  let questionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect lesson start
    const lessonMatch = line.match(/^## Lesson (\d+): (.+)$/);
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

    // Extract multiple choice questions
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
  }

  if (currentLesson) lessons.push(currentLesson);

  return { lessons, quizQuestions };
}
