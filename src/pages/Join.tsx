import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { findRoomByInviteCode } from "@/lib/roomUtils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { joinRoom } from "@/lib/roomUtils";
import { AlertCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";

const formSchema = z.object({
  userName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

const Join: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: "",
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No invite code provided in the URL");
      setLoading(false);
      return;
    }

    setInviteCode(code);
    
    const verifyRoom = async () => {
      try {
        const room = await findRoomByInviteCode(code);
        if (!room) {
          setError("Invalid invite code. Room not found.");
        } else {
          setRoomName(room.name);
          
          // Check if room is at capacity
          if (room.roommates.length >= room.capacity) {
            setIsRoomFull(true);
          }
        }
      } catch (err) {
        console.error("Error verifying invite code:", err);
        setError("Error verifying invite code. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verifyRoom();
  }, [searchParams]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!inviteCode) return;
    
    setJoining(true);
    setDuplicateError(null);
    
    try {
      // Check for duplicate users
      const room = await findRoomByInviteCode(inviteCode);
      if (!room) {
        toast({
          title: "Error",
          description: "Room not found. Please check the invite code.",
          variant: "destructive",
        });
        setJoining(false);
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
        setJoining(false);
        return;
      }
      
      if (duplicateEmail) {
        setDuplicateError("This email is already used by someone in the room. Please use a different email.");
        setJoining(false);
        return;
      }
      
      if (duplicatePhone) {
        setDuplicateError("This phone number is already used by someone in the room. Please use a different number.");
        setJoining(false);
        return;
      }
      
      const joinedRoom = await joinRoom(
        inviteCode,
        values.userName,
        values.email,
        values.phoneNumber
      );
      
      if (joinedRoom) {
        toast({
          title: "Room joined!",
          description: `You've successfully joined ${joinedRoom.name}`,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to join the room. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error joining room:", err);
      toast({
        title: "Error",
        description: "Something went wrong while joining the room",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Join Room</CardTitle>
            <CardDescription>
              {loading ? "Verifying invite code..." : roomName ? `Join ${roomName}` : "Enter your details to join the room"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-roomie-teal" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : isRoomFull ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Room is Full</AlertTitle>
                <AlertDescription>
                  This room is already at capacity and cannot accept more roommates.
                </AlertDescription>
              </Alert>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {duplicateError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {duplicateError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
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

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-roomie-amber hover:bg-roomie-amber/90"
                      disabled={joining || isRoomFull}
                    >
                      {joining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join Room"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")} className="mt-2">
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Join;
