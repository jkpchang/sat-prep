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
              <ActivityIndicator size="large" color="#4ECDC4" />
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
                <ActivityIndicator size="small" color="#FFFFFF" />
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
    maxHeight: "80%",
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: "#7F8C8D",
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
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
  },
  selectedMember: {
    backgroundColor: "#4ECDC4",
  },
  memberName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: "#2C3E50",
  },
  selectedMemberText: {
    color: "#FFFFFF",
  },
  checkmark: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: "#FFFFFF",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    color: "#7F8C8D",
    textAlign: "center",
    padding: 32,
  },
  errorText: {
    color: "#E74C3C",
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
    backgroundColor: "#F8F9FA",
  },
  cancelButtonText: {
    color: "#2C3E50",
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
  transferButton: {
    backgroundColor: "#4ECDC4",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  transferButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
  },
});

