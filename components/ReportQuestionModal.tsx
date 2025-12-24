import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { typography } from "../styles/typography";
import { theme } from "../theme";
import { submitQuestionReport } from "../services/questions";

interface ReportQuestionModalProps {
  visible: boolean;
  questionId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "inaccurate_explanation", label: "Inaccurate explanation" },
  { value: "confusing", label: "Question is confusing" },
  { value: "typo", label: "Typo or grammar error" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Other" },
] as const;

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  visible,
  questionId,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setSelectedReason(null);
      setCustomReason("");
      setError(null);
      setSubmitted(false);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      setError("Please provide details");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await submitQuestionReport(
      questionId,
      selectedReason,
      selectedReason === "other" ? customReason.trim() : null
    );

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
      onSuccess?.();
    }
  };

  const isOtherSelected = selectedReason === "other";
  const canSubmit = selectedReason && (!isOtherSelected || customReason.trim());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Question</Text>
          <View style={styles.headerSpacer} />
        </View>

        {submitted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Thank you!</Text>
            <Text style={styles.successMessage}>
              We'll look into it... eventually. 😅
            </Text>
            <TouchableOpacity
              style={styles.closeSuccessButton}
              onPress={handleClose}
            >
              <Text style={styles.closeSuccessButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              Help us improve by reporting any issues with this question.
            </Text>

            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason.value &&
                      styles.reasonOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedReason(reason.value);
                    setError(null);
                  }}
                >
                  <View style={styles.reasonContent}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedReason === reason.value &&
                          styles.radioButtonSelected,
                      ]}
                    >
                      {selectedReason === reason.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.reasonText,
                        selectedReason === reason.value &&
                          styles.reasonTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {isOtherSelected && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.label}>Please provide details:</Text>
                <TextInput
                  style={styles.textInput}
                  value={customReason}
                  onChangeText={(text) => {
                    setCustomReason(text);
                    setError(null);
                  }}
                  placeholder="Describe the issue..."
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!canSubmit || loading) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.onPrimary}
                  />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: typography.fontFamily.regular,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  reasonOptionSelected: {
    backgroundColor: theme.colors.infoBg,
    borderColor: theme.colors.info,
  },
  reasonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: theme.colors.info,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.info,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  reasonTextSelected: {
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.infoStrong,
  },
  customReasonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    minHeight: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.success,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  closeSuccessButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  closeSuccessButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});
