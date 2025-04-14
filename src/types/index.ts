
export type RoomType = 'apartment' | 'house' | 'dorm' | 'other';

export interface Roommate {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  joinedAt: Date;
  isOwner: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // Roommate ID
  sharedWith: string[]; // Roommate IDs
  date: Date;
  category?: string;
  receipt?: string; // URL to receipt image
  settled: boolean;
}

export interface Chore {
  id: string;
  title: string;
  assignedTo: string; // Roommate ID
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  dueDate?: Date;
  completed: boolean;
}

export interface Room {
  id: string;
  name: string;
  address: string;
  location?: string;
  type: RoomType;
  capacity: number;
  createdAt: Date;
  roommates: Roommate[];
  expenses: Expense[];
  chores: Chore[];
  inviteCode: string;
}
