import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { removeMemberFromLeaderboard } from "../services/leaderboard";
import { LeaderboardMember } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface DeleteMemberModalProps {
  visible: boolean;
  leaderboardId: string;
  members: LeaderboardMember[];
  ownerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  visible,
  leaderboardId,
  members,
  ownerId,
  onClose,
  onSuccess,
}) => {
  const { authProfile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Filter out the owner (can't delete themselves)
  const deletableMembers = members.filter((m) => m.userId !== ownerId);

  const handleDelete = async () => {
    if (!authProfile?.userId || !selectedUserId) {
      setError("Please select a member");
      return;
    }

    setDeleting(true);
    setError(null);

    const result = await removeMemberFromLeaderboard(
      leaderboardId,
      selectedUserId,
      authProfile.userId
    );

    setDeleting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSelectedUserId(null);
      setError(null);
      onSuccess();
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedUserId(null);
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
          <Text style={styles.title}>Remove Member</Text>
          <Text style={styles.subtitle}>
            Select a member to remove from this leaderboard
          </Text>

          <ScrollView style={styles.membersList}>
            {deletableMembers.map((member) => (
              <TouchableOpacity
                key={member.userId}
                style={[
                  styles.memberItem,
                  selectedUserId === member.userId && styles.selectedMember,
                ]}
                onPress={() => setSelectedUserId(member.userId)}
              >
                <Text
                  style={[
                    styles.memberName,
                    selectedUserId === member.userId &&
                      styles.selectedMemberText,
                  ]}
                >
                  {member.username || "Unknown"}
                </Text>
                {selectedUserId === member.userId && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            {deletableMembers.length === 0 && (
              <Text style={styles.emptyText}>
                No members available to remove
              </Text>
            )}
          </ScrollView>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={deleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                !selectedUserId && styles.disabledButton,
              ]}
              onPress={handleDelete}
              disabled={deleting || !selectedUserId}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={theme.colors.onDanger} />
              ) : (
                <Text style={styles.deleteButtonText}>Remove</Text>
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
    maxHeight: "80%",
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  membersList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    marginBottom: 8,
  },
  selectedMember: {
    backgroundColor: theme.colors.danger,
  },
  memberName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  selectedMemberText: {
    color: theme.colors.onDanger,
  },
  checkmark: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.onDanger,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: theme.colors.textMuted,
    textAlign: "center",
    padding: 32,
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
    marginTop: 16,
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
  deleteButton: {
    backgroundColor: theme.colors.danger,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral300,
  },
  deleteButtonText: {
    color: theme.colors.onDanger,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});
