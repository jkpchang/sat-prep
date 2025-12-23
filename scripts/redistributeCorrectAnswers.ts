import * as fs from 'fs';
import * as path from 'path';
import { Question } from '../types';
import { SAMPLE_QUESTIONS } from '../services/questions';

interface SwapPlan {
  questionId: number;
  oldPosition: number;
  newPosition: number;
}

function swapArrayElements<T>(arr: T[], from: number, to: number): T[] {
  const newArr = [...arr];
  [newArr[from], newArr[to]] = [newArr[to], newArr[from]];
  return newArr;
}

function analyzeDistribution(questions: Question[]): {
  distribution: Record<number, number>;
  questionsByAnswer: Record<number, Question[]>;
} {
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const questionsByAnswer: Record<number, Question[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
  };

  questions.forEach((q) => {
    const answer = q.correctAnswer;
    if (answer >= 0 && answer <= 3) {
      distribution[answer]++;
      questionsByAnswer[answer].push(q);
    }
  });

  return { distribution, questionsByAnswer };
}

function createRedistributionPlan(
  questions: Question[],
  targetCount: number
): SwapPlan[] {
  const { distribution, questionsByAnswer } = analyzeDistribution(questions);
  const plan: SwapPlan[] = [];

  console.log('Current distribution:');
  console.log(`  Option 0: ${distribution[0]} questions`);
  console.log(`  Option 1: ${distribution[1]} questions`);
  console.log(`  Option 2: ${distribution[2]} questions`);
  console.log(`  Option 3: ${distribution[3]} questions`);
  console.log(`\nTarget: ~${targetCount} questions per option\n`);

  // Calculate how many questions need to move from each position
  const needed: Record<number, number> = {
    0: Math.max(0, targetCount - distribution[0]),
    1: Math.max(0, targetCount - distribution[1]),
    2: Math.max(0, targetCount - distribution[2]),
    3: Math.max(0, targetCount - distribution[3]),
  };

  const excess: Record<number, number> = {
    0: Math.max(0, distribution[0] - targetCount),
    1: Math.max(0, distribution[1] - targetCount),
    2: Math.max(0, distribution[2] - targetCount),
    3: Math.max(0, distribution[3] - targetCount),
  };

  // Strategy: Move questions from position 1 (which has the most) to positions 0 and 3 (which need the most)
  const questionsToMoveFrom1 = questionsByAnswer[1].slice(0, excess[1]);
  
  // Distribute moves from position 1 to positions 0 and 3
  let moveTo0 = Math.min(needed[0], Math.floor(excess[1] / 2));
  let moveTo3 = Math.min(needed[3], excess[1] - moveTo0);
  
  // If we still need more for position 0, take from position 2 if it has excess
  if (needed[0] > moveTo0 && excess[2] > 0) {
    const additionalFrom2 = Math.min(needed[0] - moveTo0, excess[2]);
    moveTo0 += additionalFrom2;
    const questionsToMoveFrom2 = questionsByAnswer[2].slice(0, additionalFrom2);
    questionsToMoveFrom2.forEach((q) => {
      plan.push({
        questionId: q.id,
        oldPosition: 2,
        newPosition: 0,
      });
    });
  }

  // Create swaps for questions moving from position 1
  let movedTo0 = 0;
  let movedTo3 = 0;

  questionsToMoveFrom1.forEach((q) => {
    if (movedTo0 < moveTo0) {
      plan.push({
        questionId: q.id,
        oldPosition: 1,
        newPosition: 0,
      });
      movedTo0++;
    } else if (movedTo3 < moveTo3) {
      plan.push({
        questionId: q.id,
        oldPosition: 1,
        newPosition: 3,
      });
      movedTo3++;
    }
  });

  console.log(`Planned swaps: ${plan.length}`);
  console.log(`  From position 1 to 0: ${movedTo0}`);
  console.log(`  From position 1 to 3: ${movedTo3}`);
  if (plan.length > movedTo0 + movedTo3) {
    console.log(`  From position 2 to 0: ${plan.length - movedTo0 - movedTo3}`);
  }

  return plan;
}

function applySwaps(questions: Question[], plan: SwapPlan[]): Question[] {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const updatedQuestions = questions.map((q) => ({ ...q }));

  plan.forEach((swap) => {
    const question = questionMap.get(swap.questionId);
    if (!question) {
      console.warn(`Question ${swap.questionId} not found`);
      return;
    }

    const questionIndex = updatedQuestions.findIndex((q) => q.id === swap.questionId);
    if (questionIndex === -1) {
      console.warn(`Question ${swap.questionId} not found in updated array`);
      return;
    }

    const updatedQuestion = updatedQuestions[questionIndex];

    // Swap options
    updatedQuestion.options = swapArrayElements(
      updatedQuestion.options,
      swap.oldPosition,
      swap.newPosition
    );

    // Swap optionsSvg if it exists
    if (updatedQuestion.optionsSvg) {
      updatedQuestion.optionsSvg = swapArrayElements(
        updatedQuestion.optionsSvg,
        swap.oldPosition,
        swap.newPosition
      );
    }

    // Update correctAnswer
    updatedQuestion.correctAnswer = swap.newPosition;

    console.log(
      `Question ${swap.questionId}: Moved correct answer from position ${swap.oldPosition} to ${swap.newPosition}`
    );
  });

  return updatedQuestions;
}

