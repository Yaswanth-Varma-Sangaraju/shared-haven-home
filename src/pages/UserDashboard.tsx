
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Room } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, DollarSign, Loader2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UserDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingRooms, setPendingRooms] = useState<Room[]>([]);
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
                is_owner,
                status
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
        const approvedRooms: Room[] = [];
        const pendingRoomsList: Room[] = [];
        
        userRooms.forEach(ur => {
          const roomData = ur.rooms;
          const room: Room = {
            id: roomData.id,
            name: roomData.name,
            address: roomData.address,
            type: roomData.type,
            capacity: roomData.capacity,
            createdAt: new Date(roomData.created_at),
            inviteCode: roomData.invite_code,
            roommates: roomData.roommates.map(rm => ({
              id: rm.id,
              name: rm.name,
              email: rm.email || undefined,
              phoneNumber: rm.phone_number || undefined,
              joinedAt: new Date(rm.joined_at),
              isOwner: rm.is_owner,
              status: rm.status || 'approved',
              isCurrentUser: true // Mark as current user
            })),
            expenses: roomData.expenses.map(exp => ({
              id: exp.id,
              title: exp.title,
              amount: exp.amount,
              paidBy: exp.paid_by,
              sharedWith: [], // Default empty
              date: new Date(exp.date),
              category: exp.category || undefined,
              settled: exp.settled
            })),
            chores: [] // Default empty chores array as it's not being fetched here
          };
          
          // Check if the current user has a pending status in this room
          const currentUserRoommate = room.roommates.find(rm => rm.isCurrentUser);
          if (currentUserRoommate && currentUserRoommate.status === 'pending') {
            pendingRoomsList.push(room);
          } else {
            approvedRooms.push(room);
          }
        });
        
        setRooms(approvedRooms);
        setPendingRooms(pendingRoomsList);
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
        
        {pendingRooms.length > 0 && (
          <div className="mb-6">
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You have {pendingRooms.length} pending room {pendingRooms.length === 1 ? 'request' : 'requests'} waiting for owner approval.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 space-y-4">
              {pendingRooms.map(room => (
                <Card key={room.id} className="border-amber-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Home className="inline-block mr-2 h-4 w-4 text-amber-600" />
                      {room.name}
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>{room.address}</p>
                      <p className="mt-2 text-amber-800">Your request to join this room is pending approval from the owner.</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {rooms.length === 0 && pendingRooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">You haven't joined any rooms yet.</p>
            <Button 
              className="mt-4 bg-roomie-teal hover:bg-roomie-teal/90"
              onClick={() => navigate('/join')}
            >
              Join a Room
            </Button>
          </div>
        ) : rooms.length > 0 && (
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
                      <p>Roommates: {room.roommates.filter(r => r.status === 'approved').length}/{room.capacity}</p>
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
