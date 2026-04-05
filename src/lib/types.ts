
export type ItemCategory = 
  | 'Elektronikk' 
  | 'Klær' 
  | 'Hjem' 
  | 'Bøker' 
  | 'Sport' 
  | 'Annet'
  | 'Gave'
  | 'Kupong'
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
  uid: string;
  displayName: string;
  photoURL: string;
  stats: UserStats;
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
