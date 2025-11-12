import { ThemedText } from "@/components/ThemedText";
import axiosInstance, { clearAllUserData } from "@/constants/AxiosInstane";
import { useGetuser } from "@/hooks/useGetuser";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const defultProfile = require("@/assets/images/defultProfile.png");

const ProfileScreen = React.memo(() => {
  const { user } = useGetuser();
  const [userData, setuserData] = useState<Record<string, string> | null>({});
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);

  const configureGoogleSignin = () => {
    if (Platform.OS === "android") {
      GoogleSignin.configure({
        webClientId:
          "587652399701-3lhoo7eb0d5917ctn4vamusqgorl2748.apps.googleusercontent.com",
        offlineAccess: true,
      });
    }
  };

  const handleLogoutUser = async () => {
    try {
      const res = await axiosInstance.post("/logout");

      if (res.status === 200) {
        // Clear all user data using comprehensive logout function
        await clearAllUserData();

        // Navigate to login screen
        router.replace("/login");
      } else {
        Alert.alert("Logout failed", "Please try again.");
      }
    } catch (error) {
      console.error("Logout Error:", error);
      // Even if server logout fails, clear local data
      await clearAllUserData();
      router.replace("/login");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone. All your data, including restaurants (if you're a vendor), will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account and all associated data. Are you absolutely sure?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const res = await axiosInstance.delete("/delete-account");

                      if (res.status === 200) {
                        // Clear all user data
                        await clearAllUserData();

                        Alert.alert(
                          "Account Deleted",
                          "Your account has been successfully deleted.",
                          [
                            {
                              text: "OK",
                              onPress: () => router.replace("/login"),
                            },
                          ]
                        );
                      } else {
                        Alert.alert(
                          "Deletion Failed",
                          "Unable to delete account. Please try again."
                        );
                      }
                    } catch (error: any) {
                      console.error("Delete Account Error:", error);
                      let errorMessage =
                        "Unable to delete account. Please try again.";

                      if (error?.response?.data?.message) {
                        errorMessage = error.response.data.message;
                      }

                      Alert.alert("Deletion Failed", errorMessage);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = async () => {
    const privacyUrl = "https://muslimcompass.io/pages/privacy.html";

    try {
      const canOpen = await Linking.canOpenURL(privacyUrl);
      if (canOpen) {
        await Linking.openURL(privacyUrl);
      } else {
        Alert.alert(
          "Error",
          "Cannot open the privacy policy link. Please check your internet connection."
        );
      }
    } catch (error) {
      console.error("Error opening privacy policy:", error);
      Alert.alert("Error", "Failed to open privacy policy. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      // Use user data from hook if available, otherwise fallback to SecureStore
      if (user && typeof user === "object" && "name" in user) {
        const avatar = await SecureStore.getItemAsync("avatar");
        
        // Validate avatar: must be a non-empty string that looks like a URL
        let validAvatar: string | null = null;
        if (avatar) {
          // Convert to string if it's a number (from backend ObjectId)
          const avatarStr = typeof avatar === 'string' ? avatar : String(avatar || '');
          // Only use if it's a valid URL string
          if (avatarStr && avatarStr.trim() && (avatarStr.startsWith('http://') || avatarStr.startsWith('https://'))) {
            validAvatar = avatarStr;
          }
        }
        setuserData({
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          avatar: validAvatar || "",
        });
      } else {
        // Fallback to SecureStore data
        const avatar = await SecureStore.getItemAsync("avatar");
        const name = await SecureStore.getItemAsync("name");
        const email = await SecureStore.getItemAsync("email");
        const role = await SecureStore.getItemAsync("role");
        
        // Validate avatar: must be a non-empty string that looks like a URL
        let validAvatar: string | null = null;
        if (avatar) {
          // Convert to string if it's a number (from backend ObjectId)
          const avatarStr = typeof avatar === 'string' ? avatar : String(avatar || '');
          // Only use if it's a valid URL string
          if (avatarStr && avatarStr.trim() && (avatarStr.startsWith('http://') || avatarStr.startsWith('https://'))) {
            validAvatar = avatarStr;
          }
        }
        setuserData({
          name: name || "",
          email: email || "",
          role: role || "",
          avatar: validAvatar || "",
        });
      }
    };
    fetchUserData();
  }, [user]);

  const baseMenuItems = [
    {
      section: "Options",
      items: [],
    },
    {
      section: "Account",
      items: [
        {
          icon: (
            <Entypo
              name="help-with-circle"
              size={20}
              color="#666"
              style={styles.menuIcon}
            />
          ),
          title: "Help & Support",
          onPress: () => router.push("/help"),
        },
        {
          icon: (
            <FontAwesome5
              name="users-cog"
              size={20}
              color="#666"
              style={styles.menuIcon}
            />
          ),
          title: "Privacy policy",
          onPress: handlePrivacyPolicy,
        },
        {
          icon: (
            <AntDesign
              name="logout"
              size={20}
              color="#666"
              style={styles.menuIcon}
            />
          ),
          title: "Logout",
          onPress: handleLogoutUser,
        },
        {
          icon: (
            <Ionicons
              name="trash-outline"
              size={20}
              color="#FF3B30"
              style={styles.menuIcon}
            />
          ),
          title: "Delete Account",
          onPress: handleDeleteAccount,
          isDestructive: true,
        },
      ],
    },
  ];

  // Now populate the Options section based on role
  if (userData?.role === "vendor") {
    baseMenuItems[0].items.push(
      {
        icon: (
          <Entypo
            name="add-to-list"
            size={20}
            color="#666"
            style={styles.menuIcon}
          />
        ),
        title: "Add Hotel",
        onPress: () => router.push("/add-hotel"),
      },
      {
        icon: (
          <Feather
            name="activity"
            size={20}
            color="#666"
            style={styles.menuIcon}
          />
        ),
        title: "Resturent Status",
        onPress: () => router.push("/status"),
      }
    );
  } else {
    baseMenuItems[0].items.push({
      icon: (
        <AntDesign
          name="heart"
          size={20}
          color="#666"
          style={styles.menuIcon}
        />
      ),
      title: "Wishlist",
      onPress: () => router.push("/wishlist"),
    });
  }

  const menuItems = baseMenuItems;

  const MenuItem = ({
    icon,
    title,
    onPress,
    isDestructive,
  }: {
    icon: any;
    title: string;
    onPress: () => void;
    isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        isDestructive && { borderLeftColor: "#FF3B30" },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text
          style={[styles.menuText, isDestructive && { color: "#FF3B30" }]}
        >
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: '#000' }]}>
        {/* Abstract shapes */}
        <View style={styles.orangeCircle} />
        <View style={styles.yellowCircle} />
        <View style={styles.greenOval} />

        {/* Notification bell */}
        {/* <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity> */}

        {/* Profile section */}
        <View style={styles.profileSection}>
          <Image
            source={
              userData?.avatar && 
              typeof userData.avatar === 'string' && 
              userData.avatar.trim() !== '' &&
              (userData.avatar.startsWith('http://') || userData.avatar.startsWith('https://'))
                ? { uri: userData.avatar } 
                : defultProfile
            }
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.name}</Text>
            <Text
              style={[
                styles.profileType,
                {
                  textTransform: "capitalize",
                },
              ]}
            >
              {userData?.role} Account
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {section.section}
            </ThemedText>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => {
                return (
                  <MenuItem
                    key={itemIndex}
                    icon={item.icon}
                    title={item.title}
                    onPress={item.onPress}
                    isDestructive={item.isDestructive}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
});

ProfileScreen.displayName = "ProfileScreen";

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10ac84",
  },
  header: {
    backgroundColor: "#000",  // reverted from #10ac84
    paddingHorizontal: 20,
    paddingVertical: 40,
    position: "relative",
    overflow: "hidden",
  },
  orangeCircle: {
    position: "absolute",
    top: -30,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ff6b35",
  },
  yellowCircle: {
    position: "absolute",
    top: 10,
    left: 130,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ffd23f",
    backgroundColor: "transparent",
  },
  greenOval: {
    position: "absolute",
    top: 10,
    right: 20,
    width: 100,
    height: 60,
    borderRadius: 50,
    backgroundColor: "#4a7c59",
    transform: [{ rotate: "15deg" }],
  },
  notificationButton: {
    position: "absolute",
    top: 30,
    right: 20,
    zIndex: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    zIndex: 5,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileType: {
    color: "#ccc",
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginHorizontal: 20,
  },
  menuContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 10,
    width: 30,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
});
