import NetInfo from "@react-native-community/netinfo";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function useIndex() {
  const [loggedInUser, setloggedInUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check network status first (fast operation)
        const netInfo = await NetInfo.fetch();
        const isOnline = netInfo.isConnected ?? false;
        setIsOffline(!isOnline);

        // Check auth state (works offline - reads from SecureStore)
        const token = await SecureStore.getItemAsync("accessToken");
        const role = await SecureStore.getItemAsync("role");

        setUserRole(role);
        setloggedInUser(!!token);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    initialize();

    // Force stop loading after 3 seconds as a safety measure
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading spinner only briefly
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Handle offline-first routing
  if (isOffline && !loggedInUser) {
    return <Redirect href="/offline-welcome" />;
  }

  // Allow guest access to prayer times and hijri calendar (non-account features)
  // Redirect to prayer tab for guests, or main app for logged-in users
  let redirectPath: "/login" | "/(tabs)/add-hotel" | "/(tabs)" | "/(tabs)/prayer" = "/(tabs)/prayer";
  
  if (loggedInUser) {
    redirectPath = userRole === "vendor" ? "/(tabs)/add-hotel" : "/(tabs)";
  }

  // If offline but logged in, go to main app
  if (isOffline && loggedInUser) {
    redirectPath = userRole === "vendor" ? "/(tabs)/add-hotel" : "/(tabs)";
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
  debugText: {
    color: "white",
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
});
