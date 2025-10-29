import { GoogleSignin } from "@react-native-google-signin/google-signin";
import axios, { AxiosError, isAxiosError } from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";
import { queryClient } from "./QueryClientProvider";

// Comprehensive logout function to clear all user data
export const clearAllUserData = async () => {
  try {
    // Clear all SecureStore data
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("name");
    await SecureStore.deleteItemAsync("email");
    await SecureStore.deleteItemAsync("avatar");
    await SecureStore.deleteItemAsync("role");

    // Clear any cached location data
    await SecureStore.deleteItemAsync("userLocation");

    // Clear Axios default headers to remove any cached token
    delete axiosInstance.defaults.headers.common["Authorization"];

    // Clear React Query cache to remove all cached data
    queryClient.clear();

    // Sign out from Google
    configureGoogleSignin();
    const currentUser = await GoogleSignin.getCurrentUser();
    if (currentUser) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.error("❌ Error clearing user data:", error);
  }
};
const apiBaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_URL;
const axiosInstance = axios.create({
  baseURL: `${apiBaseUrl}/api/v1/`,
  headers: {
    "Content-Type": "application/json",
  },
});

const configureGoogleSignin = () => {
  if (Platform.OS === "android") {
    GoogleSignin.configure({
      webClientId:
        "587652399701-3lhoo7eb0d5917ctn4vamusqgorl2748.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }
};

// ✅ Add this interceptor to attach token to *every* request
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error?.request) {
      console.log("No response received. Request:", error.request);
    }
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Only check status if response exists
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear all user data on session expiration
      await clearAllUserData();

      Alert.alert("Session Expired", "Please log in again", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]);
    }

    return Promise.reject({ ...error, silent: true });
  }
);

export const setAuthToken = async () => {
  const token = await SecureStore.getItemAsync("accessToken"); // ✅ Use getItemAsync
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"]; // optional fallback
  }
};

export function handleApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return (
        (axiosError.response.data as any)?.message ||
        (axiosError.response.data as any)?.error ||
        `Server error: ${axiosError.response.status}`
      );
    } else if (axiosError.request) {
      return "Network error: Unable to connect to server";
    }
  }

  // Non-Axios or unknown errors
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}
export default axiosInstance;
