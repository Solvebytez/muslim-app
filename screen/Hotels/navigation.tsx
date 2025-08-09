import { Ionicons } from "@expo/vector-icons"
import type React from "react"
import { StyleSheet, Text, TouchableOpacity } from "react-native"
import { openGoogleMaps } from "./navigation-helper"

interface NavigationButtonProps {
  latitude: number
  longitude: number
  label?: string
  placeId: string
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({ latitude, longitude, label, placeId }) => {

  console.log("Navigating to----------------:", {  longitude,latitude, label, placeId })
  const handleNavigatePress = () => {
    openGoogleMaps(longitude,latitude,  label, placeId)
  }

  return (
    <TouchableOpacity style={styles.navigateButton} onPress={handleNavigatePress}>
      <Text style={styles.navigateText}>Navigate</Text>
      <Ionicons name="arrow-forward" size={14} color="#10ac84" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
   
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  navigateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
})
