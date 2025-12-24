import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text, View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Comfortaa_400Regular,
  Comfortaa_700Bold,
} from "@expo-google-fonts/comfortaa";
import { HomeScreen } from "./app/HomeScreen";
import { QuizScreen } from "./app/QuizScreen";
import { ProgressScreen } from "./app/ProgressScreen";
import { ProfileScreen } from "./app/ProfileScreen";
import { LeaderboardScreen } from "./app/LeaderboardScreen";
import { GlobalLeaderboardScreen } from "./app/GlobalLeaderboardScreen";
import { PrivateLeaderboardScreen } from "./app/PrivateLeaderboardScreen";
import { UserProfileScreen } from "./app/UserProfileScreen";
import { AuthProvider } from "./contexts/AuthContext";
import { theme } from "./theme";
import { AppIcon } from "./components/AppIcon";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

type TabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Progress: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Quiz: undefined;
  GlobalLeaderboard: { type: "xp" | "streak" };
  PrivateLeaderboard: { leaderboardId: string };
  UserProfile: { userId: string };
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingBottom: 12,
          paddingTop: 12,
          height: 70,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="nav.home"
              size="lg"
              color={focused ? theme.colors.primaryPressed : theme.colors.textMuted}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="nav.leaderboard"
              size="lg"
              color={focused ? theme.colors.warningText : theme.colors.textMuted}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="nav.progress"
              size="lg"
              color={focused ? theme.colors.infoStrong : theme.colors.textMuted}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AppIcon
              name="nav.profile"
              size="lg"
              color={focused ? theme.colors.secondaryPressed : theme.colors.textMuted}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Comfortaa_400Regular,
    Comfortaa_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Stack.Navigator
              screenOptions={{
                animation: "none",
              }}
            >
              <Stack.Screen
                name="Main"
                component={HomeTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="GlobalLeaderboard"
                component={GlobalLeaderboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PrivateLeaderboard"
                component={PrivateLeaderboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
