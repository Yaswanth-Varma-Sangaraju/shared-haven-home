
import React, { useState, useEffect } from "react";
import { Room, Roommate } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, UserX, UserMinus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RoommateManagementProps {
  room: Room;
  isOwner: boolean;
  onRoomUpdate: (room: Room) => void;
}

interface PendingRoommate {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  status: 'pending';
  joinedAt: Date;
}

const RoommateManagement: React.FC<RoommateManagementProps> = ({ room, isOwner, onRoomUpdate }) => {
  const [pendingRoommates, setPendingRoommates] = useState<PendingRoommate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch pending roommates (those who have used invite code but haven't been approved)
  useEffect(() => {
    if (!isOwner) return;
    
    const fetchPendingRoommates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('roommates')
          .select('*')
          .eq('room_id', room.id)
          .eq('status', 'pending');
        
        if (error) throw error;
        
        const pendingUsers = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email || undefined,
          phoneNumber: user.phone_number || undefined,
          status: 'pending' as const,
          joinedAt: new Date(user.joined_at)
        }));
        
        setPendingRoommates(pendingUsers);
      } catch (error) {
        console.error('Error fetching pending roommates:', error);
        toast({
          title: "Error",
          description: "Failed to load pending roommate requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRoommates();
  }, [room.id, isOwner]);

  // Accept a pending roommate
  const acceptRoommate = async (roommateId: string) => {
    if (!isOwner) {
      toast({
        title: "Permission Denied",
        description: "Only room owners can accept roommate requests",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(roommateId));
    
    try {
      const { error } = await supabase
        .from('roommates')
        .update({ status: 'approved' })
        .eq('id', roommateId);
      
      if (error) throw error;
      
      // Update UI by removing from pending and adding to approved
      setPendingRoommates(prev => prev.filter(rm => rm.id !== roommateId));
      
      toast({
        title: "Roommate Accepted",
        description: "The roommate has been approved to join the room",
      });
      
      // Refresh room data to reflect changes
      const { data: updatedRoom } = await supabase
        .from('rooms')
        .select(`
          *,
          roommates (*)
        `)
        .eq('id', room.id)
        .single();
        
      if (updatedRoom) {
        const newRoom = {
          ...room,
          roommates: updatedRoom.roommates.map(rm => ({
            id: rm.id,
            name: rm.name,
            email: rm.email || undefined,
            phoneNumber: rm.phone_number || undefined,
            joinedAt: new Date(rm.joined_at),
            isOwner: rm.is_owner,
            status: rm.status as 'pending' | 'approved'
          }))
        };
        onRoomUpdate(newRoom);
      }
    } catch (error) {
      console.error('Error accepting roommate:', error);
      toast({
        title: "Error",
        description: "Failed to accept roommate",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(roommateId);
        return updated;
      });
    }
  };

  // Decline a pending roommate
  const declineRoommate = async (roommateId: string) => {
    if (!isOwner) {
      toast({
        title: "Permission Denied",
        description: "Only room owners can decline roommate requests",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(roommateId));
    
    try {
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('id', roommateId);
      
      if (error) throw error;
      
      // Update UI
      setPendingRoommates(prev => prev.filter(rm => rm.id !== roommateId));
      
      toast({
        title: "Request Declined",
        description: "The roommate request has been declined",
      });
    } catch (error) {
      console.error('Error declining roommate:', error);
      toast({
        title: "Error",
        description: "Failed to decline roommate request",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(roommateId);
        return updated;
      });
    }
  };

  // Remove an existing roommate
  const removeRoommate = async (roommateId: string) => {
    if (!isOwner) {
      toast({
        title: "Permission Denied",
        description: "Only room owners can remove roommates",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(roommateId));
    
    try {
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('id', roommateId);
      
      if (error) throw error;
      
      // Update UI
      const updatedRoom = {
        ...room,
        roommates: room.roommates.filter(rm => rm.id !== roommateId)
      };
      
      onRoomUpdate(updatedRoom);
      
      toast({
        title: "Roommate Removed",
        description: "The roommate has been removed from the room",
      });
    } catch (error) {
      console.error('Error removing roommate:', error);
      toast({
        title: "Error",
        description: "Failed to remove roommate",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const updated = new Set(prev);
        updated.delete(roommateId);
        return updated;
      });
    }
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <>
          {/* Pending Roommates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-amber-500" />
                Pending Requests
              </CardTitle>
              <CardDescription>
                Users waiting for approval to join your room
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingRoommates.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No pending requests at this time
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingRoommates.map((roommate) => (
                    <div 
                      key={roommate.id} 
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{roommate.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 mr-2">
                            Pending
                          </Badge>
                          Requested {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }).format(roommate.joinedAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => acceptRoommate(roommate.id)}
                          disabled={processingIds.has(roommate.id)}
                        >
                          {processingIds.has(roommate.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => declineRoommate(roommate.id)}
                          disabled={processingIds.has(roommate.id)}
                        >
                          {processingIds.has(roommate.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Current Roommates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5 text-roomie-amber" />
            Current Roommates
          </CardTitle>
          <CardDescription>
            People currently sharing this room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.roommates.map((roommate) => (
              <div 
                key={roommate.id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{roommate.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(roommate.joinedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {roommate.isOwner && (
                    <Badge className="bg-roomie-teal/10 text-roomie-teal border-roomie-teal/20">
                      Owner
                    </Badge>
                  )}
                  {isOwner && !roommate.isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove roommate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {roommate.name} from the room? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => removeRoommate(roommate.id)}
                          >
                            {processingIds.has(roommate.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : "Remove"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoommateManagement;
