
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinRoom } from "@/lib/roomUtils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface JoinRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoinRoom = async () => {
    if (!inviteCode || !userName) {
      toast({
        title: "Missing information",
        description: "Please enter both your name and the invite code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const room = await joinRoom(inviteCode.toUpperCase(), userName);
      
      if (room) {
        toast({
          title: "Room joined!",
          description: `You've successfully joined ${room.name}`,
        });
        onOpenChange(false);
        navigate('/dashboard');
      } else {
        toast({
          title: "Invalid Invite Code",
          description: "We couldn't find a room with that invite code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error",
        description: "Something went wrong while joining the room",
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
            Join a Room
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter 6-character code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
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
            onClick={handleJoinRoom}
            className="w-full sm:w-auto bg-roomie-amber hover:bg-roomie-amber/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Joining..." : "Join Room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomModal;
