import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCatalog from "@/pages/admin/AdminCatalog";
import NotFound from "@/pages/not-found";

import { FarmerLayout } from "@/pages/farmer/FarmerLayout";
import FarmerPlaceOrder from "@/pages/farmer/FarmerPlaceOrder";
import FarmerMyOrders from "@/pages/farmer/FarmerMyOrders";
import { WholesalerLayout } from "@/pages/wholesaler/WholesalerLayout";
import WholesalerPlaceOrder from "@/pages/wholesaler/WholesalerPlaceOrder";
import WholesalerMyOrders from "@/pages/wholesaler/WholesalerMyOrders";
import UserProfile from "@/pages/shared/UserProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function FarmerRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/farmer/place-order"); }, []);
  return null;
}

function WholesalerRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/wholesaler/place-order"); }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      {/* Farmer sub-routes */}
      <Route path="/farmer/place-order">
        <ProtectedRoute allowedRoles={["FARMER"]}>
          <FarmerLayout><FarmerPlaceOrder /></FarmerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/farmer/my-orders">
        <ProtectedRoute allowedRoles={["FARMER"]}>
          <FarmerLayout><FarmerMyOrders /></FarmerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/farmer/profile">
        <ProtectedRoute allowedRoles={["FARMER"]}>
          <FarmerLayout><UserProfile /></FarmerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/farmer">
        <ProtectedRoute allowedRoles={["FARMER"]}>
          <FarmerRedirect />
        </ProtectedRoute>
      </Route>

      {/* Wholesaler sub-routes */}
      <Route path="/wholesaler/place-order">
        <ProtectedRoute allowedRoles={["WHOLESALER"]}>
          <WholesalerLayout><WholesalerPlaceOrder /></WholesalerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/wholesaler/my-orders">
        <ProtectedRoute allowedRoles={["WHOLESALER"]}>
          <WholesalerLayout><WholesalerMyOrders /></WholesalerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/wholesaler/profile">
        <ProtectedRoute allowedRoles={["WHOLESALER"]}>
          <WholesalerLayout><UserProfile /></WholesalerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/wholesaler">
        <ProtectedRoute allowedRoles={["WHOLESALER"]}>
          <WholesalerRedirect />
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/inventory">
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminInventory />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/catalog">
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <AdminCatalog />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
           style={{ background: 'linear-gradient(135deg, #0D3B2E 0%, #2E7D52 100%)' }}>
        <div className="text-white text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-2xl font-bold">KrishiBazar</h1>
          <p className="text-white/70 text-sm mt-1">कृषिबजार</p>
        </div>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mt-4" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <InventoryProvider>
            <LanguageProvider>
              <AppContent />
              <Toaster position="top-right" duration={3000} richColors />
            </LanguageProvider>
          </InventoryProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
