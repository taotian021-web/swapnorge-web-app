const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually and override process.env to avoid stale shell env
try {
  const envRaw = fs.readFileSync('.env.local', 'utf8');
  envRaw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const key = m[1];
      let val = m[2] || '';
      // strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
} catch (e) {
  // ignore if file not found
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, SUPABASE_ANON);
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Test1234!';

  console.log('Using SUPABASE_URL:', SUPABASE_URL);
  console.log('Signing up test user:', email);
  const { data: signData, error: signErr } = await anon.auth.signUp({ email, password });
  let createdUserId = null;
  if (signErr) {
    console.error('Sign up error:', signErr);
    console.log('Attempting to create user via Admin REST API using service role...');
    try {
      const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE}`,
          apikey: SUPABASE_SERVICE,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        console.error('Admin create user failed:', res.status, body);
        process.exit(1);
      }
      console.log('Admin create response:', body);
      createdUserId = body.id;
    } catch (e) {
      console.error('Admin create exception:', e);
      process.exit(1);
    }
  } else {
    console.log('Sign up response:', signData);
    createdUserId = signData.user?.id ?? null;
  }

  // Poll profiles table via admin key to find the created profile
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    const queryField = createdUserId ? 'id' : 'email';
    const queryValue = createdUserId || email;
    const { data: profiles, error: pErr } = await admin.from('profiles').select('*').eq(queryField, queryValue);
    if (pErr) {
      console.error('Profiles query error:', pErr);
      continue;
    }
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('Profile created:', profile);

      // Clean up: delete profile and user
      try {
        await admin.from('profiles').delete().eq('id', profile.id);
        console.log('Profile deleted');
      } catch (e) {
        console.error('Error deleting profile:', e);
      }

      try {
        if (admin.auth && admin.auth.admin && typeof admin.auth.admin.deleteUser === 'function') {
          await admin.auth.admin.deleteUser(profile.id);
          console.log('Auth user deleted');
        } else {
          console.warn('Admin deleteUser not available on this client version');
        }
      } catch (e) {
        console.error('Error deleting auth user:', e);
      }

      process.exit(0);
    } else {
      console.log('Profile not found yet, retrying...');
    }
  }

  console.error('Profile not found after waiting');
  process.exit(2);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
