import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";
import { Link, useLocation } from "wouter";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * Sticky page header containing navigation and the search bar.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const isHomePage = location === "/";
  const { user, logout } = useAuth();
  
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
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <i className="ri-dashboard-line text-xl"></i>
              <span className="sr-only">Dashboard</span>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="ml-2 w-8 h-8 rounded-full bg-primary/20 text-primary hover:bg-primary/30 p-0">
                    <i className="ri-user-line"></i>
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>{user.username}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => logout()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
