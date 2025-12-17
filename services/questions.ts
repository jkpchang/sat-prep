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
    difficultyLevel: 2,
  },
  {
    id: "2",
    question: "Which of the following is equivalent to (x + 3)(x - 3)?",
    options: ["x² - 9", "x² + 9", "x² - 6x + 9", "x² + 6x - 9"],
    correctAnswer: 0,
    explanation:
      "This is a difference of squares: (a + b)(a - b) = a² - b². So (x + 3)(x - 3) = x² - 9.",
    category: "math",
    difficultyLevel: 4,
  },
  {
    id: "3",
    question: 'The word "ubiquitous" most nearly means:',
    options: ["rare", "everywhere", "ancient", "complex"],
    correctAnswer: 1,
    explanation: "Ubiquitous means present, appearing, or found everywhere.",
    category: "reading",
    difficultyLevel: 5,
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
    difficultyLevel: 1,
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
    difficultyLevel: 4,
  },
  {
    id: "7",
    question: "If 2x - 5 = 9, what is the value of x?",
    options: ["4", "5", "7", "14"],
    correctAnswer: 2,
    explanation: "Add 5 to both sides: 2x = 14. Then divide by 2: x = 7.",
    category: "math",
    difficultyLevel: 2,
  },
  {
    id: "8",
    question: "If f(x) = 3x² - 2x + 5, what is f(4)?",
    options: ["41", "45", "49", "53"],
    correctAnswer: 1,
    explanation: "f(4) = 3(4)² - 2(4) + 5 = 3(16) - 8 + 5 = 48 - 8 + 5 = 45.",
    category: "math",
    difficultyLevel: 5,
  },
  {
    id: "9",
    question:
      "A car travels 150 miles in 3 hours. What is its average speed in miles per hour?",
    options: ["40 mph", "45 mph", "50 mph", "55 mph"],
    correctAnswer: 2,
    explanation:
      "Average speed = distance ÷ time = 150 miles ÷ 3 hours = 50 mph.",
    category: "math",
    difficultyLevel: 2,
  },
  {
    id: "10",
    question: "If x² - 4x - 5 = 0, what are the values of x?",
    options: [
      "x = 1 or x = 5",
      "x = -1 or x = 5",
      "x = 1 or x = -5",
      "x = -1 or x = -5",
    ],
    correctAnswer: 1,
    explanation: "Factor: (x - 5)(x + 1) = 0. So x = 5 or x = -1.",
    category: "math",
    difficultyLevel: 6,
  },
  {
    id: "11",
    question:
      "A right triangle has legs of lengths 6 and 8. What is the length of the hypotenuse?",
    options: ["9", "10", "12", "14"],
    correctAnswer: 1,
    explanation:
      "Using Pythagorean theorem: √(6² + 8²) = √(36 + 64) = √100 = 10.",
    category: "math",
    difficultyLevel: 4,
  },
  {
    id: "12",
    question: "What is the area of a circle with a radius of 5 units?",
    options: ["10π", "15π", "20π", "25π"],
    correctAnswer: 3,
    explanation: "Area of a circle = πr² = π(5)² = 25π square units.",
    category: "math",
    difficultyLevel: 5,
  },
  {
    id: "13",
    question: "If 3x - 7 = 2x + 5, what is the value of x?",
    options: ["10", "12", "14", "16"],
    correctAnswer: 1,
    explanation:
      "Subtract 2x from both sides: x - 7 = 5. Add 7 to both sides: x = 12.",
    category: "math",
    difficultyLevel: 3,
  },
  {
    id: "14",
    question:
      "What is the sum of the solutions to the equation 2x² - 3x - 5 = 0?",
    options: ["1/2", "3/2", "5/2", "3"],
    correctAnswer: 1,
    explanation:
      "For ax² + bx + c = 0, the sum of solutions is -b/a = -(-3)/2 = 3/2.",
    category: "math",
    difficultyLevel: 8,
  },
  {
    id: "15",
    question:
      "A survey shows that 60% of students prefer online classes. If 300 students were surveyed, how many prefer online classes?",
    options: ["150", "180", "200", "240"],
    correctAnswer: 1,
    explanation: "60% of 300 = 0.60 × 300 = 180 students.",
    category: "math",
    difficultyLevel: 3,
  },
  {
    id: "16",
    question: 'The word "tenuous" most nearly means:',
    options: ["strong", "weak", "ancient", "complex"],
    correctAnswer: 1,
    explanation: "Tenuous means weak, thin, or insubstantial.",
    category: "reading",
    difficultyLevel: 6,
  },
  {
    id: "17",
    question: 'The word "altruism" most nearly means:',
    options: ["selfishness", "selflessness", "isolation", "ambition"],
    correctAnswer: 1,
    explanation:
      "Altruism means selfless concern for the well-being of others.",
    category: "reading",
    difficultyLevel: 7,
  },
  {
    id: "18",
    question: 'The word "pragmatic" most nearly means:',
    options: ["idealistic", "practical", "theoretical", "emotional"],
    correctAnswer: 1,
    explanation:
      "Pragmatic means dealing with things in a practical and realistic way.",
    category: "reading",
    difficultyLevel: 5,
  },
  {
    id: "19",
    question: 'The word "eclectic" most nearly means:',
    options: ["uniform", "diverse", "simple", "traditional"],
    correctAnswer: 1,
    explanation:
      "Eclectic means deriving ideas from a broad and diverse range of sources.",
    category: "reading",
    difficultyLevel: 8,
  },
  {
    id: "20",
    question: 'The word "platitudes" most nearly means:',
    options: [
      "original ideas",
      "overused remarks",
      "complex theories",
      "detailed explanations",
    ],
    correctAnswer: 1,
    explanation:
      "Platitudes are overused and unoriginal remarks that lack originality.",
    category: "reading",
    difficultyLevel: 9,
  },
  {
    id: "21",
    question: 'The word "paradigm" most nearly means:',
    options: ["mistake", "model", "confusion", "rejection"],
    correctAnswer: 1,
    explanation:
      "Paradigm means a typical example or pattern of something; a model or framework.",
    category: "reading",
    difficultyLevel: 8,
  },
  {
    id: "22",
    question: 'The word "cursory" most nearly means:',
    options: ["thorough", "hasty", "careful", "detailed"],
    correctAnswer: 1,
    explanation: "Cursory means hasty and therefore not thorough or detailed.",
    category: "reading",
    difficultyLevel: 7,
  },
  {
    id: "23",
    question: 'The word "clandestine" most nearly means:',
    options: ["public", "secret", "obvious", "transparent"],
    correctAnswer: 1,
    explanation:
      "Clandestine means kept secret or done secretively, especially for illicit purposes.",
    category: "reading",
    difficultyLevel: 9,
  },
  {
    id: "24",
    question: 'The word "dogmatic" most nearly means:',
    options: ["flexible", "opinionated", "uncertain", "open-minded"],
    correctAnswer: 1,
    explanation:
      "Dogmatic means inclined to lay down principles as incontrovertibly true, without consideration of evidence or others' opinions.",
    category: "reading",
    difficultyLevel: 9,
  },
  {
    id: "25",
    question: 'The word "idiosyncratic" most nearly means:',
    options: ["common", "peculiar", "standard", "typical"],
    correctAnswer: 1,
    explanation:
      "Idiosyncratic means peculiar or individual; characteristic of a particular person or thing.",
    category: "reading",
    difficultyLevel: 10,
  },
  {
    id: "26",
    question: "What is the median of the data set: {3, 7, 9, 15, 21}?",
    options: ["7", "9", "15", "11"],
    correctAnswer: 1,
    explanation:
      "The median is the middle value when numbers are arranged in order. Here, 9 is the middle value.",
    category: "math",
    difficultyLevel: 3,
  },
];

export const getRandomQuestion = (
  answeredQuestionIds: string[] | Set<string> = []
): Question => {
  const answeredSet =
    answeredQuestionIds instanceof Set
      ? answeredQuestionIds
      : new Set(answeredQuestionIds);

  const unansweredQuestions = SAMPLE_QUESTIONS.filter(
    (q) => !answeredSet.has(q.id)
  );

  const availableQuestions =
    unansweredQuestions.length > 0 ? unansweredQuestions : SAMPLE_QUESTIONS;

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
};

export const getQuestionsByCategory = (
  category: Question["category"]
): Question[] => {
  return SAMPLE_QUESTIONS.filter((q) => q.category === category);
};

export const getQuestionsByDifficultyLevel = (
  minLevel: number,
  maxLevel: number = 10
): Question[] => {
  return SAMPLE_QUESTIONS.filter(
    (q) => q.difficultyLevel >= minLevel && q.difficultyLevel <= maxLevel
  );
};
