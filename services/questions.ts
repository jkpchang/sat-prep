import { Question } from "../types";

// Sample SAT questions - In production, these would come from a database/API
export const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "1",
    question: "If 3x + 5 = 20, what is the value of x?",
    options: ["3", "5", "7", "15"],
    correctAnswer: 1,
    explanation:
      "Subtract 5 from both sides: 3x = 15. Then divide by 3: x = 5.",
    category: "math",
    difficulty: "easy",
  },
  {
    id: "2",
    question: "Which of the following is equivalent to (x + 3)(x - 3)?",
    options: ["x² - 9", "x² + 9", "x² - 6x + 9", "x² + 6x - 9"],
    correctAnswer: 0,
    explanation:
      "This is a difference of squares: (a + b)(a - b) = a² - b². So (x + 3)(x - 3) = x² - 9.",
    category: "math",
    difficulty: "medium",
  },
  {
    id: "3",
    question: 'The word "ubiquitous" most nearly means:',
    options: ["rare", "everywhere", "ancient", "complex"],
    correctAnswer: 1,
    explanation: "Ubiquitous means present, appearing, or found everywhere.",
    category: "reading",
    difficulty: "medium",
  },
  {
    id: "4",
    question: "Choose the correct sentence:",
    options: [
      "The team were excited about their victory.",
      "The team was excited about their victory.",
      "The team is excited about their victory.",
      "The team are excited about their victory.",
    ],
    correctAnswer: 1,
    explanation:
      '"Team" is a collective noun that takes a singular verb. "Was" is the correct past tense form.',
    category: "writing",
    difficulty: "easy",
  },
  {
    id: "5",
    question:
      "If a triangle has sides of length 3, 4, and 5, what type of triangle is it?",
    options: ["Equilateral", "Isosceles", "Right", "Obtuse"],
    correctAnswer: 2,
    explanation:
      "A triangle with sides 3, 4, and 5 satisfies the Pythagorean theorem (3² + 4² = 5²), making it a right triangle.",
    category: "math",
    difficulty: "medium",
  },
  {
    id: "6",
    question: "The passage suggests that the author believes:",
    options: [
      "Technology is always beneficial.",
      "Balance is important in life.",
      "Traditional methods are outdated.",
      "Change should be avoided.",
    ],
    correctAnswer: 1,
    explanation:
      "This is a sample reading comprehension question. The correct answer emphasizes balance.",
    category: "reading",
    difficulty: "hard",
  },
];

export const getRandomQuestion = (
  answeredQuestionIds: string[] | Set<string> = []
): Question => {
  const answeredSet = answeredQuestionIds instanceof Set
    ? answeredQuestionIds
    : new Set(answeredQuestionIds);

  const unansweredQuestions = SAMPLE_QUESTIONS.filter(
    (q) => !answeredSet.has(q.id)
  );

  const availableQuestions = unansweredQuestions.length > 0 
    ? unansweredQuestions 
    : SAMPLE_QUESTIONS;

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};

export const getQuestionsByCategory = (
  category: Question["category"]
): Question[] => {
  return SAMPLE_QUESTIONS.filter((q) => q.category === category);
};

export const getQuestionsByDifficulty = (
  difficulty: Question["difficulty"]
): Question[] => {
  return SAMPLE_QUESTIONS.filter((q) => q.difficulty === difficulty);
};
