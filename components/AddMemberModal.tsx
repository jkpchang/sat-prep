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
import { addMemberToLeaderboard } from "../services/leaderboard";
import { useAuth } from "../contexts/AuthContext";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface AddMemberModalProps {
  visible: boolean;
  leaderboardId: string;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  leaderboardId,
  onClose,
  onSuccess,
}) => {
  const { authProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!authProfile?.userId) {
      setError("You must be signed in");
      return;
    }

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await addMemberToLeaderboard(
      leaderboardId,
      username.trim(),
      authProfile.userId
    );

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      const addedUsername = username.trim();
      setUsername("");
      setError(null);
      onClose();
      onSuccess(addedUsername);
    }
  };

  const handleClose = () => {
    setUsername("");
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
          <Text style={styles.title}>Add Member</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
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
              style={[styles.button, styles.addButton]}
              onPress={handleAdd}
              disabled={loading || !username.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
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
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});

