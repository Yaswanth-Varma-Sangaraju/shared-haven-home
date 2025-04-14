
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentRoom, setupRoomListener, findRoomByInviteCode } from "@/lib/roomUtils";
import { Room } from "@/types";
import Header from "@/components/Header";
import RoomDashboard from "@/components/RoomDashboard";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        // Try to get room by ID from params first
        if (roomId) {
          const currentRoom = getCurrentRoom();
          
          // If current room matches the ID param, use it
          if (currentRoom && currentRoom.id === roomId) {
            setRoom(currentRoom);
            
            // Setup real-time listener for room updates
            const unsubscribe = setupRoomListener(currentRoom.id, (updatedRoom) => {
              console.log("Room updated:", updatedRoom);
              setRoom(updatedRoom);
              
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
            setRoom(currentRoom);
            
            // Setup real-time listener for room updates
            const unsubscribe = setupRoomListener(currentRoom.id, (updatedRoom) => {
              console.log("Room updated:", updatedRoom);
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
