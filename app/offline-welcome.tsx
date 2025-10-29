import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

export default function OfflineWelcomeScreen() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      setIsOnline(isConnected);

      // Auto-redirect to login when back online
      if (isConnected) {
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleContinueOffline = () => {
    router.replace("/(tabs)");
  };

  const handleTryLogin = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4A5FBF", "#7B68EE", "#DDA0DD"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="wifi-outline" size={80} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>Welcome to Muslim Guide</Text>
            <Text style={styles.subtitle}>
              {"You're"} currently offline, but you can still access many
              features!
            </Text>
          </View>

          {/* Available Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Available Offline:</Text>
            <View style={styles.featuresList}>
              <FeatureItem icon="🕌" text="Prayer Times (Default Location)" />
              <FeatureItem icon="📅" text="Hijri Calendar" />
              <FeatureItem icon="🔔" text="Prayer Notifications" />
              <FeatureItem icon="📍" text="Cached Locations" />
              <FeatureItem icon="⏰" text="Prayer Countdown" />
              <FeatureItem icon="✅" text="Prayer Tracking" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueOffline}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
              <Text style={styles.continueText}>Continue Offline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleTryLogin}
              disabled={!isOnline}
            >
              <Ionicons
                name="log-in-outline"
                size={20}
                color={isOnline ? "#4A5FBF" : "#999"}
              />
              <Text
                style={[
                  styles.loginText,
                  { color: isOnline ? "#4A5FBF" : "#999" },
                ]}
              >
                {isOnline ? "Sign In (Online)" : "Sign In (Offline)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isOnline ? "#10ac84" : "#FF6B6B" },
              ]}
            >
              <Ionicons
                name={isOnline ? "wifi" : "wifi-outline"}
                size={16}
                color="#fff"
              />
            </View>
            <Text style={styles.statusText}>
              {isOnline ? "Connection restored!" : "No internet connection"}
            </Text>
          </View>

          {/* Note */}
          <Text style={styles.note}>
            Sign in when {"you're"} back online to sync your data and access all
            features
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: {
    flex: 1,
    marginVertical: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A5FBF",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 8,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  note: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 18,
  },
});
