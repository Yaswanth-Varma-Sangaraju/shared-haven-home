
import { Link } from "react-router-dom";
import { Home, Users, LayoutDashboard } from "lucide-react";
import { getCurrentRoom } from "@/lib/roomUtils";
import { Button } from "@/components/ui/button";

const Header = ({ showHomeLink = true }: { showHomeLink?: boolean }) => {
  const currentRoom = getCurrentRoom();
  
  return (
    <header className="w-full bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-roomie-teal" />
          <h1 className="text-xl font-semibold text-roomie-dark">
            SharedHaven
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {currentRoom && (
            <Link
              to={`/dashboard/${currentRoom.id}`}
              className="flex items-center space-x-1 text-roomie-navy hover:text-roomie-teal transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          )}
          {showHomeLink && (
            <Link
              to="/"
              className="flex items-center space-x-1 text-roomie-navy hover:text-roomie-teal transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
