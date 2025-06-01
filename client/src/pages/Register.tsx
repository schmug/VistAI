import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { parseError, AppError } from "@/lib/errorHandling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorNotification } from "@/components/ErrorNotification";
import { useLocation } from "wouter";

/**
 * Registration page for creating new user accounts.
 */
export default function Register() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      await register(username, password);
      navigate("/");
    } catch (err: any) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !username || password.length < 8}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline"
              >
                Login here
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
      
      <ErrorNotification
        error={error}
        onDismiss={() => setError(null)}
        onRetry={() => {
          if (username && password && password.length >= 6) {
            handleSubmit({ preventDefault: () => {} } as React.FormEvent);
          }
        }}
      />
    </div>
  );
}
