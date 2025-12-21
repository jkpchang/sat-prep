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
                <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#E74C3C",
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
    backgroundColor: "#F8F9FA",
  },
  cancelButtonText: {
    color: "#2C3E50",
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  addButton: {
    backgroundColor: "#4ECDC4",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});

