
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRoom } from "@/lib/roomUtils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { RoomType } from "@/types";

interface RoomCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoomCreationModal: React.FC<RoomCreationModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomName, setRoomName] = useState("");
  const [address, setAddress] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("apartment");
  const [capacity, setCapacity] = useState(2);
  const [ownerName, setOwnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = () => {
    if (!roomName || !address || !ownerName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newRoom = createRoom(roomName, address, roomType, capacity, ownerName);
      toast({
        title: "Room created!",
        description: `You've successfully created ${roomName}`,
      });
      onOpenChange(false);
      // Navigate to the room dashboard
      navigate(`/dashboard`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error",
        description: "Something went wrong while creating your room",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-roomie-dark">
            Create Your Room
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ownerName">Your Name</Label>
            <Input
              id="ownerName"
              placeholder="Enter your name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="e.g., The Cool Apartment"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, Apt 4, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="roomType">Room Type</Label>
              <Select value={roomType} onValueChange={(value) => setRoomType(value as RoomType)}>
                <SelectTrigger id="roomType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="dorm">Dorm</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Select 
                value={capacity.toString()} 
                onValueChange={(value) => setCapacity(parseInt(value))}
              >
                <SelectTrigger id="capacity">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRoom}
            className="w-full sm:w-auto bg-roomie-teal hover:bg-roomie-teal/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoomCreationModal;
