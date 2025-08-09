import useDateTimeLocation from "@/hooks/prayerHooks/useCurrentuserlocateion";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";

export default function useIndex() {
  const [loggedInUser, setloggedInUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const { isLoading: locationLoading } = useDateTimeLocation();

  useEffect(() => {
    const subscription = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      const role = await SecureStore.getItemAsync("role");

      setUserRole(role);
      setloggedInUser(!!token);
      setLoading(false);
    };

    subscription();
  }, []);

  // Wait until both auth and location are ready
  if (loading || locationLoading) {
    return null;
  }

  console.log("📡 userRole", userRole);

  // Redirect logic
  let redirectPath: "/login" | "/(tabs)/add-hotel" | "/(tabs)" = "/login";
  if (loggedInUser) {
    redirectPath = userRole === "vendor" ? "/(tabs)/add-hotel" : "/(tabs)";
  }

  return <Redirect href={redirectPath} />;
}
