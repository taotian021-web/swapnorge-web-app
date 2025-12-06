import type { Seller, Product } from './types';

export const allSellers: Seller[] = [
  {
    id: 'seller-1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    id: 'seller-2',
    name: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/150?u=bob',
  },
  {
    id: 'seller-3',
    name: 'Charlie',
    avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
  },
  {
    id: 'seller-4',
    name: 'Diana',
    avatarUrl: 'https://i.pravatar.cc/150?u=diana',
  },
];

// This is now just for structure reference, data is fetched from Firestore.
export const allProducts: Product[] = [];
