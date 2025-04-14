
import { supabase } from "@/integrations/supabase/client";

// Enable realtime for specific tables in Supabase
export async function enableRealtimeForRooms() {
  try {
    // Execute SQL to enable realtime for tables
    const { error } = await supabase.rpc('enable_realtime_tables');
    
    if (error) {
      console.error('Error enabling realtime for tables:', error);
    } else {
      console.log('Realtime enabled for tables');
    }
  } catch (error) {
    console.error('Error in enableRealtimeForRooms:', error);
  }
}
