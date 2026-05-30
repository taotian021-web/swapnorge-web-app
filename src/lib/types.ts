
export type ItemCategory = 
  | 'Elektronikk' 
  | 'Klær' 
  | 'Hjem' 
  | 'Bøker' 
  | 'Sport' 
  | 'Annet'
  | 'Gave'
  | 'Kupong'
  | 'Help'
  | 'Borrow'
  | 'Group Buy'
  | 'Activity'
  | 'ForSale'
  | 'FreshNews'
  | 'Food'
  | 'Household'
  | 'Electronics'
  | 'Garden'
  | string;

export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'disputed';

export type ItemCondition = 'new' | 'likeNew' | 'good' | 'fair';

export interface UserStats {
  points: number;
  reputation: number;
  completedSwaps: number;
  memberSince: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  display_name: string;
  photo_url?: string | null;
  stats?: UserStats;
  // Legacy/alias fields for compatibility
  displayName?: string;
  photoURL?: string | null;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
}

export interface SwapItem {
  id: string;
  title: string;
  description: string;
  points: number;
  category: ItemCategory;
  condition?: ItemCondition;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  postedDate: string;
  isPublic: boolean;
  location: GeoLocation;
  status: 'available' | 'reserved' | 'swapped';
  views: number;
  likes: number;
}

export interface SwapRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImageUrl?: string;
  message?: string;
  points: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string; // Added to ensure clarity during scan
  status: SwapStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  requestId: string;
  content: string;
  rating: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName?: string;
  sellerRating?: number;
  postedDate: string;
  isPublic: boolean;
  location?: GeoLocation;
  urgency: 'normal' | 'urgent';
  status: 'open' | 'closed';
  responses: number;
  likes: number;
  views: number;
  createdAt: string;
  userId: string;
  storeName?: string;
  validUntil?: string;
}
