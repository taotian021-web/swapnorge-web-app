export type ProductCategory = 'Food' | 'Household' | 'Electronics' | 'Garden' | 'Other' | 'Help' | 'Borrow' | 'Group Buy' | 'ForSale' | 'Activity';

export interface Seller {
  id: string;
  name: string;
  avatarUrl: string;
}

export type ProductStatus = 'open' | 'inprogress' | 'resolved';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Product {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl?: string;
  sellerId: string;
  postedDate: string; // ISO 8601 string
  isPublic?: boolean;
  storeName?: string; // Can be used for location name
  location?: GeoLocation;
  status?: ProductStatus;
  responses?: number;
  likes?: number;
  views?: number;
  urgency?: 'normal' | 'urgent';
  validUntil?: string; // For deals/news
}
