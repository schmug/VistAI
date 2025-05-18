import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import SearchBar from "./SearchBar";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, query?: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = currentPage === "home";
  
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
          <button 
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2"
          >
            <h1 className="text-xl font-bold text-primary">VistAI</h1>
            <span className="text-xs bg-card px-2 py-0.5 rounded-full text-muted-foreground">Beta</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Compact search bar for non-home pages */}
          {!isHomePage && (
            <div className="hidden md:block w-[400px]">
              <SearchBar 
                compact={true} 
                onSearch={(query) => onNavigate("search", query)}
              />
            </div>
          )}
          
          <nav className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate("dashboard")}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <i className="ri-dashboard-line text-xl"></i>
              <span className="sr-only">Dashboard</span>
            </button>
            
            <button 
              className="ml-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
            >
              <i className="ri-user-line"></i>
              <span className="sr-only">Account</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
