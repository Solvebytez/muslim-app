import { useGetuser } from "@/hooks/useGetuser";
import {
  Entypo,
  FontAwesome,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function TabLayout() {
  const { user, isLoding, isOffline } = useGetuser();

  // Show loading spinner until we have user data from server
  if (isLoding || !user) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#10ac84",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Only proceed when we have actual user data from server
  const currentUser = user;

  // Debug logs removed for production

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "yellow",
        tabBarInactiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#10ac84",
          borderTopWidth: 0,
        },
      }}
    >
      {/* Map tab - hidden for vendors */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <Entypo name="map" size={24} color={color} />
          ),
          href: currentUser?.role === "vendor" ? null : "/",
        }}
      />

      {/* Cuisines tab - hidden for vendors */}
      <Tabs.Screen
        name="cuisines"
        options={{
          title: "Cuisines",
          tabBarIcon: ({ color }) => (
            <Entypo name="ticket" size={24} color={color} />
          ),
          href: currentUser?.role === "vendor" ? null : "/cuisines",
        }}
      />

      {/* Add Hotel tab - only visible for vendors */}
      <Tabs.Screen
        name="add-hotel"
        options={{
          title: "Add Hotel",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="add-home" size={22} color={color} />
          ),
          href: currentUser?.role === "vendor" ? "/add-hotel" : null,
        }}
      />

      {/* My Hotel tab - only visible for vendors */}
      <Tabs.Screen
        name="my-hotel"
        options={{
          title: "My Hotel",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="hotel" size={22} color={color} />
          ),
          href: currentUser?.role === "vendor" ? "/my-hotel" : null,
        }}
      />

      {/* Prayer tab - visible for all users */}
      <Tabs.Screen
        name="prayer"
        options={{
          title: "Prayer",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="pray" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="heart-o" size={24} color={color} />
          ),
          href: currentUser?.role === "user" ? "/favorites" : null,
        }}
      />

      {/* Profile tab - visible for all users */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
