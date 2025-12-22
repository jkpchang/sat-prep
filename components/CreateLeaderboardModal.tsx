import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { createPrivateLeaderboard } from "../services/leaderboard";
import { useAuth } from "../contexts/AuthContext";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface CreateLeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (leaderboardId: string) => void;
}

export const CreateLeaderboardModal: React.FC<CreateLeaderboardModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { authProfile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!authProfile?.userId) {
      setError("You must be signed in to create a leaderboard");
      return;
    }

    if (!name.trim()) {
      setError("Leaderboard name is required");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createPrivateLeaderboard(
      name.trim(),
      description.trim() || null,
      authProfile.userId
    );

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.leaderboard) {
      setName("");
      setDescription("");
      setError(null);
      onSuccess(result.leaderboard.id);
      onClose();
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Leaderboard</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter leaderboard name"
            maxLength={100}
            editable={!loading}
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={3}
            maxLength={500}
            editable={!loading}
          />

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
              style={[styles.button, styles.createButton]}
              onPress={handleCreate}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    marginTop: 8,
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
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  createButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});

