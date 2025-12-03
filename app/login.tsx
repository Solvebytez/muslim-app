import { ThemedText } from "@/components/ThemedText";
import JWT from "expo-jwt";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import RadioButton from "@/components/form/RadioButton";
import { height } from "@/constants/GblobalVar";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import axiosInstance from "@/constants/AxiosInstane";
import useDateTimeLocation from "@/hooks/prayerHooks/useCurrentuserlocateion";
import NetInfo from "@react-native-community/netinfo";
import { AxiosError } from "axios";
import Constants from "expo-constants";
import { setItemAsync } from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";

const loginImage = require("@/assets/images/icons/login-icon.png");
const googleIcon = require("@/assets/images/icons/search.png");

const secret = Constants.expoConfig?.extra?.APP_API_TOKEN;

export default function LoginScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [emailPasswordModalVisible, setEmailPasswordModalVisible] =
    useState(false);
  const [selectedUserType, setSelectedUserType] = useState("user");
  const [isOnline, setIsOnline] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const { location } = useDateTimeLocation();

  const router = useRouter();

  // Check network status when login screen loads
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const isConnected = netInfo.isConnected ?? false;
        setIsOnline(isConnected);

        // If offline, show alert and redirect to offline welcome
        if (!isConnected) {
          Alert.alert(
            "No Internet Connection",
            "You need an internet connection to sign in. Please check your connection and try again.",
            [
              {
                text: "Continue Offline",
                onPress: () => router.replace("/offline-welcome"),
              },
            ]
          );
        }
      } catch (error) {
        console.error("Error checking network status:", error);
      }
    };

    checkNetworkStatus();
  }, [router]);

  const configureGoogleSignin = () => {
    GoogleSignin.configure({
      webClientId:
        "1080606585301-kq8ohu16bgejqnabp0ktjdsaj7blbq57.apps.googleusercontent.com", // Web Client ID
      iosClientId: Constants.expoConfig?.extra?.EXPO_GOOGLE_IOS_CLIENT_ID, // iOS Client ID from app.json
      offlineAccess: true, // optional
    });
  };

  useEffect(() => {
    configureGoogleSignin();
  }, []);

  const handleGoogleSignin = async () => {
    // Check if offline before attempting sign-in
    if (!isOnline) {
      Alert.alert(
        "No Internet Connection",
        "You need an internet connection to sign in with Google. Please check your connection and try again.",
        [
          {
            text: "Continue Offline",
            onPress: () => router.replace("/offline-welcome"),
          },
        ]
      );
      return;
    }

    setIsSocialLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("user info***********************", userInfo);
      if (isSuccessResponse(userInfo)) {
        console.log("user info***********************", userInfo.data.user);

        console.log(
          "🔍 Google Sign-in - Selected user type:",
          selectedUserType
        );
        await authHandle({
          name:
            userInfo.data.user.name ||
            userInfo.data.user.givenName ||
            userInfo.data.user.familyName ||
            "",
          email: userInfo.data.user.email,
          avatar: userInfo.data.user.photo || "",
          role: selectedUserType,
        });
        // User signed in successfully
      } else {
        console.log("user cancelled", userInfo);
        // sign in was cancelled by user
        setIsSocialLoading(false);
      }
    } catch (error) {
      console.log("error", error);
      setIsSocialLoading(false);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            console.log("operation (eg. sign in) already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            Alert.alert(
              "Sign-In Failed",
              "Google Play Services are not available. Please update Google Play Services and try again."
            );
            break;
          default:
            // some other error happened
            Alert.alert(
              "Sign-In Failed",
              "Unable to sign in with Google. Please try again."
            );
            break;
        }
      } else {
        // an error that's not related to google sign in occurred
        Alert.alert(
          "Sign-In Failed",
          "An unexpected error occurred. Please try again."
        );
      }
    }
  };

  const signInoptons = async () => {
    configureGoogleSignin(); // Configure first
    const currentUser = await GoogleSignin.getCurrentUser();
    if (currentUser) {
      await GoogleSignin.signOut();
      console.log("Google Sign-in logout successful");
    }
    setModalVisible(true);
  };

  const handleAppleSignin = async () => {
    if (!AppleAuthentication) {
      Alert.alert(
        "Not Available",
        "Apple Sign-In is not available on this device."
      );
      return;
    }

    // Check if offline before attempting sign-in
    if (!isOnline) {
      Alert.alert(
        "No Internet Connection",
        "You need an internet connection to sign in with Apple. Please check your connection and try again.",
        [
          {
            text: "Continue Offline",
            onPress: () => router.replace("/offline-welcome"),
          },
        ]
      );
      return;
    }

    // Check if Apple Authentication is available (iOS 13+)
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Not Available",
          "Sign in with Apple is not available on this device."
        );
        return;
      }

      // Show modal to select user type first
      setModalVisible(true);
    } catch (error) {
      console.error("Apple Sign-In availability check failed:", error);
      Alert.alert("Error", "Unable to check Apple Sign-In availability.");
    }
  };

  const performAppleSignIn = async () => {
    if (!AppleAuthentication) {
      Alert.alert(
        "Not Available",
        "Apple Sign-In is not available on this device."
      );
      return;
    }

    // Close modal first
    setModalVisible(false);
    setIsSocialLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("Apple Sign-In credential:", credential);

      // Extract user information
      // Note: name and email may be null on subsequent sign-ins
      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ""} ${
            credential.fullName.familyName || ""
          }`.trim()
        : "";

      // For Apple, email might be hidden - use user identifier if email is null
      // Apple provides a unique user ID that we can use
      const userEmail =
        credential.email || `${credential.user}@privaterelay.appleid.com`;

      // Call authHandle with Apple provider
      await authHandle({
        name: fullName || "Apple User",
        email: userEmail,
        avatar: "", // Apple doesn't provide profile photo
        role: selectedUserType,
        provider: "apple",
      });
    } catch (error: any) {
      console.log("Apple Sign-In error:", error);
      setIsSocialLoading(false);

      if (error.code === "ERR_REQUEST_CANCELED") {
        // User canceled the sign-in
        console.log("User canceled Apple Sign-In");
      } else {
        Alert.alert(
          "Sign-In Failed",
          "Unable to sign in with Apple. Please try again."
        );
      }
    }
  };

  const handleEmailPasswordLogin = async () => {
    // Check if offline
    if (!isOnline) {
      Alert.alert(
        "No Internet Connection",
        "You need an internet connection to sign in. Please check your connection and try again.",
        [
          {
            text: "Continue Offline",
            onPress: () => router.replace("/offline-welcome"),
          },
        ]
      );
      return;
    }

    // Basic validation
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/email-login", {
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log(
        "✅ Email Login Response:",
        response?.status,
        response?.data.data
      );

      if (response?.status === 200) {
        const accessToken = response?.data.data.accessToken;
        const refreshToken = response?.data.data.refreshToken;
        const userData = response?.data.data.user;

        if (accessToken && userData) {
          console.log("🔐 Storing user data...");
          await setItemAsync("accessToken", accessToken);
          if (refreshToken) {
            await setItemAsync("refreshToken", refreshToken);
          }
          await setItemAsync("name", userData.name || "");
          await setItemAsync(
            "email",
            userData.email || email.trim().toLowerCase()
          );
          await setItemAsync("role", userData.role || "user");

          // Close modal and reset form
          setEmailPasswordModalVisible(false);
          setEmail("");
          setPassword("");

          // Redirect based on role
          if (userData.role === "user") {
            router.replace("/(tabs)");
          } else if (userData.role === "vendor") {
            router.replace("/(tabs)/add-hotel");
          } else {
            router.replace("/(tabs)");
          }
        } else {
          throw new Error("Access token or user data missing in response");
        }
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: unknown) {
      console.log("❌ Email Login Error");

      let errorMessage = "Login failed. Please try again.";

      if (error instanceof AxiosError) {
        if (error.response) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            "Invalid email or password";
          console.log(
            "🔴 Response error:",
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          errorMessage = "Network error. Please check your connection.";
          console.log("🟡 No response from server");
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const authHandle = async ({
    name,
    email,
    avatar,
    role,
    provider = "google",
  }: {
    name: string;
    email: string;
    role: string;
    avatar: string;
    provider?: "google" | "apple";
  }) => {
    try {
      const user = { name, email, avatar, role };
      console.log("🔍 JWT Token - User data being encoded:", user);
      
      // Validate secret before encoding
      if (!secret) {
        console.error("❌ APP_API_TOKEN is not configured");
        throw new Error("App configuration error. Please contact support.");
      }
      
      const token = JWT.encode(user, secret);
      await setItemAsync("avatar", avatar); // Fixed to use SecureStore
      const endpoint = provider === "apple" ? "/apple-login" : "/google-login";
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await axiosInstance.post(endpoint, {
        signInToken: token,
        location: {
          latitude: location?.latitude,
          longitude: location?.longitude,
          city: location?.city,
          region: location?.region,
          country: location?.country,
          postalCode: location?.postalCode,
        },
      }, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(
        "✅ Server responded:",
        response?.status,
        response?.data.data
      );

      if (response?.status === 200 || response?.status === 201) {
        const accessToken = response?.data.data.accessToken;
        const roleData = response?.data.data.role;
        console.log("🔍 Login Response - Server role:", roleData);
        console.log("🔍 Login Response - Selected role:", selectedUserType);
        console.log("🔍 Login Response - Full response:", response?.data.data);

        if (accessToken) {
          console.log("🔐 Storing user data...");
          await setItemAsync("accessToken", accessToken);
          await setItemAsync("name", name);
          await setItemAsync("email", email);
          await setItemAsync("role", roleData);
          setIsSocialLoading(false);
          if (roleData === "user") {
            router.replace("/(tabs)");
          } else {
            router.replace("/(tabs)/add-hotel");
          }
        } else {
          console.warn("⚠️ Access token missing in response.");
          throw new Error("Server response missing authentication token");
        }
      } else {
        console.warn("⚠️ Unexpected status code:", response.status);
        throw new Error("Unexpected server response. Please try again.");
      }
    } catch (error: unknown) {
      console.log("❌ Sign-In Error (full details)");
      setIsSocialLoading(false);

      let errorMessage = "Unable to sign in. Please try again.";

      if (error instanceof AxiosError) {
        if (error.code === "ECONNABORTED" || error.name === "AbortError") {
          errorMessage = "Connection timed out. Please check your internet and try again.";
        } else if (error.response) {
          console.log("🔴 Response error:", error.response.status, error.response.data);
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        "Server error. Please try again later.";
        } else if (error.request) {
          console.log("🟡 No response from server (network error)");
          errorMessage = "Unable to connect to server. Please check your internet connection.";
        } else {
          console.log("🔵 Axios setup error:", error.message);
        }
      } else if (error instanceof Error) {
        console.log("🟣 Non-Axios Error:", error.message);
        if (error.name === "AbortError") {
          errorMessage = "Connection timed out. Please check your internet and try again.";
        } else {
          errorMessage = error.message;
        }
      } else {
        console.log("⚫ Unknown error type:", typeof error);
      }

      // Show user-friendly error message
      Alert.alert("Sign-In Failed", errorMessage);
    }
  };

  // Don't block on location - show login screen immediately
  // Location will be handled in background

  console.log("Location coordinates:", location);

  return (
    <LinearGradient colors={["#44A08D", "#093637"]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <View style={styles.content}>
            {/* Offline indicator */}
            {!isOnline && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="wifi-outline" size={16} color="#FF6B6B" />
                <Text style={styles.offlineText}>No Internet Connection</Text>
              </View>
            )}

            <ThemedText type="title" style={{ lineHeight: 40, color: "white" }}>
              Sign in
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign into any of our app with a single Login and sync between them
            </ThemedText>

            <View style={styles.illustrationContainer}>
              <Image
                source={loginImage}
                style={styles.illustration}
                resizeMode="center"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton,
                { flexDirection: "row", gap: 10, marginBottom: 15, opacity: isSocialLoading ? 0.7 : 1 },
              ]}
              onPress={() => setEmailPasswordModalVisible(true)}
              disabled={isSocialLoading}
            >
              <Ionicons name="mail-outline" size={20} color="#093637" />
              <ThemedText
                style={[
                  styles.signInButtonText,
                  { fontFamily: "ZillaSlabBold" },
                ]}
              >
                Login with email & Password
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signInButton,
                {
                  flexDirection: "row",
                  gap: 10,
                  marginBottom: Platform.OS === "ios" ? 15 : 0,
                  opacity: isSocialLoading ? 0.7 : 1,
                },
              ]}
              onPress={signInoptons}
              disabled={isSocialLoading}
            >
              <Image source={googleIcon} style={{ width: 20, height: 20 }} />
              <ThemedText
                style={[
                  styles.signInButtonText,
                  { fontFamily: "ZillaSlabBold" },
                ]}
              >
                Continue With Google
              </ThemedText>
            </TouchableOpacity>

            {/* Apple Sign-In Button (iOS only) */}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  {
                    flexDirection: "row",
                    gap: 10,
                    backgroundColor: "#000",
                    opacity: isSocialLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleAppleSignin}
                disabled={isSocialLoading}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <ThemedText
                  style={[
                    styles.signInButtonText,
                    { fontFamily: "ZillaSlabBold", color: "#fff" },
                  ]}
                >
                  Continue With Apple
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {/* Loading overlay for social login */}
            {isSocialLoading && (
              <View style={styles.socialLoadingContainer}>
                <ActivityIndicator size="small" color="#093637" />
                <Text style={styles.socialLoadingText}>Signing in...</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal for Email/Password Login */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailPasswordModalVisible}
        onRequestClose={() => {
          setEmailPasswordModalVisible(false);
          setEmail("");
          setPassword("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setEmailPasswordModalVisible(false);
              setEmail("");
              setPassword("");
            }}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalHeader}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.modalTitle}>Login</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setEmailPasswordModalVisible(false);
                    setEmail("");
                    setPassword("");
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </TouchableOpacity>

              <View
                style={styles.modalBody}
                onStartShouldSetResponder={() => true}
              >
                <View style={styles.modalInputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#666"
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.modalInputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={styles.modalInputIcon}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.modalEyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { opacity: isLoading ? 0.7 : 1, marginTop: 20 },
                  ]}
                  onPress={handleEmailPasswordLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.continueButtonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal for User Type Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Continue as</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose how you want to continue with Google
            </Text>

            <View style={styles.radioGroup}>
              <RadioButton
                label="User"
                selected={selectedUserType === "user"}
                onPress={() => setSelectedUserType("user")}
              />
              <RadioButton
                label="Restaurant Owner"
                selected={selectedUserType === "vendor"}
                onPress={() => setSelectedUserType("vendor")}
              />
            </View>

            <TouchableOpacity
              style={[styles.continueButton, { opacity: isSocialLoading ? 0.7 : 1 }]}
              onPress={() => {
                // Close modal first
                setModalVisible(false);
                // Then trigger the appropriate sign-in
                handleGoogleSignin();
              }}
              disabled={isSocialLoading}
            >
              {isSocialLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>
                  Continue with Google as{" "}
                  {selectedUserType === "user" ? "User" : "Restaurant Owner"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Apple Sign-In button (iOS only) */}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { backgroundColor: "#000", marginTop: 10, opacity: isSocialLoading ? 0.7 : 1 },
                ]}
                onPress={performAppleSignIn}
                disabled={isSocialLoading}
              >
                {isSocialLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.continueButtonText}>
                    Continue with Apple as{" "}
                    {selectedUserType === "user" ? "User" : "Restaurant Owner"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1, // <-- Add this line to fill vertical space
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20, // optional: for side spacing
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    marginVertical: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#e3f2fd",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  signInButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signInButtonText: {
    color: "#093637",
    fontSize: 20,
  },
  forgotContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 15,
  },
  forgotText: {
    color: "#fff",
    fontSize: 14,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  orText: {
    color: "#fff",
    marginHorizontal: 10,
  },
  googleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 25,
    height: 25,
  },
  homeIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#fff",
    borderRadius: 3,
    marginTop: "auto",
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: "#1e88e5",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: "auto",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  radioGroup: {
    marginBottom: 30,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: height * 0.4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  modalBody: {
    flex: 1,
    paddingTop: 10,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
  },
  modalInputIcon: {
    marginRight: 10,
  },
  modalInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  modalEyeIcon: {
    padding: 5,
  },
  // Offline indicator styles
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "center",
  },
  offlineText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  appleButton: {
    width: "100%",
    height: 50,
    marginTop: 10,
  },
  socialLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  socialLoadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});
