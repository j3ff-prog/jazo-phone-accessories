// api/_supabase.js — shared client, imported by all API functions
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service key — never exposed to frontend
);

module.exports = supabase;
