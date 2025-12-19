import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "deviceId";

export async function getOrCreateDeviceId(): Promise<string> {
  let existingId: string | null = null;

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      existingId = window.localStorage.getItem(DEVICE_ID_KEY);
    }
  } else {
    existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  }

  if (existingId) return existingId;

  const newId = uuidv4();

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEVICE_ID_KEY, newId);
    }
  } else {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
  }

  return newId;
}


