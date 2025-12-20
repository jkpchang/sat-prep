import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import {
  getPrivateLeaderboardMembers,
  getPrivateLeaderboardsForUser,
  removeMemberFromLeaderboard,
  deletePrivateLeaderboard,
  addMemberToLeaderboard,
  transferOwnership,
} from "../services/leaderboard";
import { CreateLeaderboardModal } from "../components/CreateLeaderboardModal";
import { AddMemberModal } from "../components/AddMemberModal";
import { TransferOwnershipModal } from "../components/TransferOwnershipModal";
import { LeaderboardMember, PrivateLeaderboard } from "../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CustomAlert, AlertButton } from "../components/CustomAlert";

type RootStackParamList = {
  Main: undefined;
  Quiz: undefined;
  Leaderboard: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

type PrivateLeaderboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PrivateLeaderboard"
>;

interface PrivateLeaderboardScreenProps {
  navigation: PrivateLeaderboardScreenNavigationProp;
  route: { params: { leaderboardId: string } };
}

export const PrivateLeaderboardScreen: React.FC<PrivateLeaderboardScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { authProfile } = useAuth();
  const { leaderboardId } = route.params;
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<PrivateLeaderboard | null>(null);
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [sortBy, setSortBy] = useState<"xp" | "streak">("xp");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
  } | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardId, sortBy]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const membersData = await getPrivateLeaderboardMembers(leaderboardId, sortBy);
      setMembers(membersData);

      // Get leaderboard info
      if (authProfile?.userId) {
        const userLeaderboards = await getPrivateLeaderboardsForUser(authProfile.userId);
        const lb = userLeaderboards.find((l) => l.id === leaderboardId);
        if (lb) {
          setLeaderboard(lb);
        }
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[]
  ) => {
    setAlertConfig({ title, message, buttons });
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    setAlertConfig(null);
  };

  const handleRemoveMember = (userId: string, username: string) => {
    if (!authProfile?.userId) return;

    showAlert(
      "Remove Member",
      `Are you sure you want to remove ${username} from this leaderboard?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: hideAlert,
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            hideAlert();
            const result = await removeMemberFromLeaderboard(
              leaderboardId,
              userId,
              authProfile.userId
            );
            if (result.success) {
              loadLeaderboard();
            } else {
              showAlert("Error", result.error || "Failed to remove member", [
                { text: "OK", onPress: hideAlert },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleDeleteLeaderboard = () => {
    if (!authProfile?.userId) return;

    showAlert(
      "Delete Leaderboard",
      "Are you sure you want to delete this leaderboard? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: hideAlert,
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            hideAlert();
            const result = await deletePrivateLeaderboard(
              leaderboardId,
              authProfile.userId
            );
            if (result.success) {
              navigation.goBack();
            } else {
              showAlert("Error", result.error || "Failed to delete leaderboard", [
                { text: "OK", onPress: hideAlert },
              ]);
            }
          },
        },
      ]
    );
  };

  const handleRowClick = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const isOwner = leaderboard?.ownerId === authProfile?.userId;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {leaderboard?.name || "Leaderboard"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, sortBy === "xp" && styles.activeTab]}
          onPress={() => setSortBy("xp")}
        >
          <Text style={[styles.tabText, sortBy === "xp" && styles.activeTabText]}>
            XP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, sortBy === "streak" && styles.activeTab]}
          onPress={() => setSortBy("streak")}
        >
          <Text
            style={[styles.tabText, sortBy === "streak" && styles.activeTabText]}
          >
            Streak
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {members.map((member) => {
            const isCurrentUser = member.userId === authProfile?.userId;
            return (
              <TouchableOpacity
                key={member.userId}
                style={[styles.entry, isCurrentUser && styles.currentUserEntry]}
                onPress={() => handleRowClick(member.userId)}
              >
                <Text
                  style={[styles.rank, isCurrentUser && styles.currentUserText]}
                >
                  {member.rank}
                </Text>
                <Text
                  style={[styles.username, isCurrentUser && styles.currentUserText]}
                  numberOfLines={1}
                >
                  {member.username || "Unknown"}
                </Text>
                <Text
                  style={[styles.value, isCurrentUser && styles.currentUserText]}
                >
                  {sortBy === "xp" ? member.totalXP : member.dayStreak}
                </Text>
                {isOwner && !isCurrentUser && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveMember(member.userId, member.username || "User")
                    }
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}

          {members.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members yet</Text>
            </View>
          )}

          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowAddMemberModal(true)}
              >
                <Text style={styles.actionButtonText}>Add Member</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowTransferModal(true)}
              >
                <Text style={styles.actionButtonText}>Transfer Ownership</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteLeaderboard}
              >
                <Text style={styles.deleteButtonText}>Delete Leaderboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <AddMemberModal
        visible={showAddMemberModal}
        leaderboardId={leaderboardId}
        onClose={() => setShowAddMemberModal(false)}
        onSuccess={loadLeaderboard}
      />

      <TransferOwnershipModal
        visible={showTransferModal}
        leaderboardId={leaderboardId}
        currentOwnerId={leaderboard?.ownerId || ""}
        onClose={() => setShowTransferModal(false)}
        onSuccess={loadLeaderboard}
      />

      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8ECF0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    fontSize: 16,
    color: "#4ECDC4",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  placeholder: {
    width: 60,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4ECDC4",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserEntry: {
    backgroundColor: "#F0FDFC",
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  rank: {
    width: 50,
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    marginLeft: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    minWidth: 80,
    textAlign: "right",
  },
  currentUserText: {
    color: "#2C3E50",
    fontWeight: "700",
  },
  removeButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E74C3C",
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
  ownerActions: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4ECDC4",
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