function formatQuestion(q: Question, isLast: boolean): string {
  let output = `  {\n`;
  output += `    id: ${q.id},\n`;
  
  if (q.formula) {
    output += `    formula: ${JSON.stringify(q.formula)},\n`;
  }
  
  if (q.imageSvg) {
    output += `    imageSvg: ${JSON.stringify(q.imageSvg)},\n`;
  }
  
  output += `    question: ${JSON.stringify(q.question)},\n`;
  output += `    options: ${JSON.stringify(q.options)},\n`;
  
  if (q.renderOptionsAsSvg) {
    output += `    renderOptionsAsSvg: true,\n`;
  }
  
  if (q.optionsSvg) {
    output += `    optionsSvg: [\n`;
    q.optionsSvg.forEach((svg, i) => {
      output += `      ${JSON.stringify(svg)}${i < q.optionsSvg!.length - 1 ? ',' : ''}\n`;
    });
    output += `    ],\n`;
  }
  
  output += `    correctAnswer: ${q.correctAnswer},\n`;
  output += `    explanation: ${JSON.stringify(q.explanation)},\n`;
  output += `    category: ${JSON.stringify(q.category)},\n`;
  
  if (q.subcategory) {
    output += `    subcategory: ${JSON.stringify(q.subcategory)},\n`;
  }
  
  output += `    difficultyLevel: ${q.difficultyLevel},\n`;
  output += `  }${isLast ? '' : ','}\n`;
  
  return output;
}

function generateUpdatedFile(questions: Question[]): string {
  // Read the original file to get the helper functions
  const filePath = path.join(__dirname, '../services/questions.ts');
  const originalContent = fs.readFileSync(filePath, 'utf-8');
  
  // Extract the helper functions section (everything after the closing bracket of SAMPLE_QUESTIONS)
  const helperFunctionsMatch = originalContent.match(/\];\s*\n\s*\/\/ Helper function.*$/s);
  const helperFunctions = helperFunctionsMatch ? helperFunctionsMatch[0] : '';

  let output = `import { Question } from "../types";

// Test filter: Set to an array of question IDs to test specific questions only
// Set to empty array [] to disable filtering
// Example: export const TEST_QUESTION_IDS = [27, 28, 29]; // Test only SVG questions
export const TEST_QUESTION_IDS: number[] = [];

// Sample SAT questions - In production, these would come from a database/API
export const SAMPLE_QUESTIONS: Question[] = [
`;

  questions.forEach((q, index) => {
    output += formatQuestion(q, index === questions.length - 1);
  });

  output += helperFunctions;

  return output;
}

function main() {
  console.log('Analyzing question distribution...\n');
  
  const totalQuestions = SAMPLE_QUESTIONS.length;
  const targetCount = Math.ceil(totalQuestions / 4); // Roughly equal distribution

  // Analyze current distribution
  const { distribution } = analyzeDistribution(SAMPLE_QUESTIONS);

  // Create redistribution plan
  const plan = createRedistributionPlan(SAMPLE_QUESTIONS, targetCount);

  if (plan.length === 0) {
    console.log('Distribution is already balanced. No changes needed.');
    return;
  }

  console.log('\nApplying swaps...\n');
  
  // Apply swaps
  const updatedQuestions = applySwaps(SAMPLE_QUESTIONS, plan);

  // Verify new distribution
  const newDistribution = analyzeDistribution(updatedQuestions);
  console.log('\nNew distribution:');
  console.log(`  Option 0: ${newDistribution.distribution[0]} questions`);
  console.log(`  Option 1: ${newDistribution.distribution[1]} questions`);
  console.log(`  Option 2: ${newDistribution.distribution[2]} questions`);
  console.log(`  Option 3: ${newDistribution.distribution[3]} questions`);

  // Generate updated file
  console.log('\nGenerating updated file...');
  const updatedFileContent = generateUpdatedFile(updatedQuestions);

  // Write to a new file first (for safety)
  const outputPath = path.join(__dirname, '../services/questions.updated.ts');
  fs.writeFileSync(outputPath, updatedFileContent, 'utf-8');
  
  console.log(`\n✅ Updated file written to: ${outputPath}`);
  console.log('Please review the file and then replace the original questions.ts file.');
  console.log('Or run: mv services/questions.updated.ts services/questions.ts');
}

main();

