import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import "./index.css";

// Lazy load page components for code splitting
const Home = lazy(() => import("@/pages/Home"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PublicDashboard = lazy(() => import("@/pages/PublicDashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Logout = lazy(() => import("@/pages/Logout"));
const NotFound = lazy(() => import("@/pages/not-found"));

/**
 * Root application component configuring routes and layout.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <ErrorBoundary>
        <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
          <Suspense fallback={<LoadingSkeleton count={3} />}>
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
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
