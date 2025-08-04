import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./i18n";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/EmployeeList";
import AddEmployee from "./pages/AddEmployee";
import AccomplishmentsList from "./pages/AccomplishmentsList";
import AddAccomplishment from "./pages/AddAccomplishment";
import AccomplishmentDetails from "./pages/AccomplishmentDetails";
import CompareEmployees from "./pages/CompareEmployees";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import GalleryPage from "./pages/Gallery";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({
  children,
  requiredRole = null,
}: {
  children: React.ReactNode;
  requiredRole?: string | null;
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App component with RTL support
const AppContent = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set direction based on language
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="accomplishments" element={<AccomplishmentsList />} />
            <Route
              path="accomplishments/add"
              element={
                <ProtectedRoute requiredRole="employee">
                  <AddAccomplishment />
                </ProtectedRoute>
              }
            />
            <Route
              path="accomplishments/:id"
              element={<AccomplishmentDetails />}
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute requiredRole="manager">
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/add"
              element={
                <ProtectedRoute requiredRole="manager">
                  <AddEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/compare"
              element={
                <ProtectedRoute requiredRole="manager">
                  <CompareEmployees />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={<div>Loading...</div>}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </Suspense>
  </QueryClientProvider>
);

export default App;
