import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { QuestionCard } from '../components/QuestionCard';
import { getRandomQuestion } from '../services/questions';
import { gamificationService } from '../services/gamification';
import { Question, Achievement } from '../types';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TabParamList = {
  Home: undefined;
  Progress: undefined;
};

type RootStackParamList = {
  Main: TabParamList;
  Quiz: undefined;
};

type QuizScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Quiz'>;

interface QuizScreenProps {
  navigation: QuizScreenNavigationProp;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ navigation }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadNewQuestion();
  }, []);

  const loadNewQuestion = () => {
    const newQuestion = getRandomQuestion();
    setQuestion(newQuestion);
    setSelectedAnswer(null);
    setShowResult(false);
    setXpGained(0);
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !question) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setShowResult(true);

    const result = await gamificationService.recordPractice(isCorrect);
    setXpGained(result.xpGained);
    setNewAchievements(result.newAchievements);

    if (result.newAchievements.length > 0) {
      setTimeout(() => {
        Alert.alert(
          '🎉 Achievement Unlocked!',
          result.newAchievements.map(a => `${a.icon} ${a.name}`).join('\n'),
          [{ text: 'Awesome!' }]
        );
      }, 500);
    }
  };

  const handleNext = () => {
    loadNewQuestion();
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  if (!question) {
    return (
      <View style={styles.container}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={styles.placeholder} />
      </View>

      {xpGained > 0 && (
        <View style={styles.xpBanner}>
          <Text style={styles.xpText}>+{xpGained} XP earned!</Text>
        </View>
      )}

      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleSelectAnswer}
        showResult={showResult}
      />

      {!showResult ? (
        <TouchableOpacity
          style={[styles.button, selectedAnswer === null && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={selectedAnswer === null}
        >
          <Text style={styles.buttonText}>Submit Answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleFinish}>
            <Text style={styles.buttonSecondaryText}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleNext}>
            <Text style={styles.buttonText}>Next Question</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 60,
  },
  xpBanner: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    minHeight: 56,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    minHeight: 56,
  },
  buttonSecondaryText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

