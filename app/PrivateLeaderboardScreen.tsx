import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  getPrivateLeaderboardMembers,
  getPrivateLeaderboardsForUser,
  deletePrivateLeaderboard,
  addMemberToLeaderboard,
  transferOwnership,
} from "../services/leaderboard";
import { CreateLeaderboardModal } from "../components/CreateLeaderboardModal";
import { AddMemberModal } from "../components/AddMemberModal";
import { TransferOwnershipModal } from "../components/TransferOwnershipModal";
import { DeleteMemberModal } from "../components/DeleteMemberModal";
import { AddMemberCelebrationModal } from "../components/AddMemberCelebrationModal";
import { LeaderboardMember, PrivateLeaderboard } from "../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CustomAlert, AlertButton } from "../components/CustomAlert";
import { gamificationService } from "../services/gamification";
import { Alert } from "react-native";

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
  const queryClient = useQueryClient();
  const { leaderboardId } = route.params;
  const [sortBy, setSortBy] = useState<"xp" | "streak">("xp");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
  } | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [addedMemberUsername, setAddedMemberUsername] = useState("");

  // Initialize gamification service
  useEffect(() => {
    gamificationService.initialize();
  }, []);

  // Query for leaderboard members
  const {
    data: members = [],
    isLoading: loadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["privateLeaderboardMembers", leaderboardId, sortBy],
    queryFn: () => getPrivateLeaderboardMembers(leaderboardId, sortBy),
  });

  // Query for leaderboard info
  const {
    data: leaderboard,
    isLoading: loadingLeaderboard,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ["privateLeaderboard", leaderboardId, authProfile?.userId],
    queryFn: async () => {
      if (!authProfile?.userId) return null;
      const userLeaderboards = await getPrivateLeaderboardsForUser(authProfile.userId);
      return userLeaderboards.find((l) => l.id === leaderboardId) || null;
    },
    enabled: !!authProfile?.userId,
  });

  // Refresh both queries
  const handleRefresh = () => {
    refetchMembers();
    refetchLeaderboard();
  };

  const loading = loadingMembers || loadingLeaderboard;

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

  // Mutation for deleting leaderboard
  const deleteMutation = useMutation({
    mutationFn: ({ leaderboardId, ownerId }: { leaderboardId: string; ownerId: string }) =>
      deletePrivateLeaderboard(leaderboardId, ownerId),
    onSuccess: () => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["privateLeaderboards"] });
      queryClient.invalidateQueries({ queryKey: ["privateLeaderboard", leaderboardId] });
      navigation.goBack();
    },
    onError: (error: any) => {
      showAlert("Error", error?.message || "Failed to delete leaderboard", [
        { text: "OK", onPress: hideAlert },
      ]);
    },
  });

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
          onPress: () => {
            hideAlert();
            deleteMutation.mutate({ leaderboardId, ownerId: authProfile.userId });
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
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, sortBy === "xp" && styles.activeTab]}
          onPress={() => setSortBy("xp")}
        >
          <Text style={[styles.tabText, sortBy === "xp" && styles.activeTabText]}>
            ⭐ XP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, sortBy === "streak" && styles.activeTab]}
          onPress={() => setSortBy("streak")}
        >
          <Text
            style={[styles.tabText, sortBy === "streak" && styles.activeTabText]}
          >
            🔥 Streak
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
                  <Text style={styles.valueIcon}>
                    {sortBy === "xp" ? "⭐" : "🔥"}
                  </Text>
                  {sortBy === "xp" ? member.totalXP : member.dayStreak}
                </Text>
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
                <Text style={styles.actionButtonIcon}>+</Text>
                <Text style={styles.actionButtonText}>Add User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowDeleteMemberModal(true)}
              >
                <Text style={styles.actionButtonIcon}>−</Text>
                <Text style={styles.actionButtonText}>Remove User</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowTransferModal(true)}
              >
                <Text style={styles.actionButtonIcon}>⇄</Text>
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteLeaderboard}
              >
                <Text style={styles.deleteButtonIcon}>×</Text>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <AddMemberModal
        visible={showAddMemberModal}
        leaderboardId={leaderboardId}
        onClose={() => setShowAddMemberModal(false)}
        onSuccess={(username) => {
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboardMembers", leaderboardId] });
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboards"] });
          // Show celebration modal with the added member's username
          setAddedMemberUsername(username);
          setShowCelebrationModal(true);
        }}
      />

      <DeleteMemberModal
        visible={showDeleteMemberModal}
        leaderboardId={leaderboardId}
        members={members}
        ownerId={leaderboard?.ownerId || ""}
        onClose={() => setShowDeleteMemberModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboardMembers", leaderboardId] });
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboards"] });
        }}
      />

      <TransferOwnershipModal
        visible={showTransferModal}
        leaderboardId={leaderboardId}
        currentOwnerId={leaderboard?.ownerId || ""}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboard", leaderboardId] });
          queryClient.invalidateQueries({ queryKey: ["privateLeaderboards"] });
        }}
      />

      <AddMemberCelebrationModal
        visible={showCelebrationModal}
        username={addedMemberUsername}
        onClose={() => {
          setShowCelebrationModal(false);
          setAddedMemberUsername("");
        }}
        onCollectXP={async () => {
          const result = await gamificationService.addBonusXP(10);
          
          if (result.newAchievements.length > 0) {
            setTimeout(() => {
              Alert.alert(
                "🎉 Achievement Unlocked!",
                result.newAchievements.map((a) => `${a.icon} ${a.name}`).join("\n"),
                [{ text: "Awesome!" }]
              );
            }, 500);
          }
        }}
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
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
  },
  refreshIcon: {
    fontSize: 18,
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
    lineHeight: 22,
  },
  valueIcon: {
    fontSize: 16,
    marginRight: 3,
    lineHeight: 22,
  },
  currentUserText: {
    color: "#2C3E50",
    fontWeight: "700",
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
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#4ECDC4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
    maxHeight: 70,
    paddingVertical: 8,
  },
  actionButtonIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  deleteButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
    maxHeight: 70,
    paddingVertical: 8,
  },
  deleteButtonIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

