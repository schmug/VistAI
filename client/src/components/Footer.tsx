import { Link } from "wouter";

/**
 * Site footer with navigation links and OpenRouter attribution.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm">
            <p>
              © {new Date().getFullYear()} VistAI • 
              <button className="hover:text-primary ml-1">Terms</button> • 
              <button className="hover:text-primary ml-1">Privacy</button>
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
            <button className="hover:text-primary">API</button>
            <button className="hover:text-primary">Pricing</button>
            <button className="hover:text-primary">Contact</button>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a>. 
            Each result comes from different AI models. User clicks help determine which models provide the best answers.
          </p>
        </div>
      </div>
    </footer>
  );
}
