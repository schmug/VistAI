import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Site footer with navigation links and OpenRouter attribution.
 */
export default function Footer() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="border-t border-border/50 py-6 mt-auto bg-gradient-to-t from-surface/30 to-transparent">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm">
            <p>
              © {new Date().getFullYear()} VistAI •
              <Link href="/terms" className="ml-1 text-primary hover:text-accent transition-colors">Terms</Link> •
              <Link href="/privacy" className="ml-1 text-primary hover:text-accent transition-colors">Privacy</Link>
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/dashboard-public"}
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <button className="hover:text-primary transition-colors" disabled title="Coming soon">API</button>
            <button className="hover:text-primary transition-colors opacity-50" disabled title="Coming soon">Pricing</button>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors hover:underline">OpenRouter</a>. 
            Each result comes from different AI models. User clicks help determine which models provide the best answers.
          </p>
        </div>
      </div>
    </footer>
  );
}
