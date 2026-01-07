"use client"

import { useWishlistMutations } from "@/hooks/queries/useWishlist"
import { useGetuser } from "@/hooks/useGetuser"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, StyleSheet, TouchableOpacity } from "react-native"
import * as SecureStore from "expo-secure-store"


const AddToWishlist = ({
  isInWishlist,
  hotelID,
}: {
  isInWishlist: boolean
  hotelID: string
}) => {
  const [inWishlist, setInWishlist] = useState(isInWishlist)
  const { addToWishlist, removeFromWishlist } = useWishlistMutations()
  const { user } = useGetuser()

  // Update local state when prop changes
  useEffect(() => {
    setInWishlist(isInWishlist)
  }, [isInWishlist])

  const handleHeartPress = async () => {
    // Check if user is logged in
    const token = await SecureStore.getItemAsync("accessToken")
    if (!token || !user) {
      Alert.alert(
        "Login Required",
        "Please log in to save restaurants to your favorites.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Login", 
            onPress: () => router.push("/login")
          }
        ]
      )
      return
    }

    try {
      if (inWishlist) {
        // Optimistic update
        setInWishlist(false)

        await removeFromWishlist.mutateAsync(hotelID)
      } else {
        // Optimistic update
        setInWishlist(true)

        await addToWishlist.mutateAsync(hotelID)
      }
    } catch (error) {
      // Revert optimistic update on error
      setInWishlist(!inWishlist)

      Alert.alert("Error", `Failed to ${inWishlist ? "remove from" : "add to"} wishlist. Please try again.`)
    }
  }

  const isLoading = addToWishlist.isPending || removeFromWishlist.isPending

  return (
    <TouchableOpacity
      style={[styles.heartButton, isLoading && styles.heartButtonDisabled]}
      onPress={handleHeartPress}
      disabled={isLoading}
    >
      <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={20} color={inWishlist ? "#ff4757" : "#666"} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heartButtonDisabled: {
    opacity: 0.6,
  },
})

export default AddToWishlist
