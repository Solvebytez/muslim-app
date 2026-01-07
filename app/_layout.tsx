import { useColorScheme } from "@/hooks/useColorScheme";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import QueryProvider from "@/constants/QueryClientProvider";
import offlineCacheManager from "@/utils/offlineCacheManager";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    ZillaSlab: require("../assets/fonts/ZillaSlab-Regular.ttf"),
    ZillaSlabBold: require("../assets/fonts/ZillaSlab-Medium.ttf"),
    ZillaSlabItalic: require("../assets/fonts/ZillaSlab-Italic.ttf"),
    NatoSans: require("../assets/fonts/NotoSans-VariableFont_wdth-wght.ttf"),
  });

  // Pre-cache common locations in background
  useEffect(() => {
    const preCacheLocations = async () => {
      try {
        await offlineCacheManager.preCacheCommonLocations();
      } catch (error) {
        console.warn("Failed to pre-cache common locations:", error);
      }
    };

    preCacheLocations();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#10ac84",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontFamily: "NatoSans",
              fontWeight: "600",
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="test" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="offline-welcome"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="debug" options={{ headerShown: false }} />
          <Stack.Screen name="status" options={{ headerShown: false }} />
          <Stack.Screen name="wishlist" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen
            name="privacy-policy"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="resturent-by-cuisin"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryProvider>
  );
}
