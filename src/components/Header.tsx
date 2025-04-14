
import { Link } from "react-router-dom";
import { Home, Users } from "lucide-react";

const Header = ({ showHomeLink = true }: { showHomeLink?: boolean }) => {
  return (
    <header className="w-full bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-roomie-teal" />
          <h1 className="text-xl font-semibold text-roomie-dark">
            SharedHaven
          </h1>
        </div>
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
    </header>
  );
};

export default Header;
