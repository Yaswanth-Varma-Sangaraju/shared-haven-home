
import { Room, RoomType, Roommate, Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Generate a unique invite code
export const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create a new room
export const createRoom = async (
  name: string,
  address: string,
  location: string,
  type: RoomType,
  capacity: number,
  ownerName: string,
  email?: string,
  phoneNumber?: string
): Promise<Room | null> => {
  try {
    // Generate invite code
    const inviteCode = generateInviteCode();
    
    // Insert room into database
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        address,
        location,
        type,
        capacity,
        invite_code: inviteCode
      })
      .select()
      .single();
      
    if (roomError) {
      console.error('Error creating room:', roomError);
      return null;
    }
    
    // Insert owner as first roommate
    const { data: roommateData, error: roommateError } = await supabase
      .from('roommates')
      .insert({
        room_id: roomData.id,
        name: ownerName,
        email,
        phone_number: phoneNumber,
        is_owner: true
      })
      .select()
      .single();
      
    if (roommateError) {
      console.error('Error creating roommate:', roommateError);
      return null;
    }

    // Create room object to return
    const room: Room = {
      id: roomData.id,
      name: roomData.name,
      address: roomData.address,
      location: roomData.location,
      type: roomData.type as RoomType,
      capacity: roomData.capacity,
      createdAt: new Date(roomData.created_at),
      inviteCode: roomData.invite_code,
      roommates: [{
        id: roommateData.id,
        name: roommateData.name,
        email: roommateData.email,
        phoneNumber: roommateData.phone_number,
        joinedAt: new Date(roommateData.joined_at),
        isOwner: roommateData.is_owner
      }],
      expenses: [],
      chores: []
    };
    
    // Save to localStorage as current room
    localStorage.setItem('currentRoom', JSON.stringify(room));
    
    return room;
  } catch (error) {
    console.error('Error in createRoom:', error);
    return null;
  }
};

// Save room to localStorage
export const saveRoom = (room: Room): void => {
  localStorage.setItem('currentRoom', JSON.stringify(room));
};

// Find room by invite code
export const findRoomByInviteCode = async (inviteCode: string): Promise<Room | null> => {
  try {
    // Query the room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('invite_code', inviteCode)
      .single();
      
    if (roomError || !roomData) {
      console.error('Error finding room by invite code:', roomError);
      return null;
    }

    // Get roommates
    const { data: roommates, error: roommatesError } = await supabase
      .from('roommates')
      .select()
      .eq('room_id', roomData.id);
      
    if (roommatesError) {
      console.error('Error getting roommates:', roommatesError);
      return null;
    }
    
    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select()
      .eq('room_id', roomData.id);
      
    if (expensesError) {
      console.error('Error getting expenses:', expensesError);
    }
    
    // Get chores
    const { data: chores, error: choresError } = await supabase
      .from('chores')
      .select()
      .eq('room_id', roomData.id);
      
    if (choresError) {
      console.error('Error getting chores:', choresError);
    }
    
    // Create room object from data
    const room: Room = {
      id: roomData.id,
      name: roomData.name,
      address: roomData.address,
      location: roomData.location || '',
      type: roomData.type as RoomType,
      capacity: roomData.capacity,
      createdAt: new Date(roomData.created_at),
      inviteCode: roomData.invite_code,
      roommates: roommates?.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email || undefined,
        phoneNumber: r.phone_number || undefined,
        joinedAt: new Date(r.joined_at),
        isOwner: r.is_owner
      })) || [],
      expenses: expenses?.map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        paidBy: e.paid_by,
        sharedWith: [], // We need to get this from expense_shares - to be implemented
        date: new Date(e.date),
        category: e.category,
        receipt: e.receipt,
        settled: e.settled
      })) || [],
      chores: chores?.map(c => ({
        id: c.id,
        title: c.title,
        assignedTo: c.assigned_to,
        frequency: c.frequency as 'daily' | 'weekly' | 'monthly' | 'once',
        dueDate: c.due_date ? new Date(c.due_date) : undefined,
        completed: c.completed
      })) || []
    };
    
    return room;
  } catch (error) {
    console.error('Error in findRoomByInviteCode:', error);
    return null;
  }
};

// Join room by invite code
export const joinRoom = async (
  inviteCode: string, 
  userName: string,
  email?: string,
  phoneNumber?: string
): Promise<Room | null> => {
  try {
    // Find the room first
    const room = await findRoomByInviteCode(inviteCode);
    if (!room) return null;

    // Add new roommate
    const { data: roommateData, error: roommateError } = await supabase
      .from('roommates')
      .insert({
        room_id: room.id,
        name: userName,
        email,
        phone_number: phoneNumber,
        is_owner: false
      })
      .select()
      .single();
      
    if (roommateError) {
      console.error('Error adding roommate:', roommateError);
      return null;
    }
    
    // Add the new roommate to our room object
    room.roommates.push({
      id: roommateData.id,
      name: roommateData.name,
      email: roommateData.email || undefined,
      phoneNumber: roommateData.phone_number || undefined,
      joinedAt: new Date(roommateData.joined_at),
      isOwner: roommateData.is_owner
    });
    
    // Save to localStorage
    saveRoom(room);
    
    return room;
  } catch (error) {
    console.error('Error in joinRoom:', error);
    return null;
  }
};

