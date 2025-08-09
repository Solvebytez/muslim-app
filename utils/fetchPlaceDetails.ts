import { GOOGLE_PLACES_API_KEY } from "@/constants/GblobalVar";
import { HotelDetails } from "@/screen/Addhotel/HotelSearchInput";


export const fetchPlaceDetails = async (placeId: string): Promise<HotelDetails | null> => {
    try {
      const fields = ["place_id", "name", "formatted_address", "rating", "geometry", "url", "address_components"].join(
        ",",
      )

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_API_KEY}`,
      )

      const data = await response.json()

      if (data.status === "OK" && data.result) {
        const result = data.result

        // Extract country from address components
        const countryComponent = result.address_components?.find((component: any) =>
          component.types.includes("country"),
        )

        // Generate Google Maps URL
        const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`

        const hotelDetails: HotelDetails = {
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address,
          rating: result.rating,
          geometry: result.geometry,
          url: result.url,
          address_components: result.address_components || [],
          country: countryComponent?.long_name || "Unknown",
          googleMapsUrl,
        }

        return hotelDetails
      } else {
        console.error("Place details API error:", data.status)
        return null
      }
    } catch (error) {
      console.error("Error fetching place details:", error)
      return null
    }
  }


