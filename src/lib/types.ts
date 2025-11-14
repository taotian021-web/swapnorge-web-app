export interface Seller {
  id: string;
  name: string;
  avatarUrl: string;
  trustScore: number; // 0-100
  ratings: number;
  location: string; // e.g., "Elm Street", "Oak Apartments"
  locationRank: number; // For proximity sorting, lower is closer
}

export interface Review {
  id: string;
  author: string;
  avatarUrl: string;
  rating: number; // 1-5
  comment: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Food' | 'Household' | 'Electronics' | 'Garden' | 'Other';
  imageUrl: string;
  imageHint: string;
  images: { url: string; hint: string; id: string }[];
  sellerId: string;
  reviews: Review[];
  priceComparisons: { store: string; price: number }[];
  postedDate: string;
}
