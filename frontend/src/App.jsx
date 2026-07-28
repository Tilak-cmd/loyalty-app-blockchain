import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/toast";
import { LoadingState } from "./components/ui/empty-state";
import Landing from "./pages/Landing";
import MerchantAuth from "./pages/MerchantAuth";
import CustomerAuth from "./pages/CustomerAuth";
import AdminLogin from "./pages/AdminLogin";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerRedeem from "./pages/CustomerRedeem";
import MerchantProducts from "./pages/MerchantProducts";
import AdminPanel from "./pages/AdminPanel";
import SidebarLayout from "./components/SidebarLayout";

function AppShell({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {
  const { merchant, user, customer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={user || merchant || customer ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/merchant/login" element={merchant ? <Navigate to="/merchant/dashboard" /> : <MerchantAuth />} />
        <Route path="/customer/auth" element={customer ? <Navigate to="/customer/dashboard" /> : <CustomerAuth />} />
        <Route path="/admin/login" element={user?.isAdmin ? <Navigate to="/admin" /> : <AdminLogin />} />
        <Route path="/dashboard" element={<AppShell><DashboardContent /></AppShell>} />
        <Route path="/merchant/dashboard" element={merchant ? <AppShell><MerchantDashboard /></AppShell> : <Navigate to="/merchant/login" />} />
        <Route path="/merchant/products" element={merchant ? <AppShell><MerchantProducts /></AppShell> : <Navigate to="/merchant/login" />} />
        <Route path="/customer/dashboard" element={customer ? <AppShell><CustomerDashboard /></AppShell> : <Navigate to="/customer/auth" />} />
        <Route path="/customer/profile" element={customer ? <AppShell><CustomerProfile /></AppShell> : <Navigate to="/customer/auth" />} />
        <Route path="/customer/redeem" element={customer ? <AppShell><CustomerRedeem /></AppShell> : <Navigate to="/customer/auth" />} />
        <Route path="/admin" element={user?.isAdmin ? <AppShell><AdminPanel /></AppShell> : <Navigate to="/admin/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ToastProvider>
  );
}

function DashboardContent() {
  const { user, merchant, customer } = useAuth();
  if (user?.isAdmin) return <AdminPanel />;
  if (merchant) return <MerchantDashboard />;
  if (customer) return <CustomerDashboard />;
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">Welcome</h2>
      <p className="text-sm text-text-tertiary mt-1">Sign in to access your dashboard</p>
    </div>
  );
}
