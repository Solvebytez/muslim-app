import WishlistScreen from "@/screen/WishlistScreen";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";

const Favorites = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  // Redirect to login if not authenticated (favorites requires login)
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated) {
    return <WishlistScreen title="Favorites" />;
  }

  return null;
};

export default Favorites;
