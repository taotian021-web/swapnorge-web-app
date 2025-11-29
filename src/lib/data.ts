import type { Seller, Product } from './types';

export const allSellers: Seller[] = [
  {
    id: 'seller-1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?u=alice',
    trustScore: 92, // 热心值
    ratings: 45,
    location: 'Elm Street',
    locationRank: 1,
    responseRate: 98,
    positiveFeedbackRate: 95,
    isAddressVerified: true,
    isSkillVerified: false,
    timeBankHours: 10.5,
  },
  {
    id: 'seller-2',
    name: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/150?u=bob',
    trustScore: 88, // 热心值
    ratings: 32,
    location: 'Oak Apartments',
    locationRank: 2,
    responseRate: 92,
    positiveFeedbackRate: 90,
    isAddressVerified: false,
    isSkillVerified: true,
    timeBankHours: 5,
  },
  {
    id: 'seller-3',
    name: 'Charlie',
    avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
    trustScore: 98, // 热心值
    ratings: 102,
    location: 'Maple Court',
    locationRank: 3,
    responseRate: 100,
    positiveFeedbackRate: 99,
    isAddressVerified: true,
    isSkillVerified: true,
    timeBankHours: 25,
  },
  {
    id: 'seller-4',
    name: 'Diana',
    avatarUrl: 'https://i.pravatar.cc/150?u=diana',
    trustScore: 75, // 热心值
    ratings: 15,
    location: 'Elm Street',
    locationRank: 1,
    responseRate: 85,
    positiveFeedbackRate: 88,
    isAddressVerified: false,
    isSkillVerified: false,
    timeBankHours: 2,
  },
];

export const allProducts: Product[] = [];
