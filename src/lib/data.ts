
/**
 * @fileOverview 静态数据管理 - SwapNorge。
 * 注意：所有数据现在已完全移至 Firestore 实时数据库。
 * 此文件仅保留空的导出以兼容旧引用，不包含任何虚拟数据。
 */

import type { Seller, Product } from './types';

// 已清空所有虚拟账号。
// 所有的用户信息将通过 Firebase Auth 登录后在 Firestore 的 /users 集合中自动创建。
export const allSellers: Seller[] = [];

// 已清空所有虚拟物品。
// 所有的物品信息将通过 /items 集合进行实时读取。
export const allProducts: Product[] = [];
