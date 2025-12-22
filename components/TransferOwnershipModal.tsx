import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { transferOwnership } from "../services/leaderboard";
import { getPrivateLeaderboardMembers } from "../services/leaderboard";
import { LeaderboardMember } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { typography } from "../styles/typography";
import { theme } from "../theme";

interface TransferOwnershipModalProps {
  visible: boolean;
  leaderboardId: string;
  currentOwnerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  visible,
  leaderboardId,
  currentOwnerId,
  onClose,
  onSuccess,
}) => {
  const { authProfile } = useAuth();
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible, leaderboardId]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const membersData = await getPrivateLeaderboardMembers(leaderboardId, "xp");
      // Filter out current owner
      const eligibleMembers = membersData.filter(
        (m) => m.userId !== currentOwnerId
      );
      setMembers(eligibleMembers);
    } catch (err) {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!authProfile?.userId || !selectedUserId) {
      setError("Please select a member");
      return;
    }

    setTransferring(true);
    setError(null);

    const result = await transferOwnership(
      leaderboardId,
      selectedUserId,
      authProfile.userId
    );

    setTransferring(false);

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
          <Text style={styles.title}>Transfer Ownership</Text>
          <Text style={styles.subtitle}>
            Select a member to transfer ownership to
          </Text>

          {loading ? (
            <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.membersList}>
              {members.map((member) => (
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
              {members.length === 0 && (
                <Text style={styles.emptyText}>No eligible members</Text>
              )}
            </ScrollView>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={transferring}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.transferButton,
                !selectedUserId && styles.disabledButton,
              ]}
              onPress={handleTransfer}
              disabled={transferring || !selectedUserId}
            >
              {transferring ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.transferButtonText}>Transfer</Text>
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
  centerContent: {
    padding: 32,
    alignItems: "center",
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
    backgroundColor: theme.colors.primary,
  },
  memberName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.text,
  },
  selectedMemberText: {
    color: theme.colors.onPrimary,
  },
  checkmark: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: theme.colors.onPrimary,
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
  transferButton: {
    backgroundColor: theme.colors.primary,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral300,
  },
  transferButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});

