"use client";

import axiosInstance from "@/constants/AxiosInstane";
import NetInfo from "@react-native-community/netinfo";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

// Define the UserType interface
interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  // Add other properties as needed
}

// Load user data from SecureStore (offline-first)
const loadCachedUserData = async (): Promise<UserType | null> => {
  try {
    const name = await SecureStore.getItemAsync("name");
    const email = await SecureStore.getItemAsync("email");
    const role = await SecureStore.getItemAsync("role");
    const accessToken = await SecureStore.getItemAsync("accessToken");

    if (accessToken && name && email && role) {
      return {
        id: "cached-user",
        name: name,
        email: email,
        role: role,
      };
    }
    return null;
  } catch {
    return null;
  }
};

// Fetch user data from server (online)
const fetchUserDataFromServer = async (): Promise<UserType | null> => {
  try {
    const response = await axiosInstance.get("/get-user");

    if (response.status === 200) {
      const userData = response.data.data;

      // Store user data in SecureStore for offline access - use server role as source of truth
      await SecureStore.setItemAsync("name", userData.name?.trim() || "");
      await SecureStore.setItemAsync("email", userData.email || "");
      await SecureStore.setItemAsync("role", userData.role);

      // Return user data with server role (source of truth)
      return userData;
    }

    if (response.status === 401) {
      return null;
    }

    return null;
  } catch {
    return null;
  }
};

// Optimized user fetching function (offline-first)
const fetchUserData = async (): Promise<UserType | null> => {
  try {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected ?? false;

    if (isOnline) {
      // Always try to fetch from server first when online
      const serverData = await fetchUserDataFromServer();
      if (serverData) {
        return serverData;
      }
    }

    // Fallback to cached data (works offline)
    const cachedData = await loadCachedUserData();
    if (cachedData) {
      return cachedData;
    }
    return null;
  } catch {
    // Final fallback to cached data
    return await loadCachedUserData();
  }
};

export const useGetuser = () => {
  const [isOffline, setIsOffline] = useState(false);

  const {
    data: user,
    isLoading: isLoding,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUserData,
    // User data is relatively stable, cache for longer
    staleTime: 5 * 60 * 1000, // 5 minutes - reduced for faster updates
    gcTime: 10 * 60 * 1000, // 10 minutes - reduced for faster updates
    // Always refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Refetch on window focus to catch login changes
    refetchOnWindowFocus: true,
    // Retry once on failure
    retry: 1,
    retryDelay: 1000,
    // Override global network mode to allow offline queries
    networkMode: "always",
  });

  // Check network status on mount
  useEffect(() => {
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected ?? false;
      setIsOffline(!isOnline);
    };

    checkNetworkStatus();
  }, []);

  // Optimized refetch function
  const refetchUser = useCallback(() => {
    refetch();
  }, [refetch]);

  // Debug logs removed for production

  return {
    user: user || null,
    isLoding: isLoding && !isOffline, // Don't show loading when offline
    refetch: refetchUser,
    isOffline,
  };
};
