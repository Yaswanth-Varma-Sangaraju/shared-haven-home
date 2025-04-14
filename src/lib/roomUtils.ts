import { Room, RoomType, Roommate, Expense } from "@/types";

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
export const createRoom = (
  name: string,
  address: string,
  type: RoomType,
  capacity: number,
  ownerName: string
): Room => {
  const roomId = `room_${Date.now()}`;
  const ownerId = `user_${Date.now()}`;
  
  const owner: Roommate = {
    id: ownerId,
    name: ownerName,
    joinedAt: new Date(),
    isOwner: true,
  };
  
  const room: Room = {
    id: roomId,
    name,
    address,
    type,
    capacity,
    createdAt: new Date(),
    roommates: [owner],
    expenses: [],
    chores: [],
    inviteCode: generateInviteCode(),
  };
  
  // Save room to localStorage
  saveRoom(room);
  
  return room;
};

// Save room to localStorage
export const saveRoom = (room: Room): void => {
  const rooms = getRooms();
  const existingIndex = rooms.findIndex(r => r.id === room.id);
  
  if (existingIndex >= 0) {
    rooms[existingIndex] = room;
  } else {
    rooms.push(room);
  }
  
  localStorage.setItem('rooms', JSON.stringify(rooms));
};

// Get all rooms from localStorage
export const getRooms = (): Room[] => {
  const roomsJson = localStorage.getItem('rooms');
  if (!roomsJson) return [];
  return JSON.parse(roomsJson);
};

// Find room by invite code
export const findRoomByInviteCode = (inviteCode: string): Room | undefined => {
  const rooms = getRooms();
  return rooms.find(room => room.inviteCode === inviteCode);
};

// Join room by invite code
export const joinRoom = (inviteCode: string, userName: string): Room | null => {
  const room = findRoomByInviteCode(inviteCode);
  if (!room) return null;

  // Create new roommate
  const newRoommate: Roommate = {
    id: `user_${Date.now()}`,
    name: userName,
    joinedAt: new Date(),
    isOwner: false,
  };

  // Add to room
  room.roommates.push(newRoommate);
  saveRoom(room);

  return room;
};

// Add an expense to a room
export const addExpense = (
  roomId: string,
  title: string,
  amount: number,
  paidBy: string,
  sharedWith: string[],
  category?: string
): Expense | null => {
  const rooms = getRooms();
  const roomIndex = rooms.findIndex(r => r.id === roomId);
  if (roomIndex < 0) return null;

  const expense: Expense = {
    id: `expense_${Date.now()}`,
    title,
    amount,
    paidBy,
    sharedWith,
    date: new Date(),
    category,
    settled: false
  };

  rooms[roomIndex].expenses.push(expense);
  localStorage.setItem('rooms', JSON.stringify(rooms));
  return expense;
};

// Calculate who owes whom in the room
export const calculateBalances = (roomId: string): Record<string, Record<string, number>> => {
  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return {};

  const balances: Record<string, Record<string, number>> = {};
  
  // Initialize balance sheet
  room.roommates.forEach(r1 => {
    balances[r1.id] = {};
    room.roommates.forEach(r2 => {
      if (r1.id !== r2.id) {
        balances[r1.id][r2.id] = 0;
      }
    });
  });

  // Calculate based on expenses
  room.expenses.forEach(expense => {
    if (expense.settled) return;
    
    const payer = expense.paidBy;
    const sharedWith = expense.sharedWith;
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
};

// Get user's current room (for demo purposes, we'll just get the first room or null)
export const getCurrentRoom = (): Room | null => {
  const rooms = getRooms();
  return rooms.length > 0 ? rooms[0] : null;
};
