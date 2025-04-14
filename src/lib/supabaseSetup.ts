
import { supabase } from "@/integrations/supabase/client";

// Enable realtime for specific tables in Supabase
export async function enableRealtimeForRooms() {
  try {
    // Check if we can directly enable realtime for all tables we need
    await supabase.from('roommates').on('*', () => {}).subscribe();
    await supabase.from('expenses').on('*', () => {}).unsubscribe();
    await supabase.from('chores').on('*', () => {}).unsubscribe();
    
    console.log('Realtime subscriptions tested successfully');
  } catch (error) {
    console.error('Error testing realtime subscriptions:', error);
  }
}
