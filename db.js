import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables. Do NOT commit secrets.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  // In development you may set VITE_ vars; in production set SUPABASE_* vars.
  console.warn('SUPABASE_URL or SUPABASE_KEY not set. db.js will fail without them.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generic helper
async function getRows(table, limit = 10) {
  const { data, error } = await supabase.from(table).select('*').limit(limit);
  if (error) throw error;
  return data;
}

// Table-specific helpers
export const getAppSettings = (limit = 10) => getRows('app_settings', limit);
export const getNotifications = (limit = 10) => getRows('notifications', limit);
export const getPositions = (limit = 10) => getRows('positions', limit);
export const getProfils = (limit = 10) => getRows('profils', limit);
export const getTransactions = (limit = 10) => getRows('transactions', limit);
export const getUserRoles = (limit = 10) => getRows('user_roles', limit);

export { getRows };
export default supabase;
