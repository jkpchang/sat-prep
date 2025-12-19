import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { HomeScreen } from "./app/HomeScreen";
import { QuizScreen } from "./app/QuizScreen";
import { ProgressScreen } from "./app/ProgressScreen";
import { ProfileScreen } from "./app/ProfileScreen";
import { gamificationService } from "./services/gamification";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#4ECDC4",
        tabBarInactiveTintColor: "#7F8C8D",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingBottom: 12,
          paddingTop: 12,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 32,
                color: focused ? "#4ECDC4" : "#7F8C8D",
              }}
            >
              🏠
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 32,
                color: focused ? "#4ECDC4" : "#7F8C8D",
              }}
            >
              📊
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 32,
                color: focused ? "#4ECDC4" : "#7F8C8D",
              }}
            >
              👤
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize gamification service on app start
    gamificationService.initialize().catch(console.error);
  }, []);

  return (
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
