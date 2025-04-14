
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentRoom, setupRoomListener } from "@/lib/roomUtils";
import { Room } from "@/types";
import Header from "@/components/Header";
import RoomDashboard from "@/components/RoomDashboard";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current room from localStorage
    const currentRoom = getCurrentRoom();
    
    if (currentRoom) {
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
        }
      });
      
      // Set loading to false after a short delay to ensure data is processed
      setTimeout(() => setLoading(false), 500);
      
      // Cleanup subscription on component unmount
      return () => {
        unsubscribe();
      };
    } else {
      // If no room found, redirect to home page
      navigate("/", { replace: true });
      setLoading(false);
    }
  }, [navigate]);

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
