import { Route, Switch } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import Dashboard from "@/pages/Dashboard";
import PublicDashboard from "@/pages/PublicDashboard";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Logout from "@/pages/Logout";
import NotFound from "@/pages/not-found";
import "./index.css";

/**
 * Root application component configuring routes and layout.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <ErrorBoundary>
        <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/search" component={SearchResults} />
            <Route path="/dashboard-public" component={PublicDashboard} />
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/logout" component={Logout} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
