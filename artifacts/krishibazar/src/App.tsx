import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import FarmerDashboard from "@/pages/FarmerDashboard";
import WholesalerDashboard from "@/pages/WholesalerDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCatalog from "@/pages/admin/AdminCatalog";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      <Route path="/farmer">
        <ProtectedRoute allowedRoles={['FARMER']}>
          <FarmerDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/wholesaler">
        <ProtectedRoute allowedRoles={['WHOLESALER']}>
          <WholesalerDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/orders">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminOrders />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/inventory">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminInventory />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminUsers />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/catalog">
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminCatalog />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <InventoryProvider>
            <LanguageProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster position="top-right" duration={3000} richColors />
            </LanguageProvider>
          </InventoryProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
