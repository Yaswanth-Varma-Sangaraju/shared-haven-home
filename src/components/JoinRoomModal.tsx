
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinRoom, findRoomByInviteCode } from "@/lib/roomUtils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

interface JoinRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  inviteCode: z.string().length(6, "Invite code must be 6 characters")
});

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomCapacityError, setRoomCapacityError] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      email: "",
      phoneNumber: "",
      inviteCode: ""
    },
  });

  const handleJoinRoom = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setRoomCapacityError(false);
    setDuplicateError(null);
    
    try {
      // First check if the room exists and has capacity
      const room = await findRoomByInviteCode(values.inviteCode.toUpperCase());
      if (!room) {
        toast({
          title: "Invalid Invite Code",
          description: "We couldn't find a room with that invite code",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if room is at capacity
      if (room.roommates.length >= room.capacity) {
        setRoomCapacityError(true);
        setIsSubmitting(false);
        return;
      }
      
      // Check for duplicate name, email, or phone number
      const duplicateName = room.roommates.find(r => 
        r.name.toLowerCase() === values.userName.toLowerCase());
      
      const duplicateEmail = room.roommates.find(r => 
        r.email && r.email.toLowerCase() === values.email.toLowerCase());
      
      const duplicatePhone = room.roommates.find(r => 
        r.phoneNumber && r.phoneNumber === values.phoneNumber);
      
      if (duplicateName) {
        setDuplicateError("Someone with this name is already in the room. Please use a different name.");
        setIsSubmitting(false);
        return;
      }
      
      if (duplicateEmail) {
        setDuplicateError("This email is already used by someone in the room. Please use a different email.");
        setIsSubmitting(false);
        return;
      }
      
      if (duplicatePhone) {
        setDuplicateError("This phone number is already used by someone in the room. Please use a different number.");
        setIsSubmitting(false);
        return;
      }
      
      // If there are no duplicates, proceed with joining
      const joinedRoom = await joinRoom(
        values.inviteCode.toUpperCase(), 
        values.userName,
        values.email,
        values.phoneNumber
      );
      
      if (joinedRoom) {
        toast({
          title: "Room joined!",
          description: `You've successfully joined ${joinedRoom.name}`,
        });
        onOpenChange(false);
        navigate('/dashboard');
      } else {
        toast({
          title: "Error joining room",
          description: "There was a problem joining the room",
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

        {roomCapacityError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This room is already at capacity and cannot accept more roommates.
            </AlertDescription>
          </Alert>
        )}

        {duplicateError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {duplicateError}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleJoinRoom)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-character code" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-roomie-amber hover:bg-roomie-amber/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Join Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomModal;
