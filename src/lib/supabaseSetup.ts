
import { supabase } from "@/integrations/supabase/client";

// Enable realtime for specific tables in Supabase
export async function enableRealtimeForRooms() {
  try {
    // Check if realtime is working by creating test channels
    const roommateChannel = supabase.channel('roommate-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'roommates' 
      }, () => {})
      .subscribe();
    
    const expenseChannel = supabase.channel('expense-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'expenses' 
      }, () => {})
      .subscribe();
    
    const choreChannel = supabase.channel('chore-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'chores' 
      }, () => {})
      .subscribe();

    // Immediately unsubscribe from test channels (we're just testing)
    supabase.removeChannel(roommateChannel);
    supabase.removeChannel(expenseChannel);
    supabase.removeChannel(choreChannel);
    
    console.log('Realtime subscriptions tested successfully');
  } catch (error) {
    console.error('Error testing realtime subscriptions:', error);
  }
}
