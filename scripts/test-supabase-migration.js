#!/usr/bin/env node

/**
 * Supabase Migration Test Script
 * Tests the migrated data in Supabase
 *
 * Usage:
 * 1. Configure Supabase environment variables
 * 2. Run: node scripts/test-supabase-migration.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTables() {
  console.log('🧪 Testing Supabase tables...\n');

  const tables = ['profiles', 'items', 'transactions', 'reviews', 'swapRequests', 'favorites'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Exception - ${error.message}`);
    }
  }
}

async function testQueries() {
  console.log('\n🔍 Testing common queries...\n');

  // Test getting public items
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('isPublic', true)
      .eq('status', 'available')
      .limit(5);

    if (error) {
      console.log(`❌ Public items query failed: ${error.message}`);
    } else {
      console.log(`✅ Public items query: ${items.length} items returned`);
    }
  } catch (error) {
    console.log(`❌ Public items query exception: ${error.message}`);
  }

  // Test getting user profile
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Profile query failed: ${error.message}`);
    } else if (profiles.length > 0) {
      console.log(`✅ Profile query: Found profile for ${profiles[0].displayName}`);
    } else {
      console.log(`⚠️  Profile query: No profiles found`);
    }
  } catch (error) {
    console.log(`❌ Profile query exception: ${error.message}`);
  }

  // Test getting swap requests
  try {
    const { data: requests, error } = await supabase
      .from('swapRequests')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Swap requests query failed: ${error.message}`);
    } else {
      console.log(`✅ Swap requests query: ${requests.length} requests found`);
    }
  } catch (error) {
    console.log(`❌ Swap requests query exception: ${error.message}`);
  }
}

async function testRealtime() {
  console.log('\n📡 Testing realtime subscriptions...\n');

  // Test realtime subscription (will timeout after 5 seconds)
  return new Promise((resolve) => {
    let receivedUpdate = false;

    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'items'
      }, (payload) => {
        console.log('✅ Realtime working: Received update', payload.eventType);
        receivedUpdate = true;
        channel.unsubscribe();
        resolve();
      })
      .subscribe();

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!receivedUpdate) {
        console.log('⚠️  Realtime test: No updates received (this is normal if no changes occur)');
      }
      channel.unsubscribe();
      resolve();
    }, 5000);
  });
}

async function main() {
  try {
    console.log('🚀 Testing Supabase migration...\n');

    await testTables();
    await testQueries();
    await testRealtime();

    console.log('\n🎉 Tests completed!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}