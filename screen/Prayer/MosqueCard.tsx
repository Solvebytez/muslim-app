import { width } from "@/constants/GblobalVar";
import { getNearestMosques, MosqueResult, NearestMosqueProps } from "@/utils/nearestMosque";


import React, { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MosqueCard = ({ lat, lng }: NearestMosqueProps) => {
  const [mosques, setMosques] = useState<MosqueResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getNearestMosques({ lat, lng, setLoading }).then(setMosques);
  }, [lat, lng]);

  const handleGetDirections = (mosque: MosqueResult) => {
    const destLat = mosque.coordinates.lat;
    const destLng = mosque.coordinates.lng;
    const label = encodeURIComponent(mosque.name);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving&dir_action=navigate`;

    Linking.openURL(url).catch((err) => {
      console.error("Failed to open Google Maps:", err);
    });
  };

  console.log(lat,lng)

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Nearby Mosques</Text>
          {/* <Text style={styles.title}>{lat},{lng}</Text> */}
      <View style={styles.card}>
      

        {loading ? (
          <Text>Loading...</Text>
        ) : mosques.length > 0 ? (
          <>
            {mosques.map((mosque, index) => (
              <View key={`${mosque.name}-${index}`} style={styles.mosqueContainer}>
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Text style={styles.iconText}>📍</Text>
                  </View>
                  <Text style={styles.locationName}>{mosque.name}</Text>
                </View>
                <View style={styles.distanceRow}>
                  <View style={styles.distanceIcon}>
                    <Text style={styles.iconText}>🧭</Text>
                  </View>
                  <Text style={styles.distanceText}>Distance: {mosque.distance}</Text>
                </View>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => handleGetDirections(mosque)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Get Directions</Text>
                </TouchableOpacity>
                {index < mosques.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.locationName}>No mosques found nearby.</Text>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: width,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // For Android shadow
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#059669", // Green color matching the original
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  locationIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  distanceIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  locationName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  directionsButton: {
    backgroundColor: "#10ac84",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
   mosqueContainer: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
});

export default MosqueCard;
