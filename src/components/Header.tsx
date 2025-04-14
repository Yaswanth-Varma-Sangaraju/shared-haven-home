
import { Link, useNavigate } from "react-router-dom";
import { Home, Users, LogIn, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

const Header = ({ showHomeLink = true }: { showHomeLink?: boolean }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthAction = () => {
    if (user) {
      // If user is logged in, navigate to user dashboard
      navigate('/dashboard');
    } else {
      // If user is not logged in, navigate to auth page
      navigate('/auth');
    }
  };

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
          {showHomeLink && (
            <Link
              to="/"
              className="flex items-center space-x-1 text-roomie-navy hover:text-roomie-teal transition-colors mr-4"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          )}
          
          {user ? (
            <Avatar onClick={handleAuthAction} className="cursor-pointer">
              <AvatarImage 
                src={user.user_metadata?.avatar_url || undefined} 
                alt={user.user_metadata?.full_name || "User Profile"} 
              />
              <AvatarFallback>
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleAuthAction} 
              className="flex items-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Login / Signup</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
