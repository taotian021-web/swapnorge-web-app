import type { Seller, Product } from './types';

export const allSellers: Seller[] = [
  {
    id: 'seller-1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    trustScore: 92,
    ratings: 45,
    location: 'Elm Street',
    locationRank: 1,
  },
  {
    id: 'seller-2',
    name: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/150?u=bob',
    trustScore: 88,
    ratings: 32,
    location: 'Oak Apartments',
    locationRank: 2,
  },
  {
    id: 'seller-3',
    name: 'Charlie',
    avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
    trustScore: 98,
    ratings: 102,
    location: 'Maple Court',
    locationRank: 3,
  },
  {
    id: 'seller-4',
    name: 'Diana',
    avatarUrl: 'https://i.pravatar.cc/150?u=diana',
    trustScore: 75,
    ratings: 15,
    location: 'Elm Street',
    locationRank: 1,
  },
];

export const allProducts: Product[] = [];
