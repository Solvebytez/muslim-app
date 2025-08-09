 
import useDateTimeLocation from '@/hooks/prayerHooks/useCurrentuserlocateion';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const GeoDateTime = () => {
  const { date, time, location, isLoading, error, refreshLocation } = useDateTimeLocation();
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermission();
  }, []);

  // Only attempt to refresh if we have permission
  useEffect(() => {
    if (permissionStatus === Location.PermissionStatus.GRANTED && !location && !isLoading) {
      refreshLocation();
    }
  }, [location, isLoading, permissionStatus, refreshLocation]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Date & Location</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Date:</Text>
        <Text>{date || '--'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time:</Text>
        <Text>{time || '--'}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" style={styles.loader} />
      ) : permissionStatus === Location.PermissionStatus.DENIED ? (
        <Text style={styles.permissionText}>
          Location permission denied. Please enable in settings. Settings {">"} App{">"} Permissions and enable location manually
        </Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : location ? (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Latitude:</Text>
            <Text>{location.latitude.toFixed(4)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Longitude:</Text>
            <Text>{location.longitude.toFixed(4)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Longitude:</Text>
            <Text>{location.city + ', ' + location.region +', ' + location.country}</Text>
          </View>
        </>
      ) : (
        <Text>Location not available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  section: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
    width: 80,
  },
  loader: {
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 8,
  },
  permissionText: {
    color: 'orange',
    marginTop: 8,
  },
});

export default GeoDateTime;