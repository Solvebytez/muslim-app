"use client"

import { GOOGLE_PLACES_API_KEY } from "@/constants/GblobalVar"
import { fetchPlaceDetails } from "@/utils/fetchPlaceDetails"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

const { height: screenHeight } = Dimensions.get("window")

// You'll need to replace this with your actual Google Places API key


export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface HotelDetails {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  url: string
  address_components: {
    long_name: string
    short_name: string
    types: string[]
  }[]
  country?: string
  googleMapsUrl: string
}

interface HotelSearchInputProps {
  onHotelSelect?: (hotel: HotelDetails|null) => void
  placeholder?: string
  style?: any
  editable: boolean
}

export default function HotelSearchInput({
  onHotelSelect,
  placeholder = "Search for hotels...",
  style,
  editable
}: HotelSearchInputProps) {
  const [searchText, setSearchText] = useState("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [inputPosition, setInputPosition] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout|any>(null)
  const inputRef = useRef<View>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
   

  const searchPlaces = async (input: string) => {
    if (input.length < 2) {
      setPredictions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input,
        )}&types=restaurant&key=${GOOGLE_PLACES_API_KEY}`,
      )

      const data = await response.json()

      if (data.status === "OK") {
        setPredictions(data.predictions || [])
        setShowSuggestions(true)
      } else {
        console.error("Google Places API error:", data.status)
        setPredictions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Error fetching places:", error)
      setPredictions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextChange = (text: string) => {
    setSearchText(text)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      searchPlaces(text)
    }, 300)
  }

  const handlePlaceSelect = async (place: PlacePrediction) => {
    setSearchText(place.structured_formatting.main_text)
    setShowSuggestions(false)
    setPredictions([])
    setIsLoadingDetails(true)
    Keyboard.dismiss()

    try {
      const hotelDetails = await fetchPlaceDetails(place.place_id)
      if (hotelDetails && onHotelSelect) {
        onHotelSelect(hotelDetails)
      }
    } catch (error) {
      console.error("Error getting hotel details:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const clearSearch = () => {
    setSearchText("")
    setPredictions([])
    onHotelSelect && onHotelSelect(null)
    setShowSuggestions(false)
  }

  const handleInputFocus = () => {
    // Measure input position when focused
    if (inputRef.current) {
      inputRef.current.measureInWindow((x, y, width, height) => {
        setInputPosition(y + height)
      })
    }

    if (predictions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false)
    }, 150)
  }

  // Calculate available space for suggestions
  const getMaxSuggestionsHeight = () => {
    const availableSpace = screenHeight - inputPosition - keyboardHeight - 20 // 20px padding
    return Math.min(340, Math.max(100, availableSpace))
  }

  const renderPrediction = (item: PlacePrediction, index: number) => (
    <TouchableOpacity
      key={item.place_id}
      style={[styles.predictionItem, index === predictions.length - 1 && styles.lastPredictionItem]}
      onPress={() => handlePlaceSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.predictionIcon}>
        <Ionicons name="business-outline" size={20} color="#666" />
      </View>
      <View style={styles.predictionText}>
        <Text style={styles.predictionMainText} numberOfLines={1}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondaryText} numberOfLines={1}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  )

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0)
    })

    return () => {
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <View style={[styles.container, style]}>
      <View ref={inputRef} style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
    
style={[styles.searchInput,{
   opacity: !editable ? 0.5 : 1, // visually indicate disabled state
}]}
  placeholder={placeholder}
  placeholderTextColor="#999"
  value={searchText}
  onChangeText={handleTextChange}
  onFocus={() => {
    if (predictions.length > 0) setShowSuggestions(true);
  }}
  returnKeyType="search"
  autoCorrect={false}
  autoCapitalize="words"
  numberOfLines={1}       // Restrict to 1 line visually
  multiline={false}      // Prevent multi-line input
  scrollEnabled={true}   // Allow horizontal scrolling
   editable={!isLoadingDetails || !editable}
        />
        {(isLoading || isLoadingDetails) && (
          <ActivityIndicator size="small" color="#1e88e5" style={styles.loadingIndicator} />
        )}
        {searchText.length > 0 && !isLoading && !isLoadingDetails && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && predictions.length > 0 && !isLoadingDetails && (
        <View style={[styles.suggestionsContainer, { maxHeight: getMaxSuggestionsHeight() }]}>
          <ScrollView
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {predictions.map((item, index) => renderPrediction(item, index))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    height:50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
  flex: 1,
  fontSize: 14,
  color: "#333",
  padding: 0,
  margin: 0, 
  textAlignVertical: 'center',  
  includeFontPadding: false, 
  paddingVertical: 0,     
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lastPredictionItem: {
    borderBottomWidth: 0,
  },
  predictionIcon: {
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: "#666",
  },
})