// Add an expense to a room
export const addExpense = async (
  roomId: string,
  title: string,
  amount: number,
  paidBy: string,
  sharedWith: string[],
  category?: string
): Promise<Expense | null> => {
  try {
    // Insert expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        room_id: roomId,
        title,
        amount,
        paid_by: paidBy,
        category
      })
      .select()
      .single();
      
    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return null;
    }
    
    // Insert expense shares
    const shareInserts = sharedWith.map(roommateId => ({
      expense_id: expenseData.id,
      roommate_id: roommateId
    }));
    
    const { error: sharesError } = await supabase
      .from('expense_shares')
      .insert(shareInserts);
      
    if (sharesError) {
      console.error('Error creating expense shares:', sharesError);
    }
    
    // Create expense object to return
    const expense: Expense = {
      id: expenseData.id,
      title: expenseData.title,
      amount: expenseData.amount,
      paidBy: expenseData.paid_by,
      sharedWith,
      date: new Date(expenseData.date),
      category: expenseData.category,
      receipt: expenseData.receipt,
      settled: expenseData.settled
    };
    
    return expense;
  } catch (error) {
    console.error('Error in addExpense:', error);
    return null;
  }
};

// Calculate who owes whom in the room
export const calculateBalances = async (roomId: string): Promise<Record<string, Record<string, number>>> => {
  try {
    // Get all roommates for this room
    const { data: roommates, error: roommatesError } = await supabase
      .from('roommates')
      .select('id, name')
      .eq('room_id', roomId);
      
    if (roommatesError) {
      console.error('Error getting roommates:', roommatesError);
      return {};
    }
    
    // Get all expenses for this room
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id, amount, paid_by, 
        expense_shares (roommate_id)
      `)
      .eq('room_id', roomId)
      .eq('settled', false);
      
    if (expensesError) {
      console.error('Error getting expenses:', expensesError);
      return {};
    }
    
    // Initialize balance sheet
    const balances: Record<string, Record<string, number>> = {};
    
    roommates.forEach(r1 => {
      balances[r1.id] = {};
      roommates.forEach(r2 => {
        if (r1.id !== r2.id) {
          balances[r1.id][r2.id] = 0;
        }
      });
    });
    
    // Calculate based on expenses
    expenses.forEach(expense => {
      const payer = expense.paid_by;
      const sharedWith = expense.expense_shares.map(share => share.roommate_id);
      
      if (sharedWith.length === 0) return;
      
      const shareAmount = expense.amount / sharedWith.length;
      
      sharedWith.forEach(debtor => {
        if (debtor !== payer) {
          balances[debtor][payer] += shareAmount;
          balances[payer][debtor] -= shareAmount;
        }
      });
    });
    
    // Simplify balances (remove zero balances and only keep positive values)
    const simplifiedBalances: Record<string, Record<string, number>> = {};
    
    Object.keys(balances).forEach(person1 => {
      simplifiedBalances[person1] = {};
      
      Object.keys(balances[person1]).forEach(person2 => {
        const amount = balances[person1][person2];
        if (amount > 0) {
          simplifiedBalances[person1][person2] = parseFloat(amount.toFixed(2));
        }
      });
    });
    
    return simplifiedBalances;
  } catch (error) {
    console.error('Error in calculateBalances:', error);
    return {};
  }
};

// Get user's current room from localStorage
export const getCurrentRoom = (): Room | null => {
  const roomJson = localStorage.getItem('currentRoom');
  if (!roomJson) return null;
  
  try {
    const room = JSON.parse(roomJson) as Room;
    // Make sure dates are Date objects
    room.createdAt = new Date(room.createdAt);
    room.roommates.forEach(r => r.joinedAt = new Date(r.joinedAt));
    room.expenses.forEach(e => e.date = new Date(e.date));
    room.chores.forEach(c => {
      if (c.dueDate) c.dueDate = new Date(c.dueDate);
    });
    return room;
  } catch (error) {
    console.error('Error parsing current room:', error);
    return null;
  }
};

// Set up real-time listener for room updates
export const setupRoomListener = (
  roomId: string, 
  onRoomUpdate: (room: Room) => void
) => {
  // Get the current room
  const currentRoom = getCurrentRoom();
  if (!currentRoom) {
    console.error('No current room found for listener');
    return () => {};
  }

  // Enable PostgreSQL replication for the tables
  const enableReplication = async () => {
    await supabase.rpc('enable_realtime', { table_name: 'roommates' });
    await supabase.rpc('enable_realtime', { table_name: 'expenses' });
    await supabase.rpc('enable_realtime', { table_name: 'chores' });
  };
  
  // Call the function to enable replication
  enableReplication().catch(error => {
    console.error('Error enabling realtime:', error);
  });

  console.log('Setting up room listener for room ID:', roomId);

  // Set up channel for room updates
  const channel = supabase
    .channel('room-updates')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public',
      table: 'roommates',
      filter: `room_id=eq.${roomId}` 
    }, async (payload) => {
      console.log('Roommate change detected:', payload);
      // Reload the entire room data when any change happens
      const updatedRoom = await findRoomByInviteCode(currentRoom.inviteCode);
      if (updatedRoom) {
        console.log('Room updated with new data:', updatedRoom);
        saveRoom(updatedRoom);
        onRoomUpdate(updatedRoom);
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `room_id=eq.${roomId}`
    }, async (payload) => {
      console.log('Expense change detected:', payload);
      const updatedRoom = await findRoomByInviteCode(currentRoom.inviteCode);
      if (updatedRoom) {
        saveRoom(updatedRoom);
        onRoomUpdate(updatedRoom);
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chores',
      filter: `room_id=eq.${roomId}`
    }, async (payload) => {
      console.log('Chore change detected:', payload);
      const updatedRoom = await findRoomByInviteCode(currentRoom.inviteCode);
      if (updatedRoom) {
        saveRoom(updatedRoom);
        onRoomUpdate(updatedRoom);
      }
    })
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  // Return unsubscribe function
  return () => {
    console.log('Removing channel subscription');
    supabase.removeChannel(channel);
  };
};
