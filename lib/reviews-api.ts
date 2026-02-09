import apiClient from './api-client';

// Types based on the Hospitable API response structure
export interface DetailedRating {
  type: 'value' | 'cleanliness' | 'communication' | 'location' | 'checkin' | 'accuracy' | 'facilities' | 'staff' | 'services';
  rating: number;
  comment: string | null;
}

export interface HospitableReview {
  id: string;
  platform: string;
  public: {
    rating: number;
    rating_platform_original: string;
    review: string;
    response: string | null;
  };
  private: {
    feedback: string | null;
    detailed_ratings: DetailedRating[];
  };
  reviewed_at: string;
  responded_at: string | null;
  can_respond: boolean;
  guest?: {
    first_name: string;
    last_name?: string;
    language: string;
  };
}

export interface ReviewsResponse {
  data: HospitableReview[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface Property {
  id: string;
  hospitablePropertyId: string | null;
  name: string;
  totalReviews?: number;
  averageRating?: number;
}

export interface ReviewsByRating {
  5: HospitableReview[];
  4: HospitableReview[];
  3: HospitableReview[];
  2: HospitableReview[];
  1: HospitableReview[];
}

export const reviewsApi = {
  /**
   * Get all properties that have Hospitable integration
   */
  async getProperties(): Promise<Property[]> {
    const response = await apiClient.get('/reviews/properties');
    return response.data.properties;
  },

  /**
   * Get reviews for a specific property using hospitablePropertyId
   */
  async getPropertyReviews(
    hospitablePropertyId: string,
    page: number = 1,
    perPage: number = 50
  ): Promise<ReviewsResponse> {
    const response = await apiClient.get(`/reviews/property/${hospitablePropertyId}`, {
      params: {
        page,
        per_page: perPage,
      },
    });
    return response.data;
  },

  /**
   * Get all reviews for a property (handles pagination automatically)
   */
  async getAllPropertyReviews(hospitablePropertyId: string): Promise<HospitableReview[]> {
    const allReviews: HospitableReview[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getPropertyReviews(hospitablePropertyId, currentPage, 50);
      allReviews.push(...response.data);
      
      hasMore = response.meta.current_page < response.meta.last_page;
      currentPage++;
    }

    return allReviews;
  },

  /**
   * Group reviews by rating (1-5 stars)
   */
  groupReviewsByRating(reviews: HospitableReview[]): ReviewsByRating {
    const grouped: ReviewsByRating = {
      5: [],
      4: [],
      3: [],
      2: [],
      1: [],
    };

    reviews.forEach(review => {
      const rating = Math.floor(review.public.rating) as keyof ReviewsByRating;
      if (rating >= 1 && rating <= 5) {
        grouped[rating].push(review);
      }
    });

    return grouped;
  },

  /**
   * Calculate average rating from reviews
   */
  calculateAverageRating(reviews: HospitableReview[]): number {
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((acc, review) => acc + review.public.rating, 0);
    return Math.round((sum / reviews.length) * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Get rating distribution for charts/stats
   */
  getRatingDistribution(reviews: HospitableReview[]): Record<number, number> {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      const rating = Math.floor(review.public.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  },
};
