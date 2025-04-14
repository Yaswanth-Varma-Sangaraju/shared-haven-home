
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentRoom, setupRoomListener } from "@/lib/roomUtils";
import { Room } from "@/types";
import Header from "@/components/Header";
import RoomDashboard from "@/components/RoomDashboard";
import { toast } from "@/components/ui/use-toast";

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
        const prevRoommates = currentRoom.roommates.length;
        const currentRoommates = updatedRoom.roommates.length;
        
        if (currentRoommates > prevRoommates) {
          toast({
            title: "New roommate joined!",
            description: `${updatedRoom.roommates[updatedRoom.roommates.length - 1].name} has joined the room.`,
          });
        }
      });
      
      // Cleanup subscription on component unmount
      return () => {
        unsubscribe();
      };
    } else {
      // If no room found, redirect to home page
      navigate("/", { replace: true });
    }
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
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
