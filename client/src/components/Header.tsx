import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Sticky page header containing navigation and the search bar.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const isHomePage = location === "/";
  const { isAuthenticated, user, logout } = useAuth();
  
  // Detect scroll for styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  return (
    <header className={cn(
      "sticky top-0 z-10 backdrop-blur-sm border-b border-border transition-all duration-200",
      scrolled ? "bg-background/95" : "bg-background"
    )}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary">VistAI</h1>
            <span className="text-xs bg-card px-2 py-0.5 rounded-full text-muted-foreground">Beta</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Compact search bar for non-home pages */}
          {!isHomePage && (
            <div className="hidden md:block w-[400px]">
              <SearchBar
                compact={true}
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
              />
            </div>
          )}
          
          <nav className="flex items-center gap-3">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <i className="ri-dashboard-line text-xl"></i>
                <span className="sr-only">Dashboard</span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
                    <i className="ri-user-line"></i>
                    <span className="sr-only">Account</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="font-medium">
                    {user?.username}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <i className="ri-settings-line mr-2"></i>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <i className="ri-logout-circle-line mr-2"></i>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
