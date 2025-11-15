export type ProductCategory = 'Food' | 'Household' | 'Electronics' | 'Garden' | 'Other';

export interface Seller {
  id: string;
  name: string;
  avatarUrl: string;
  trustScore: number; // 0-100
  ratings: number;
  location: string; // e.g., "Elm Street", "Oak Apartments"
  locationRank?: number; // For proximity sorting, lower is closer
}

export interface Review {
  id: string;
  author: string;
  avatarUrl: string;
  rating: number; // 1-5
  comment: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Product {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  imageHint: string;
  images: { url: string; hint: string; id: string }[];
  sellerId: string;
  reviews: Review[];
  priceComparisons: { store: string; price: number }[];
  postedDate: string;
  isPublic?: boolean;
  storeName?: string;
  location?: GeoLocation;
}
