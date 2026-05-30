-- Supabase Row Level Security (RLS) Policies for SwapNorge
-- Run these queries in your Supabase SQL Editor to enable data security

-- ============================================
-- PROFILES TABLE - RLS POLICIES
-- ============================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY "profiles_view_all"
  ON profiles FOR SELECT
  USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- ITEMS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view published items
CREATE POLICY "items_view_published"
  ON items FOR SELECT
  USING (true);

-- Policy: Users can only create items
CREATE POLICY "items_create"
  ON items FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Policy: Users can only update their own items
CREATE POLICY "items_update_own"
  ON items FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Policy: Users can only delete their own items
CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  USING (seller_id = auth.uid());

-- ============================================
-- FAVORITES TABLE - RLS POLICIES
-- ============================================

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own favorites
CREATE POLICY "favorites_view_own"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own favorites
CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own favorites
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRANSACTIONS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own transactions
CREATE POLICY "transactions_view_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid() OR counterparty_id = auth.uid());

-- Policy: Users can only insert transactions
CREATE POLICY "transactions_insert"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR counterparty_id = auth.uid());

-- ============================================
-- REVIEWS TABLE - RLS POLICIES
-- ============================================

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view all reviews
CREATE POLICY "reviews_view_all"
  ON reviews FOR SELECT
  USING (true);

-- Policy: Users can only create reviews
CREATE POLICY "reviews_create"
  ON reviews FOR INSERT
  WITH CHECK (from_id = auth.uid());

-- Policy: Users can only delete their own reviews
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (from_id = auth.uid());

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Run this query to verify RLS policies are active:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE rowsecurity = true;

-- Expected output: All tables listed above should show true for rowsecurity column
