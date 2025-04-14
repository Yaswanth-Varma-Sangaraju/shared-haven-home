
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, ArrowRight } from "lucide-react";
import RoomCreationModal from "@/components/RoomCreationModal";
import JoinRoomModal from "@/components/JoinRoomModal";
import Header from "@/components/Header";

const Index = () => {
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showHomeLink={false} />
      
      <div className="flex-1 flex flex-col items-center justify-center hero-gradient p-4">
        <div className="max-w-3xl w-full text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-roomie-dark leading-tight">
            Manage Your Shared Living Space{" "}
            <span className="text-roomie-teal">Effortlessly</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track expenses, manage chores, and coordinate responsibilities with your roommates in one simple platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={() => setShowCreateRoomModal(true)}
              className="text-lg py-6 px-8 bg-roomie-teal hover:bg-roomie-teal/90 group"
            >
              <UserPlus className="mr-2 h-5 w-5 group-hover:animate-bounce-subtle" />
              Create Room
            </Button>
            
            <Button
              onClick={() => setShowJoinRoomModal(true)}
              variant="outline"
              className="text-lg py-6 px-8 border-roomie-amber text-roomie-amber hover:bg-roomie-amber/10 hover:text-roomie-amber group"
            >
              <UserCheck className="mr-2 h-5 w-5 group-hover:animate-bounce-subtle" />
              Join Room
            </Button>
          </div>
        </div>

        <div className="mt-16 md:mt-28 w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="💰"
              title="Split Expenses"
              description="Track who paid for what and split costs fairly among roommates."
            />
            <FeatureCard
              icon="🧹"
              title="Manage Chores"
              description="Create chore schedules and ensure everyone does their fair share."
            />
            <FeatureCard
              icon="🔗"
              title="Easy Sharing"
              description="Invite roommates with a simple code or shareable link."
            />
          </div>
        </div>
      </div>

      <footer className="bg-white py-6 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>SharedHaven - Making shared living simpler and more organized.</p>
        </div>
      </footer>

      <RoomCreationModal 
        open={showCreateRoomModal} 
        onOpenChange={setShowCreateRoomModal} 
      />
      
      <JoinRoomModal 
        open={showJoinRoomModal} 
        onOpenChange={setShowJoinRoomModal} 
      />
    </div>
  );
};

// Helper component for feature cards
const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center transform transition-transform hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Index;
