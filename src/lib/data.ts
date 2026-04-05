
/**
 * @fileOverview Static data management for SwapNorge.
 * Note: Real data is now fully handled via Firestore. This file only contains
 * minimal placeholders or legacy references.
 */

import type { Seller, Product } from './types';

// Removed hardcoded mock sellers to ensure app uses real Firestore users.
export const allSellers: Seller[] = [];

// This is now just for structure reference, data is fetched from Firestore.
export const allProducts: Product[] = [];
