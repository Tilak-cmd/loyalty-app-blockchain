import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import {
  LayoutDashboard, Store, Shield, Menu, X, LogOut, Building, User,
  BadgeCheck, Clock, Gift, Settings, Package, Wallet, ArrowRight,
  Home, Search, HelpCircle,
} from "lucide-react";
import Logo from "./Logo";

export default function SidebarLayout({ children }) {
  const { user, merchant, customer, logout: appLogout, isAdmin, isMerchant, isPendingMerchant } = useAuth();
  const { logout: privyLogout, ready } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [];
  if (isAdmin) {
    navItems.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    navItems.push({ to: "/admin", label: "Admin Panel", icon: Shield });
  }
  if (merchant) {
    navItems.push({ to: "/merchant/dashboard", label: "Dashboard", icon: Store });
    navItems.push({ to: "/merchant/products", label: "Products", icon: Package });
  }
  if (customer) {
    navItems.push({ to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard });
    navItems.push({ to: "/customer/redeem", label: "Redeem", icon: Gift });
    navItems.push({ to: "/customer/profile", label: "Profile", icon: User });
  }
  if (!user && !merchant && !customer) {
    navItems.push({ to: "/", label: "Home", icon: Home });
    navItems.push({ to: "/merchants", label: "Browse Merchants", icon: Store });
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    if (ready) await privyLogout();
    appLogout();
    navigate("/", { replace: true });
  };

  const active = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const roleBadge = () => {
    if (isAdmin) return { label: "Admin", color: "bg-brand-100 text-brand-700", icon: Shield };
    if (isPendingMerchant) return { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock };
    if (isMerchant) return { label: "Merchant", color: "bg-emerald-100 text-emerald-700", icon: Store };
    if (customer) return { label: "Customer", color: "bg-blue-100 text-blue-700", icon: User };
    return { label: "Guest", color: "bg-gray-100 text-gray-700", icon: User };
  };
  const badge = roleBadge();
  const displayEmail = user?.email || merchant?.email || customer?.email || "";

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-full w-64 bg-surface border-r border-border-primary flex flex-col",
        "transition-all duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border-primary shrink-0">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active(item.to)
                  ? "bg-brand-50 text-brand-700"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border-primary p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
              badge.color,
            )}>
              <badge.icon className="w-3.5 h-3.5" />
              {badge.label}
            </div>
          </div>
          {displayEmail && (
            <p className="px-1 text-xs text-text-tertiary truncate">{displayEmail}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border-primary h-14 flex items-center px-4 sm:px-6 gap-3">
          <button className="md:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
              badge.color,
            )}>
              <badge.icon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
            {displayEmail && (
              <span className="text-sm text-text-tertiary max-w-[160px] truncate">{displayEmail}</span>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
