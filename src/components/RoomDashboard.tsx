
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Room } from "@/types";
import ExpenseTracker from "./ExpenseTracker";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Home, Users, CheckSquare, Clipboard, ExternalLink } from "lucide-react";

interface RoomDashboardProps {
  room: Room;
  onRoomUpdate: (room: Room) => void;
}

const RoomDashboard: React.FC<RoomDashboardProps> = ({ room, onRoomUpdate }) => {
  const { toast } = useToast();
  const [pythonRunning, setPythonRunning] = useState(false);

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
  };

  const getInviteLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?code=${room.inviteCode}`;
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const runPythonScript = () => {
    setPythonRunning(true);
    // This would normally make an API call to trigger your Python script
    setTimeout(() => {
      setPythonRunning(false);
      toast({
        title: "Python Script Executed",
        description: "Your Python script was executed successfully",
      });
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Room Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="text-muted-foreground flex items-center">
            <Home className="h-4 w-4 mr-1" /> {room.address}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline" 
            className="flex items-center" 
            onClick={copyInviteCode}
          >
            Invite Code: {room.inviteCode}
            <Copy className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            className="bg-roomie-amber hover:bg-roomie-amber/90 flex items-center" 
            onClick={copyInviteLink}
          >
            Invite Link
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Room Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Room Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {room.type}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Roommates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {room.roommates.length} / {room.capacity}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(room.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Python Script Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clipboard className="mr-2 h-5 w-5 text-roomie-teal" />
            Run Python Script
          </CardTitle>
          <CardDescription>
            Execute custom Python script for additional functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full md:w-auto bg-roomie-navy hover:bg-roomie-navy/90"
            onClick={runPythonScript}
            disabled={pythonRunning}
          >
            {pythonRunning ? "Running..." : "Run Python Script"}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="roommates">Roommates</TabsTrigger>
          <TabsTrigger value="chores">Chores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTracker room={room} onRoomUpdate={onRoomUpdate} />
        </TabsContent>
        
        <TabsContent value="roommates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-roomie-amber" />
                Roommates
              </CardTitle>
              <CardDescription>
                All roommates in {room.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {room.roommates.map((roommate) => (
                  <div 
                    key={roommate.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{roommate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {formatDate(roommate.joinedAt)}
                      </p>
                    </div>
                    {roommate.isOwner && (
                      <div className="bg-roomie-teal/10 text-roomie-teal text-xs font-medium px-2 py-1 rounded">
                        Room Owner
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-roomie-teal" />
                Chores
              </CardTitle>
              <CardDescription>
                Coming soon! Track and assign chores to roommates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Chores management functionality will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomDashboard;
