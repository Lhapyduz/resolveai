
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Professional } from './types'; // Import UserProfile for profile data type

// Directly using the Supabase credentials provided by the user.
const supabaseUrl = "https://wqgmsjznujlitjcdakgo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ21zanpudWpsaXRqY2Rha2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4OTY5NDIsImV4cCI6MjA2NjQ3Mjk0Mn0.9lBvPbRjvNk2ffyuxzuEmtixRXsz77wZfwYcBiNmodA";

if (!supabaseUrl || !supabaseAnonKey) {
  // This condition should ideally not be met if credentials are hardcoded correctly.
  // Kept for robustness, though the primary warning about env vars is removed for these.
  console.error(
    'Supabase URL or Anon Key is missing. Supabase features will be disabled. ' +
    'Please ensure these are correctly set in supabaseClient.ts.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper function to fetch user profile
export const fetchUserProfile = async (userId: string): Promise<UserProfile | Professional | null> => {
  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot fetch user profile.");
    return null;
  }
  const { data, error } = await supabase
    .from('profiles') // Assuming your table is named 'profiles'
    .select('*')
    .eq('user_id', userId) // Assuming 'user_id' column in 'profiles' links to 'auth.users.id'
    .single();

  if (error) {
    console.error('Error fetching user profile:', error.message);
    // It's common for a profile to not exist yet after sign-up, so this might not always be a critical error.
    // The calling code should handle a null return.
    return null;
  }
  return data as UserProfile | Professional;
};
