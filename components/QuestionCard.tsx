import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  showResult: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}) => {
  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option;
    }

    if (index === question.correctAnswer) {
      return styles.optionCorrect;
    }
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return styles.optionIncorrect;
    }
    return styles.option;
  };

  return (
    <View style={styles.container}>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{question.category.toUpperCase()}</Text>
      </View>
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, getOptionStyle(index)]}
            onPress={() => !showResult && onSelectAnswer(index)}
            disabled={Boolean(showResult)}
          >
            <Text style={styles.optionText}>{option}</Text>
            {showResult && index === question.correctAnswer && (
              <Text style={styles.checkmark}>✓</Text>
            )}
            {showResult && selectedAnswer === index && index !== question.correctAnswer && (
              <Text style={styles.crossmark}>✗</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {showResult && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationLabel}>Explanation:</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionCorrect: {
    backgroundColor: '#C8E6C9',
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    backgroundColor: '#FFCDD2',
    borderColor: '#F44336',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  crossmark: {
    fontSize: 20,
    color: '#F44336',
    fontWeight: 'bold',
  },
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

