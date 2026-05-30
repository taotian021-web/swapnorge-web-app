export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      favorites: {
        Row: {
          id: string;
          userId: string;
          itemId: string;
          savedAt: string;
        };
        Insert: {
          userId: string;
          itemId: string;
          savedAt?: string;
        };
        Update: {
          userId?: string;
          itemId?: string;
          savedAt?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          uid: string;
          displayName: string;
          photoURL?: string;
          stats: {
            points: number;
            reputation: number;
            completedSwaps: number;
            memberSince: string;
          };
        };
        Insert: {
          id?: string;
          uid: string;
          displayName: string;
          photoURL?: string;
          stats: {
            points: number;
            reputation: number;
            completedSwaps: number;
            memberSince: string;
          };
        };
        Update: {
          id?: string;
          uid?: string;
          displayName?: string;
          photoURL?: string;
          stats?: {
            points?: number;
            reputation?: number;
            completedSwaps?: number;
            memberSince?: string;
          };
        };
      };
      items: {
        Row: {
          id: string;
          title: string;
          description: string;
          points: number;
          category: string;
          condition?: string;
          imageUrl?: string;
          sellerId: string;
          sellerName: string;
          sellerRating: number;
          postedDate: string;
          isPublic: boolean;
          location?: {
            latitude: number;
            longitude: number;
            city?: string;
          };
          status: string;
          views: number;
          likes: number;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          points: number;
          category: string;
          condition?: string;
          imageUrl?: string;
          sellerId: string;
          sellerName: string;
          sellerRating: number;
          postedDate: string;
          isPublic: boolean;
          location?: {
            latitude: number;
            longitude: number;
            city?: string;
          };
          status: string;
          views?: number;
          likes?: number;
        };
        Update: {
          title?: string;
          description?: string;
          points?: number;
          category?: string;
          condition?: string;
          imageUrl?: string;
          sellerId?: string;
          sellerName?: string;
          sellerRating?: number;
          postedDate?: string;
          isPublic?: boolean;
          location?: {
            latitude?: number;
            longitude?: number;
            city?: string;
          };
          status?: string;
          views?: number;
          likes?: number;
        };
      };
      swapRequests: {
        Row: {
          id: string;
          itemId: string;
          itemTitle: string;
          itemImageUrl?: string;
          message?: string;
          points: number;
          senderId: string;
          senderName: string;
          receiverId: string;
          receiverName: string;
          status: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          itemId: string;
          itemTitle: string;
          itemImageUrl?: string;
          message?: string;
          points: number;
          senderId: string;
          senderName: string;
          receiverId: string;
          receiverName: string;
          status: string;
          createdAt: string;
        };
        Update: {
          itemId?: string;
          itemTitle?: string;
          itemImageUrl?: string;
          message?: string;
          points?: number;
          senderId?: string;
          senderName?: string;
          receiverId?: string;
          receiverName?: string;
          status?: string;
          createdAt?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          userId: string;
          type: string;
          amount: number;
          targetId?: string;
          targetName?: string;
          itemId?: string;
          itemTitle?: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          type: string;
          amount: number;
          targetId?: string;
          targetName?: string;
          itemId?: string;
          itemTitle?: string;
          createdAt: string;
        };
        Update: {
          userId?: string;
          type?: string;
          amount?: number;
          targetId?: string;
          targetName?: string;
          itemId?: string;
          itemTitle?: string;
          createdAt?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          fromId: string;
          fromName: string;
          toId: string;
          requestId: string;
          content: string;
          rating: number;
          createdAt: string;
        };
        Insert: {
          id?: string;
          fromId: string;
          fromName: string;
          toId: string;
          requestId: string;
          content: string;
          rating: number;
          createdAt: string;
        };
        Update: {
          fromId?: string;
          fromName?: string;
          toId?: string;
          requestId?: string;
          content?: string;
          rating?: number;
          createdAt?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          sellerId: string;
          postedDate: string;
          isPublic: boolean;
          location?: {
            latitude: number;
            longitude: number;
          };
          urgency: string;
          status: string;
          responses: number;
          likes: number;
          views: number;
          createdAt: string;
          userId: string;
          storeName?: string;
          validUntil?: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          price: number;
          category: string;
          sellerId: string;
          postedDate: string;
          isPublic: boolean;
          location?: {
            latitude: number;
            longitude: number;
          };
          urgency: string;
          status: string;
          responses: number;
          likes: number;
          views: number;
          createdAt: string;
          userId: string;
          storeName?: string;
          validUntil?: string;
        };
        Update: {
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          sellerId?: string;
          postedDate?: string;
          isPublic?: boolean;
          location?: {
            latitude?: number;
            longitude?: number;
          };
          urgency?: string;
          status?: string;
          responses?: number;
          likes?: number;
          views?: number;
          createdAt?: string;
          userId?: string;
          storeName?: string;
          validUntil?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
