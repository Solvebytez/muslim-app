import axiosInstance from "@/constants/AxiosInstane"
import { useMutation, useQueryClient } from "@tanstack/react-query"

// Wishlist API functions
const addToWishlist = async (hotelID: string) => {
  const response = await axiosInstance.post("/add-to-wishlist", { restaurantId: hotelID })
  return response.data
}

const removeFromWishlist = async (hotelID: string) => {
  console.log("hotelID", hotelID)
  const response = await axiosInstance.post("/remove-from-wishlist", { restaurantId: hotelID })
  return response.data
}

// Custom hook for wishlist mutations
export const useWishlistMutations = () => {
  const queryClient = useQueryClient()
  const queryKey = "user-wishlist" // This should match the queryKey used in useGetWishlist

  const addToWishlistMutation = useMutation({
    mutationFn: addToWishlist,
    onMutate: async (hotelID: string) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] })
      const previousData = queryClient.getQueryData([queryKey])
      return { previousData, hotelID }
    },
    onError: (error, hotelID, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([queryKey], context.previousData)
      }
      console.error("Error adding to wishlist:", error)
    },
    onSettled: () => {
      // Invalidate both the main query and any infinite queries
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      queryClient.invalidateQueries({ queryKey: ['nearest-restaurants'] }) // For map screen
      queryClient.invalidateQueries({ queryKey: [queryKey, 'infinite'] }) // If you have separate infinite queries
    },
  })

  const removeFromWishlistMutation = useMutation({
    mutationFn: removeFromWishlist,
    onMutate: async (hotelID: string) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] })
      const previousData = queryClient.getQueryData([queryKey])
      return { previousData, hotelID }
    },
    onError: (error, hotelID, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([queryKey], context.previousData)
      }
      console.error("Error removing from wishlist:", error)
    },
    onSettled: () => {
      console.log("onSettled")
      // Invalidate both the main query and any infinite queries
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      queryClient.invalidateQueries({ queryKey: ['nearest-restaurants'] }) // For map screen
      queryClient.invalidateQueries({ queryKey: [queryKey, 'infinite'] }) // If you have separate infinite queries
    },
  })

  return {
    addToWishlist: addToWishlistMutation,
    removeFromWishlist: removeFromWishlistMutation,
  }
}