
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Room } from "@/types";
import ExpenseTracker from "./ExpenseTracker";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Home, Users, CheckSquare, Clipboard, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import RoommateManagement from "./RoommateManagement";

interface RoomDashboardProps {
  room: Room;
  onRoomUpdate: (room: Room) => void;
}

const RoomDashboard: React.FC<RoomDashboardProps> = ({ room, onRoomUpdate }) => {
  const { toast } = useToast();
  const [pythonRunning, setPythonRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isRoomFull = room.roommates.length >= room.capacity;
  
  const currentUserIsOwner = room.roommates.some(roommate => roommate.isOwner);

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
    setIsLoading(true);
    setPythonRunning(true);
    // This would normally make an API call to trigger your Python script
    setTimeout(() => {
      setPythonRunning(false);
      setIsLoading(false);
      toast({
        title: "Python Script Executed",
        description: "Your Python script was executed successfully",
      });
    }, 2000);
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-roomie-teal" />
        <p className="text-muted-foreground">Loading room data...</p>
        <Progress value={80} className="w-64" />
      </div>
    );
  }

  const capacityUtilization = room ? Math.min(100, (room.roommates.length / room.capacity) * 100) : 0;
  const capacityColor = capacityUtilization < 70 
    ? 'bg-green-500' 
    : capacityUtilization < 90 
      ? 'bg-yellow-500' 
      : 'bg-red-500';

  return (
    <div className="space-y-8">
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

      {isRoomFull && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            This room is at full capacity. No more roommates can join.
          </AlertDescription>
        </Alert>
      )}

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
            <div className="text-2xl font-bold flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span>Capacity: {room?.roommates.length}/{room?.capacity}</span>
                {room?.roommates.length >= room?.capacity && (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-800">
                    Full
                  </Badge>
                )}
              </div>
              <Progress 
                value={capacityUtilization} 
                className="h-2" 
                style={{ width: `${capacityUtilization}%` }}
              >
                <div 
                  className={`h-full ${capacityColor}`} 
                />
              </Progress>
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
            {pythonRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : "Run Python Script"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="roommates" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="roommates">Roommates</TabsTrigger>
          <TabsTrigger value="chores">Chores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTracker room={room} onRoomUpdate={onRoomUpdate} />
        </TabsContent>
        
        <TabsContent value="roommates" className="space-y-4">
          <RoommateManagement 
            room={room} 
            isOwner={currentUserIsOwner} 
            onRoomUpdate={onRoomUpdate} 
          />
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
