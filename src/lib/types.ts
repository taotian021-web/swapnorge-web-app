export type ProductCategory = 'Food' | 'Household' | 'Electronics' | 'Garden' | 'Other' | 'Help' | 'Borrow' | 'Group Buy';

export interface Seller {
  id: string;
  name: string;
  avatarUrl: string;
  trustScore: number; // 0-100, now represents "热心值" or "Community Contribution"
  ratings: number;
  responseRate: number; // 0-100%
  positiveFeedbackRate: number; // 0-100%
  isAddressVerified: boolean;
  isSkillVerified: boolean;
  location: string; 
  locationRank?: number;
  timeBankHours: number; // For the "Time Bank" feature
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

export type ProductStatus = 'open' | 'inprogress' | 'resolved';

export interface Product {
  name: string;
  description: string;
  price: number; // Can be used for the small payment / reward
  category: ProductCategory;
  imageUrl: string;
  imageHint: string;
  images: { url: string; hint: string; id: string }[];
  sellerId: string;
  reviews: Review[];
  priceComparisons: { store: string; price: number }[];
  postedDate: string;
  isPublic?: boolean;
  storeName?: string; // Repurposed for "Expected Return Time" etc.
  location?: GeoLocation;
  status: ProductStatus;
  responses: number;
}
