
import axiosInstance from "@/constants/AxiosInstane"
import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"

// --- Types
export interface Restaurant {
  _id: string
  name: string
  description: string
  cuisine: string
  location: string
  rating: number
  image: {
    _id: string
    url: string
    alt?: string
  }
  createdAt: string
  updatedAt: string
}

export interface WishlistResponse {
  restaurants: Restaurant[]
  count: number
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface UseGetWishlistParams {
  endpoint: string
  queryKey: string
  pageSize?: number
  enabled?: boolean
}

// --- API function
async function fetchWishlist(
  endpoint: string,
  page = 1,
  pageSize = 4
): Promise<WishlistResponse> {
  try {
   console.log("fetchWishlist--------------", endpoint, pageSize, page)
    const response = await axiosInstance.post<ApiResponse<WishlistResponse>>(endpoint, {
      page,
      pageSize,
    })
    
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch wishlist")
    }

    return response.data.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errMessage = (error.response?.data as any)?.message || error.message || "Network error"
      throw new Error(errMessage)
    }
    throw error
  }
}

// --- useInfiniteQuery hook
export function useGetWishlist({ endpoint, queryKey, pageSize = 4, enabled = true }: UseGetWishlistParams) {

  return useInfiniteQuery({
    queryKey: [queryKey, pageSize],
    queryFn: ({ pageParam = 1 }) => fetchWishlist(endpoint, pageParam, pageSize),
    getNextPageParam: (lastPage: WishlistResponse) => {
        console.log("lastPage,useGetWishlist",lastPage)
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined
    },
  initialPageParam: 1,
    enabled,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 2,
  })
}