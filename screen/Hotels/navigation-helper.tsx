import { Alert, Linking, Platform } from "react-native"

export const openGoogleMaps = async (latitude: number, longitude: number, label?: string, placeId?: string) => {
  const destination = `${latitude},${longitude}`

  console.log("=== Google Maps Debug Info ===")
  console.log("Platform:", Platform.OS)
  console.log("Latitude:", latitude)
  console.log("Longitude:", longitude)
  console.log("Label:", label)
  console.log("PlaceId:", placeId)
  console.log("Destination coords:", destination)

  let url = ""

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
    // Android - Multiple fallback strategies
    const urls = [
      // Try Google Maps app intent first
      `google.navigation:q=${destination}&mode=d`,
      // Try geo intent
      `geo:${destination}?q=${destination}`,
      // Try Google Maps app with coordinates
      `https://maps.google.com/?daddr=${destination}`,
      // Fallback to web version
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
    ]

    console.log("Trying Android URLs in order:")
    urls.forEach((testUrl, index) => {
      console.log(`${index + 1}. ${testUrl}`)
    })

    // Try each URL until one works
    for (let i = 0; i < urls.length; i++) {
      try {
        const testUrl = urls[i]
        console.log(`Testing URL ${i + 1}: ${testUrl}`)

        // For geo: and google.navigation: schemes, skip canOpenURL check
        if (testUrl.startsWith("geo:") || testUrl.startsWith("google.navigation:")) {
          url = testUrl
          console.log(`Using URL ${i + 1} (skipping canOpenURL check)`)
          break
        }

        const canOpen = await Linking.canOpenURL(testUrl)
        console.log(`Can open URL ${i + 1}:`, canOpen)

        if (canOpen) {
          url = testUrl
          console.log(`Selected URL ${i + 1}`)
          break
        }
      } catch (error) {
        console.log(`Error testing URL ${i + 1}:`, error)
        continue
      }
    }

    // If no URL worked, use the most reliable fallback
    if (!url) {
      url = `geo:${destination}?q=${destination}`
      console.log("Using geo: fallback URL")
    }
  }

  console.log("=== FINAL URL TO OPEN ===")
  console.log(url)
  console.log("========================")

  try {
    console.log("Opening URL now...")
    await Linking.openURL(url)
    console.log("URL opened successfully")
  } catch (error) {
    console.log("Error opening URL:", error)

    // Final fallback - try opening in browser
    const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    console.log("Trying browser fallback:", browserUrl)

    try {
      await Linking.openURL(browserUrl)
      console.log("Browser fallback successful")
    } catch (browserError) {
      console.log("Browser fallback failed:", browserError)
      Alert.alert("Error", "Could not open maps. Please install Google Maps or use a web browser.")
    }
  }
}

// Alternative simplified version that bypasses canOpenURL issues
export const openGoogleMapsSimple = async (latitude: number, longitude: number, label?: string) => {
  const destination = `${latitude},${longitude}`

  let url = ""

  if (Platform.OS === "ios") {
    // Try Google Maps first, then Apple Maps
    url = `comgooglemaps://?daddr=${destination}&directionsmode=driving`

    try {
      await Linking.openURL(url)
      return
    } catch {
      // Fallback to Apple Maps
      url = `http://maps.apple.com/?daddr=${destination}&dirflg=d`
    }
  } else {
    // Android - Use geo: scheme which is most reliable
    url = `geo:${destination}?q=${destination}`
  }

  try {
    await Linking.openURL(url)
  } catch (error) {
    // Final web fallback
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
    try {
      await Linking.openURL(webUrl)
    } catch {
      Alert.alert("Error", "Could not open maps")
    }
  }
}

// Usage examples:
// openGoogleMaps(22.6831705, 88.82492119999999, "MRMF+7WX, Gobindapur Dhokra, West Bengal 743428, India")
// openGoogleMapsSimple(22.6831705, 88.82492119999999, "Location Name")
