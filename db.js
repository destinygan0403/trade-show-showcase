import { createClient } from '@supabase/supabase-js';

// Configure from environment variables in production
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-or-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Replace 'your_table' with the name of a table in your Supabase project
export async function getRows(limit = 10) {
  const { data, error } = await supabase.from('your_table').select('*').limit(limit);
  if (error) throw error;
  return data;
}

export default supabase;
