
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, DollarSign, Plus, Receipt } from "lucide-react";
import { Expense, Room, Roommate } from "@/types";
import { addExpense, calculateBalances, saveRoom } from "@/lib/roomUtils";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface ExpenseTrackerProps {
  room: Room;
  onRoomUpdate: (room: Room) => void;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ room, onRoomUpdate }) => {
  const { toast } = useToast();
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  
  // New expense state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("general");
  const [selectedRoommates, setSelectedRoommates] = useState<string[]>([]);
  const [splitEvenly, setSplitEvenly] = useState(true);
  
  useEffect(() => {
    const calculatedBalances = calculateBalances(room.id);
    setBalances(calculatedBalances);
  }, [room]);

  const handleAddExpense = () => {
    if (!title || !amount || !paidBy || selectedRoommates.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const newExpense = addExpense(
      room.id,
      title,
      amountNumber,
      paidBy,
      selectedRoommates,
      category
    );

    if (newExpense) {
      const updatedRoom = { ...room, expenses: [...room.expenses, newExpense] };
      onRoomUpdate(updatedRoom);
      
      toast({
        title: "Expense added",
        description: `Added ${title} for $${amountNumber}`,
      });
      
      // Reset form
      setTitle("");
      setAmount("");
      setPaidBy("");
      setCategory("general");
      setSelectedRoommates([]);
      setShowAddExpenseDialog(false);
    }
  };

  const handleSettle = (expenseId: string) => {
    const updatedExpenses = room.expenses.map(expense => 
      expense.id === expenseId ? { ...expense, settled: true } : expense
    );
    const updatedRoom = { ...room, expenses: updatedExpenses };
    saveRoom(updatedRoom);
    onRoomUpdate(updatedRoom);
    
    toast({
      title: "Expense settled",
      description: "The expense has been marked as settled",
    });
  };

  const getRoommateName = (id: string) => {
    const roommate = room.roommates.find(r => r.id === id);
    return roommate ? roommate.name : "Unknown";
  };

  const handleSelectAllRoommates = () => {
    if (splitEvenly) {
      setSelectedRoommates(room.roommates.map(r => r.id));
    } else {
      setSelectedRoommates([]);
    }
  };

  useEffect(() => {
    handleSelectAllRoommates();
  }, [splitEvenly, room.roommates]);

  const categories = [
    "general", "groceries", "rent", "utilities", 
    "internet", "entertainment", "household", "other"
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Button
          onClick={() => setShowAddExpenseDialog(true)}
          className="bg-roomie-teal hover:bg-roomie-teal/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-roomie-amber" />
            Current Balances
          </CardTitle>
          <CardDescription>
            Who owes whom in your room
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(balances).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(balances).map(([person, owes]) => (
                Object.keys(owes).length > 0 && (
                  <div key={person} className="border-b pb-2">
                    <p className="font-medium">{getRoommateName(person)} owes:</p>
                    <ul className="ml-6 list-disc">
                      {Object.entries(owes).map(([toPerson, amount]) => (
                        <li key={`${person}-${toPerson}`} className="text-sm">
                          ${amount.toFixed(2)} to {getRoommateName(toPerson)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No outstanding balances</p>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {room.expenses.length > 0 ? (
            <div className="space-y-4">
              {room.expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className={`flex justify-between items-center p-3 border rounded-lg ${
                    expense.settled ? "bg-muted" : "bg-white"
                  }`}
                >
                  <div className="flex items-center">
                    {expense.settled && <CheckCircle className="h-4 w-4 text-green-500 mr-2" />}
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {getRoommateName(expense.paidBy)}
                        {expense.category && ` • ${expense.category}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-bold">${expense.amount.toFixed(2)}</p>
                    {!expense.settled && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSettle(expense.id)}
                      >
                        Settle
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No expenses added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a New Expense</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Expense Title</Label>
              <Input
                id="title"
                placeholder="e.g., Grocery Shopping"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger id="paidBy">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {room.roommates.map((roommate) => (
                    <SelectItem key={roommate.id} value={roommate.id}>
                      {roommate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="splitWith">Split With</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="splitEvenly" 
                    checked={splitEvenly}
                    onCheckedChange={(checked) => setSplitEvenly(!!checked)} 
                  />
                  <Label htmlFor="splitEvenly" className="text-sm cursor-pointer">
                    Split evenly
                  </Label>
                </div>
              </div>
              
              {!splitEvenly && (
                <div className="space-y-2 border rounded-md p-2">
                  {room.roommates.map((roommate) => (
                    <div key={roommate.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`roommate-${roommate.id}`}
                        checked={selectedRoommates.includes(roommate.id)}
                        onCheckedChange={(checked) => {
                          setSelectedRoommates(prev => 
                            checked 
                              ? [...prev, roommate.id] 
                              : prev.filter(id => id !== roommate.id)
                          );
                        }}
                      />
                      <Label 
                        htmlFor={`roommate-${roommate.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {roommate.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddExpenseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              className="bg-roomie-teal hover:bg-roomie-teal/90"
            >
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseTracker;
