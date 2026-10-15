import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Symptoms from "./pages/Symptoms";
import Pcos from "./pages/Pcos";
import Settings from "./pages/Settings";

function LoadingPage() {
  return (
    <div className="auth-loading">
      <span className="spinner" /> Loading your private space…
    </div>
  );
}
function Private({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}
function Public({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}
function Router() {
  return (
    <Switch>
      <Route path="/">
        <Public>
          <Login />
        </Public>
      </Route>
      <Route path="/login">
        <Public>
          <Login />
        </Public>
      </Route>
      <Route path="/register">
        <Public>
          <Register />
        </Public>
      </Route>
      <Route path="/dashboard">
        <Private>
          <Dashboard />
        </Private>
      </Route>
      <Route path="/chat">
        <Private>
          <Chat />
        </Private>
      </Route>
      <Route path="/chat/:id">
        <Private>
          <Chat />
        </Private>
      </Route>
      <Route path="/symptoms">
        <Private>
          <Symptoms />
        </Private>
      </Route>
      <Route path="/pcos">
        <Private>
          <Pcos />
        </Private>
      </Route>
      <Route path="/settings">
        <Private>
          <Settings />
        </Private>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
