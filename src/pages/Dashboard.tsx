
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentRoom, setupRoomListener, findRoomByInviteCode } from "@/lib/roomUtils";
import { Room } from "@/types";
import Header from "@/components/Header";
import RoomDashboard from "@/components/RoomDashboard";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        // Try to get room by ID from params first
        if (roomId) {
          const currentRoom = getCurrentRoom();
          
          // If current room matches the ID param, use it
          if (currentRoom && currentRoom.id === roomId) {
            // Check if the current user is a pending roommate
            const currentUserRoommate = currentRoom.roommates.find(rm => rm.isCurrentUser);
            const currentUserPending = currentUserRoommate && currentUserRoommate.status === 'pending';
            
            if (currentUserPending) {
              setPendingApproval(true);
              setLoading(false);
              return;
            }
            
            setRoom(currentRoom);
            
            // Setup real-time listener for room updates
            const unsubscribe = setupRoomListener(currentRoom.id, (updatedRoom) => {
              console.log("Room updated:", updatedRoom);
              
              // Check if the current user has been removed from the room
              const currentRoommate = currentRoom.roommates.find(rm => rm.isCurrentUser);
              if (!currentRoommate) return;
              
              const stillInRoom = updatedRoom.roommates.some(rm => 
                rm.id === currentRoommate.id && rm.status === 'approved'
              );
              
              // Don't show removal notification for owners
              if (!stillInRoom && !currentRoommate.isOwner) {
                // User has been removed, redirect to home page
                toast({
                  title: "Removed from room",
                  description: "You have been removed from this room by the owner.",
                  variant: "destructive"
                });
                navigate("/", { replace: true });
                return;
              }
              
              // User still in room, update state
              setRoom(updatedRoom);
              
              // Show toast notification for new roommate requests (only to owner)
              const currentUserIsOwner = updatedRoom.roommates.some(rm => rm.isCurrentUser && rm.isOwner);
              
              if (currentUserIsOwner) {
                // Check for new pending roommates
                const newPendingRoommate = updatedRoom.roommates.find(
                  newR => 
                    newR.status === 'pending' && 
                    !currentRoom.roommates.some(oldR => oldR.id === newR.id && oldR.status === 'pending')
                );
                
                if (newPendingRoommate) {
                  toast({
                    title: "New roommate request",
                    description: `${newPendingRoommate.name} has requested to join the room.`,
                  });
                }
              }
              
              // Show toast notification when roommates change
              if (updatedRoom.roommates.length > currentRoom.roommates.length) {
                const newRoommate = updatedRoom.roommates.find(
                  newR => !currentRoom.roommates.some(oldR => oldR.id === newR.id)
                );
                
                if (newRoommate) {
                  toast({
                    title: "New roommate joined!",
                    description: `${newRoommate.name} has joined the room.`,
                  });
                }
              } else if (updatedRoom.roommates.length < currentRoom.roommates.length) {
                toast({
                  title: "Roommate removed",
                  description: "A roommate has been removed from the room.",
                });
              }
            });
            
            // Set loading to false after a short delay to ensure data is processed
            setTimeout(() => setLoading(false), 500);
            
            return () => {
              unsubscribe();
            };
          } 
          // If room not found in local storage or ID doesn't match, redirect to home
          else {
            navigate("/", { replace: true });
            setLoading(false);
          }
        } else {
          // If no roomId param, try to use current room from localStorage
          const currentRoom = getCurrentRoom();
          
          if (currentRoom) {
            // Check if the current user is a pending roommate
            const currentUserRoommate = currentRoom.roommates.find(rm => rm.isCurrentUser);
            const currentUserPending = currentUserRoommate && currentUserRoommate.status === 'pending';
            
            if (currentUserPending) {
              setPendingApproval(true);
              setLoading(false);
              return;
            }
            
            setRoom(currentRoom);
            
            // Setup real-time listener for room updates
            const unsubscribe = setupRoomListener(currentRoom.id, (updatedRoom) => {
              console.log("Room updated:", updatedRoom);
              
              // Check if the current user has been removed from the room
              const currentRoommate = currentRoom.roommates.find(rm => rm.isCurrentUser);
              if (!currentRoommate) return;
              
              const stillInRoom = updatedRoom.roommates.some(rm => 
                rm.id === currentRoommate.id && rm.status === 'approved'
              );
              
              // Don't show removal notification for owners
              if (!stillInRoom && !currentRoommate.isOwner) {
                // User has been removed, redirect to home page
                toast({
                  title: "Removed from room",
                  description: "You have been removed from this room by the owner.",
                  variant: "destructive"
                });
                navigate("/", { replace: true });
                return;
              }
              
              setRoom(updatedRoom);
            });
            
            // Set loading to false after a short delay to ensure data is processed
            setTimeout(() => setLoading(false), 500);
            
            return () => {
              unsubscribe();
            };
          } else {
            // If no room found, redirect to home page
            navigate("/", { replace: true });
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading room:", error);
        navigate("/", { replace: true });
        setLoading(false);
      }
    };

    loadRoomData();
  }, [navigate, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-roomie-teal" />
          <div className="text-lg font-medium">Loading your room...</div>
          <div className="text-sm text-muted-foreground">Please wait while we fetch the latest data</div>
        </div>
      </div>
    );
  }

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-md mx-auto mt-8">
            <Alert className="bg-amber-50 border-amber-200 mb-6">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Your request to join this room is pending approval from the room owner.
                You'll be able to access the room once your request is approved.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return null; // Navigate will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <RoomDashboard room={room} onRoomUpdate={setRoom} />
      </div>
    </div>
  );
};

export default Dashboard;
