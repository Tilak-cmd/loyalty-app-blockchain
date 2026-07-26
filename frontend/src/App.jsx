import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
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
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
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
  );
}

function DashboardContent() {
  const { user, merchant, customer } = useAuth();
  if (user?.isAdmin) return <AdminPanel />;
  if (merchant) return <MerchantDashboard />;
  if (customer) return <CustomerDashboard />;
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-gray-700">Welcome</h1>
      <p className="text-gray-500 mt-2">Use the sidebar to navigate</p>
    </div>
  );
}
