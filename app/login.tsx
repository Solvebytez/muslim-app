import { ThemedText } from "@/components/ThemedText";
import JWT from "expo-jwt";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { AxiosError } from "axios";
import Constants from "expo-constants";
import { setItemAsync } from "expo-secure-store";

const loginImage = require("@/assets/images/icons/login-icon.png");
const googleIcon = require("@/assets/images/icons/search.png");

const secret = Constants.expoConfig?.extra?.APP_API_TOKEN;


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("user");
  const { location, isLoading: locationLoading } = useDateTimeLocation()

  const router = useRouter();

  const configureGoogleSignin = () => {
    // Handle login logic here
    if (Platform.OS === "android") {
      console.log("Android");
      GoogleSignin.configure({
        webClientId:
          "587652399701-3lhoo7eb0d5917ctn4vamusqgorl2748.apps.googleusercontent.com", // Web Client ID
        offlineAccess: true, // optional
      });
    }
  };

  useEffect(() => {
    configureGoogleSignin();
  }, []);


  const handleGoogleSignin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
 console.log("user info***********************", userInfo);
      if (isSuccessResponse(userInfo)) {
        console.log("user info***********************", userInfo.data.user);

        authHandle({
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
      }
    } catch (error) {
      console.log("error", error);

      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            console.log("operation (eg. sign in) already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            console.log(
              "Android only, play services not available or outdated"
            );
            break;
          default:
            // some other error happened
            console.log("some other error happened");
            break;
        }
      } else {
        // an error that's not related to google sign in occurred
      }
    }
  };

  const signInoptons = async () => {
     configureGoogleSignin(); // Configure first
       const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          await GoogleSignin.signOut();
          console.log('Google Sign-in logout successful');
        }
    setModalVisible(true);
  };

const authHandle = async ({
  name,
  email,
  avatar,
  role,
}: {
  name: string;
  email: string;
  role: string;
  avatar: string;
}) => {
  try {
    const user = { name, email, avatar, role };
    const token = JWT.encode(user, secret);    
      await setItemAsync("avatar", avatar); // Fixed to use SecureStore
    const response = await axiosInstance.post("/google-login", {
      signInToken: token, // Fixed typo here (was signInTokn)
      location:{
        latitude: location?.latitude,
        longitude: location?.longitude,
        city: location?.city,
        region: location?.region,
        country: location?.country,
        postalCode: location?.postalCode
      }
    });

    console.log("✅ Server responded:", response?.status, response?.data.data);

    if (response?.status === 200 || response?.status === 201) {
      const accessToken = response?.data.data.accessToken;
       const roleData = response?.data.data.role;
      if (accessToken) {
        console.log("🔐 Storing access token...");
        await setItemAsync("accessToken", accessToken); // Fixed to use SecureStore
      
         await setItemAsync("role", roleData); // Fixed to use SecureStore
         if(roleData === 'user'){
           router.replace("/(tabs)");
         }else{
           router.replace("/(tabs)/add-hotel");
         }
        
      } else {
        console.warn("⚠️ Access token missing in response."); 
        throw new Error("Access token missing in response");
      }
    } else {
      console.warn("⚠️ Unexpected status code:", response.status);
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error: unknown) {
    console.log("❌ Google Sign-In Error (full details)");

    if (error instanceof AxiosError) {
      // TypeScript now knows this is an AxiosError
      if (error.response) {
        console.log("🔴 Response error:");
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
        console.log("Headers:", error.response.headers);
      } else if (error.request) {
        console.log("🟡 No response from server (network error)");
        console.log("Request:", error.request);
      } else {
        console.log("🔵 Axios setup error:", error.message);
      }
      console.log("Config:", error.config);
    } else if (error instanceof Error) {
      console.log("🟣 Non-Axios Error:", error.message);
      console.log("Stack Trace:", error.stack);
    } else {
      console.log("⚫ Unknown error type:", typeof error);
      console.log("Error object:", error);
    }
    
    // Re-throw the error if you want calling code to handle it
    throw error;
  }
};

 if(!location || locationLoading) {
   return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#10ac84" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
 }

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
              style={[styles.signInButton, { flexDirection: "row", gap: 10 }]}
              onPress={signInoptons}
            >
              <ThemedText
                style={[
                  styles.signInButtonText,
                  { fontFamily: "ZillaSlabBold" },
                ]}
              >
                Continue With Google
              </ThemedText>
              <Image source={googleIcon} style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
                label="Seller"
                selected={selectedUserType === "vendor"}
                onPress={() => setSelectedUserType("vendor")}
              />
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleGoogleSignin}
            >
              <Text style={styles.continueButtonText}>
                Continue as {selectedUserType}
              </Text>
            </TouchableOpacity>
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
});
