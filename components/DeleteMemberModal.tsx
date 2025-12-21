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
                <ActivityIndicator size="small" color="#FFFFFF" />
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
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#7F8C8D",
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
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
  },
  selectedMember: {
    backgroundColor: "#E74C3C",
  },
  memberName: {
    fontSize: 16,
    color: "#2C3E50",
    fontWeight: "500",
  },
  selectedMemberText: {
    color: "#FFFFFF",
  },
  checkmark: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    padding: 32,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
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
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#E74C3C",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
