import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SvgXml } from "react-native-svg";
import { Question } from "../types";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { ReportQuestionModal } from "./ReportQuestionModal";
import { AppIcon } from "./AppIcon";

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
  const [showReportModal, setShowReportModal] = useState(false);

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
        <Text style={styles.categoryText}>
          {question.category.toUpperCase()}
        </Text>
      </View>

      {/* Render SVG if defined */}
      {question.imageSvg && (
        <View style={styles.imageContainer}>
          <View style={{ paddingVertical: 16 }}>
            <SvgXml xml={question.imageSvg} />
          </View>
        </View>
      )}

      {/* Render base64/data-uri image if defined */}
      {question.imageDataUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: question.imageDataUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      )}

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, getOptionStyle(index)]}
            onPress={() => !showResult && onSelectAnswer(index)}
            disabled={Boolean(showResult)}
          >
            {question.renderOptionsAsSvg &&
            question.optionsSvg &&
            question.optionsSvg[index] ? (
              <View style={styles.optionSvgContainer}>
                <SvgXml xml={question.optionsSvg[index]} />
              </View>
            ) : (
              <Text style={styles.optionText}>{option}</Text>
            )}
            {showResult && index === question.correctAnswer && (
              <AppIcon name="ui.check" size="sm" color={theme.colors.successStrong} />
            )}
            {showResult &&
              selectedAnswer === index &&
              index !== question.correctAnswer && (
                <AppIcon name="ui.close" size="sm" color={theme.colors.dangerStrong} />
              )}
          </TouchableOpacity>
        ))}
      </View>
      {showResult && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationLabel}>Explanation:</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
          <TouchableOpacity
            style={styles.reportLink}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={styles.reportLinkText}>Report an issue with this question</Text>
          </TouchableOpacity>
        </View>
      )}

      <ReportQuestionModal
        visible={showReportModal}
        questionId={question.id}
        onClose={() => setShowReportModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    margin: 16,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  formulaContainer: {
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 8,
    minHeight: 100,
    width: "100%",
  },
  questionText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionSvgContainer: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  option: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: theme.colors.infoBg,
    borderColor: theme.colors.info,
  },
  optionCorrect: {
    backgroundColor: theme.colors.successBg,
    borderColor: theme.colors.successStrong,
  },
  optionIncorrect: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.dangerStrong,
  },
  optionText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 22,
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.successStrong,
    fontFamily: typography.fontFamily.bold,
  },
  crossmark: {
    fontSize: 20,
    color: theme.colors.dangerStrong,
    fontFamily: typography.fontFamily.bold,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.colors.infoBgAlt,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  explanationLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.infoStrong,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textGray,
    lineHeight: 20,
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 8,
    padding: 8,
  },
  image: {
    width: "100%",
    height: 200,
  },
  reportLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  reportLinkText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.info,
    textDecorationLine: "underline",
  },
});
