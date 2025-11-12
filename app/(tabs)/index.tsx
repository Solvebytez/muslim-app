import { StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { useGetuser } from '@/hooks/useGetuser';
import Mapscreen from '@/screen/map/Mapsceeen';

export default function HomeScreen() {
  const {user} = useGetuser();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  // Redirect to login if not authenticated (map requires login)
  if (isAuthenticated === false) {
    return <Redirect href="/login" />;
  }

  // Show map if authenticated
  if (isAuthenticated && user) {
    return <Mapscreen/>;
  }

  // Show loading while checking
  return null;
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
