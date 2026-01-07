import axiosInstance from "@/constants/AxiosInstane";
import NetInfo from "@react-native-community/netinfo";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function useIndex() {
  const [loggedInUser, setloggedInUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check network status first (fast operation)
        const netInfo = await NetInfo.fetch();
        const isOnline = netInfo.isConnected ?? false;
        setIsOffline(!isOnline);

        // Check if token exists
        const token = await SecureStore.getItemAsync("accessToken");
        const role = await SecureStore.getItemAsync("role");

        if (!token) {
          // No token, user is a guest
          setUserRole(null);
          setloggedInUser(false);
          setLoading(false);
          return;
        }

        // Token exists - validate it by trying to fetch user data
        if (isOnline) {
          setIsValidatingToken(true);
          try {
            // Quick validation call with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await axiosInstance.get("/get-user", {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 200 && response.data?.data) {
              // Token is valid
              const userData = response.data.data;
              setUserRole(userData.role || role);
              setloggedInUser(true);
            } else {
              // Token is invalid
              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("role");
              setUserRole(null);
              setloggedInUser(false);
            }
          } catch (error: any) {
            // Token validation failed (expired, invalid, or network error)
            if (error?.response?.status === 401 || error?.name === "AbortError") {
              // Clear invalid token
              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("role");
            }
            setUserRole(null);
            setloggedInUser(false);
          } finally {
            setIsValidatingToken(false);
          }
        } else {
          // Offline - use cached role if available
          setUserRole(role);
          setloggedInUser(!!role); // Trust cached role when offline
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    initialize();

    // Force stop loading after 4 seconds as a safety measure
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  // Enhanced loading screen with branding
  if (loading || isValidatingToken) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.content}>
          <Text style={styles.appName}>Muslim Compass</Text>
          <ActivityIndicator size="large" color="white" style={styles.spinner} />
          <Text style={styles.loadingText}>
            {isValidatingToken ? "Validating session..." : "Loading..."}
          </Text>
        </View>
      </View>
    );
  }

  // Determine redirect path based on auth state
  let redirectPath: "/login" | "/(tabs)/add-hotel" | "/(tabs)" | "/(tabs)/prayer" | "/offline-welcome";

  // Handle offline-first routing
  if (isOffline && !loggedInUser) {
    redirectPath = "/offline-welcome";
  } else if (loggedInUser && userRole) {
    // Authenticated users go to their role-specific screen
    redirectPath = userRole === "vendor" ? "/(tabs)/add-hotel" : "/(tabs)";
  } else {
    // Guest users can access prayer times and browsing features
    redirectPath = "/(tabs)/prayer";
  }

  return <Redirect href={redirectPath} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#10ac84",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
    letterSpacing: 1,
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
    opacity: 0.9,
  },
});
