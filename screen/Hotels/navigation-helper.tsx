import { Alert, Linking, Platform } from "react-native"

export const openGoogleMaps = async (
  latitude: number,
  longitude: number,
  label?: string,
  placeId?: string
) => {
  //const destination = `${latitude},${longitude}`
   const destination = `${latitude},${longitude}`
   console.log("Destination coords:", destination,placeId)
  let url = ""

  console.log("=== Google Maps Debug Info ===")
  console.log("Platform:", Platform.OS)
  console.log("Latitude:", latitude)
  console.log("Longitude:", longitude)
  console.log("Label:", label)
  console.log("PlaceId:", placeId)
  console.log("Destination coords:", destination)

  if (Platform.OS === "ios") {
    // Try Google Maps app first, fallback to Apple Maps
    const googleMapsUrl = `comgooglemaps://?daddr=${destination}&directionsmode=driving`
    const appleMapsUrl = `http://maps.apple.com/?daddr=${destination}&dirflg=d`
    
    console.log("iOS Google Maps URL:", googleMapsUrl)
    console.log("iOS Apple Maps URL:", appleMapsUrl)
    
    try {
      const canOpen = await Linking.canOpenURL(googleMapsUrl)
      console.log("Can open Google Maps on iOS:", canOpen)
      url = canOpen ? googleMapsUrl : appleMapsUrl
    } catch {
      console.log("iOS fallback to Apple Maps")
      url = appleMapsUrl
    }
  } else {
    // Android - Use Google Maps Directions API URLs with fallbacks
    if (placeId) {
      // Try with place_id first, but include coordinates as backup
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
      console.log("Android Directions API with coordinates (place_id as backup):", url)
      console.log("Note: Using coordinates instead of place_id for better reliability")
    } else if (label) {
      // Use coordinates with label for better accuracy
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
      console.log("Android Directions API with coordinates and label:", url)
    } else {
      // Directions API with coordinates only
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
      console.log("Android Directions API with coordinates only:", url)
    }
  }

  console.log("=== FINAL URL TO OPEN ===")
  console.log(url)
  console.log("========================")

  try {
    const canOpenUrl = await Linking.canOpenURL(url)
    console.log("Can open final URL:", canOpenUrl)
    
    if (canOpenUrl) {
      console.log("Opening URL now...")
      await Linking.openURL(url)
      console.log("URL opened successfully")
    } else {
      console.log("Cannot open URL - not supported")
      Alert.alert("Error", "Could not open maps - URL not supported")
    }
  } catch (error) {
    console.log("Error opening URL:", error)
    Alert.alert("Error", "Could not open maps")
  }
}

// Usage example:
// openGoogleMaps(40.7128, -74.0060, "New York City")