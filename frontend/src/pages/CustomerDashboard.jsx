import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs } from "../components/ui/tabs";
import { Skeleton, SkeletonCard } from "../components/ui/skeleton";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/empty-state";
import { Progress, TierProgress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
import { customerApi } from "../services/endpoints";

import {
  Gift, TrendingUp, Award, ArrowRight, User,
  Clock, ChevronRight,
  RefreshCw, MapPin,
} from "lucide-react";

export default function CustomerDashboard() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("activity");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, txRes] = await Promise.all([
        customerApi.profile(),
        customerApi.transactions(),
      ]);
      setProfile(profRes.data.customer);
      setTransactions(txRes.data.transactions || []);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load dashboard");
    }
    setLoading(false);
  };

  useEffect(() => { if (customer) load(); }, [customer]);

  if (!customer) return null;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || customer.email || "Customer";
  const balance = parseInt(profile?.pointsBalance || "0");
  const earned = transactions.filter(t => t.type === "AWARD").reduce((s, t) => s + parseInt(t.amount || "0"), 0);
  const redeemed = transactions.filter(t => t.type === "REDEEM").reduce((s, t) => s + parseInt(t.amount || "0"), 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-tertiary font-medium">Welcome back</p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">{fullName}</h1>
          {profile?.username && <p className="text-sm text-text-tertiary">@{profile.username}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => navigate("/customer/redeem")}>
            Redeem Points <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-brand-200">Available Balance</p>
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {balance.toLocaleString()}
              <span className="text-lg sm:text-xl text-brand-200 ml-2 font-medium">points</span>
            </p>
            {profile?.email && <p className="text-sm text-brand-300">{profile.email}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
              onClick={() => navigate("/customer/redeem")}
            >
              <Gift className="w-4 h-4" /> Redeem
            </Button>
            <Button
              size="lg"
              className="bg-white text-brand-700 hover:bg-brand-50"
              onClick={() => navigate("/customer/profile")}
            >
              <User className="w-4 h-4" /> Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Earned</p>
                <p className="text-xl font-semibold text-text-primary">{earned.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Gift className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Redeemed</p>
                <p className="text-xl font-semibold text-text-primary">{redeemed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-text-tertiary">Transactions</p>
                <p className="text-xl font-semibold text-text-primary">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs
                tabs={[
                  { key: "activity", label: "Recent Activity  " },
                  { key: "earned", label: "Earned" },
                  { key: "redeemed", label: "Redeemed" },
                ]}
                value={tab}
                onChange={setTab}
                variant="underline"
              />
            </CardContent>
          </Card>

          <div className="space-y-2">
            {transactions.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No activity yet"
                description="Visit a merchant to earn your first points!"
                action={{ label: "Find Merchants", props: { onClick: () => navigate("/customer/redeem") } }}
              />
            ) : (
              transactions
                .filter(t => tab === "activity" || t.type === tab.toUpperCase())
                .slice(0, 10)
                .map((tx, i) => (
                  <Card key={tx.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <CardContent className="py-3.5 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            tx.type === "AWARD" ? "bg-emerald-50" : "bg-red-50",
                          )}>
                            {tx.type === "AWARD" ? (
                              <Award className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Gift className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                            <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary">
                              {tx.type === "AWARD" ? "Points Earned" : "Points Redeemed"}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {tx.merchant?.businessName && <span className="font-medium">{tx.merchant.businessName}{tx.product?.name ? ` • ${tx.product.name}` : ""} · </span>}
                              {new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className={cn(
                            "text-sm font-semibold",
                            tx.type === "AWARD" ? "text-emerald-600" : "text-red-500",
                          )}>
                            {tx.type === "AWARD" ? "+" : "-"}{parseInt(tx.amount).toLocaleString()}
                          </p>
                          {tx.txHash?.startsWith?.("0x") && (
            <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline font-mono block mt-1">
              {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
            </a>
          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card hover className="cursor-pointer" onClick={() => navigate("/customer/profile")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-600" />
                  <span className="text-sm font-medium text-text-primary">Edit Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </div>
            </CardContent>
          </Card>

          {profile?.country && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-secondary">
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  {profile?.language && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">Language: {profile.language}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
