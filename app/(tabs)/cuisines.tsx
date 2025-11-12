import FilterCuisines from '@/screen/Cuisins/FilterCuisines'
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';

const Cuisines = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  // Redirect to login if not authenticated (cuisines requires login)
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated) {
    return <FilterCuisines />;
  }

  return null;
}

export default Cuisines