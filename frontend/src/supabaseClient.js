import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miiqouahjgtrbopcbnup.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paXFvdWFoamd0cmJvcGNibnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTkwMjcsImV4cCI6MjA2NTMzNTAyN30.OxOJH00Ifed89NmIYG1eaAI1p-3baqOQs5eVvth5Xe0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey,
{
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}
);

// Sign up function
export async function signUp({ email, password, firstName, lastName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName }
    }
  });
  return { data, error };
}

// Sign in function
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}