
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Room } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, DollarSign, Loader2 } from "lucide-react";

const UserDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRooms = async () => {
      try {
        // Fetch user's rooms
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/');
          return;
        }

        const { data: userRooms, error } = await supabase
          .from('user_rooms')
          .select(`
            room_id,
            rooms (
              id,
              name,
              address,
              type,
              capacity,
              created_at,
              invite_code,
              roommates (
                id,
                name,
                email,
                phone_number,
                joined_at,
                is_owner
              ),
              expenses (
                id,
                title,
                amount,
                paid_by,
                date,
                category,
                settled
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // Transform the data to match the Room type
        const roomsData: Room[] = userRooms.map(ur => ({
          ...ur.rooms,
          createdAt: ur.rooms.created_at,
          inviteCode: ur.rooms.invite_code,
          chores: [], // Add empty chores array as it's not fetched in this query
        }));

        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRooms();
  }, [navigate]);

  const calculateTotalExpenses = (room: Room) => {
    return room.expenses?.reduce((total, expense) => total + expense.amount, 0) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-roomie-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>
        
        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">You haven't joined any rooms yet.</p>
            <Button 
              className="mt-4 bg-roomie-teal hover:bg-roomie-teal/90"
              onClick={() => navigate('/join')}
            >
              Join a Room
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="rooms" className="space-y-4">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="rooms">My Rooms</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rooms" className="space-y-4">
              {rooms.map(room => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      <Home className="inline-block mr-2 h-4 w-4 text-roomie-teal" />
                      {room.name}
                    </CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/dashboard/${room.id}`)}
                    >
                      View Details
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>{room.address}</p>
                      <p>Type: {room.type}</p>
                      <p>Roommates: {room.roommates.length}/{room.capacity}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-4">
              {rooms.map(room => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      <DollarSign className="inline-block mr-2 h-4 w-4 text-roomie-teal" />
                      {room.name} Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>Total Expenses: ${calculateTotalExpenses(room).toFixed(2)}</p>
                      {room.expenses && room.expenses.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {room.expenses.map(expense => (
                            <li key={expense.id} className="flex justify-between">
                              <span>{expense.title}</span>
                              <span>${expense.amount.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No expenses in this room</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
